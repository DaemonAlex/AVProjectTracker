const express = require('express');
const { Project, User, AuditLog } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.Role?.name;
    
    // Base where clause for role-based filtering
    let projectWhere = {};
    if (userRole === 'client') {
      projectWhere.metadata = {
        clientUserId: userId
      };
    } else if (userRole === 'technician') {
      projectWhere.teamMembers = {
        [Op.contains]: [userId]
      };
    }
    
    // Get project counts by status
    const statusCounts = await Project.count({
      where: projectWhere,
      group: 'status',
      attributes: ['status']
    });
    
    const statusMap = {};
    statusCounts.forEach(item => {
      statusMap[item.status] = parseInt(item.count);
    });
    
    // Get total projects
    const totalProjects = await Project.count({ where: projectWhere });
    
    // Get projects by type
    const typeCounts = await Project.count({
      where: projectWhere,
      group: 'type',
      attributes: ['type']
    });
    
    // Get overdue projects
    const overdueProjects = await Project.count({
      where: {
        ...projectWhere,
        endDate: { [Op.lt]: new Date() },
        status: { [Op.ne]: 'completed' }
      }
    });
    
    // Get budget information
    const budgetData = await Project.findAll({
      where: projectWhere,
      attributes: ['estimatedBudget', 'actualBudget', 'status'],
      raw: true
    });
    
    const totalEstimatedBudget = budgetData.reduce((sum, p) => sum + (parseFloat(p.estimatedBudget) || 0), 0);
    const totalActualBudget = budgetData.reduce((sum, p) => sum + (parseFloat(p.actualBudget) || 0), 0);
    
    // Calculate average progress
    const progressData = await Project.findAll({
      where: projectWhere,
      attributes: ['progress'],
      raw: true
    });
    
    const averageProgress = totalProjects > 0 
      ? Math.round(progressData.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjects)
      : 0;
    
    // Get team utilization (simplified calculation)
    const activeProjects = statusMap.active || 0;
    const totalTeamMembers = await User.count({
      where: { isActive: true, roleId: { [Op.in]: [3, 4] } } // Team Lead and Technician
    });
    const teamUtilization = totalTeamMembers > 0 ? Math.min(Math.round((activeProjects / totalTeamMembers) * 100), 100) : 0;
    
    // Get recent activity count
    const recentActivity = await AuditLog.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    
    // Calculate trends (simplified - comparing to previous period)
    const lastMonthProjects = await Project.count({
      where: {
        ...projectWhere,
        createdAt: {
          [Op.between]: [
            new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)  // 30 days ago
          ]
        }
      }
    });
    
    const thisMonthProjects = await Project.count({
      where: {
        ...projectWhere,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });
    
    const projectGrowth = lastMonthProjects > 0 
      ? Math.round(((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100)
      : thisMonthProjects > 0 ? 100 : 0;
    
    const metrics = {
      overview: {
        totalProjects,
        activeProjects: statusMap.active || 0,
        completedProjects: statusMap.completed || 0,
        onHoldProjects: statusMap['on-hold'] || 0,
        cancelledProjects: statusMap.cancelled || 0,
        overdueProjects,
        averageProgress,
        teamUtilization,
        recentActivity
      },
      financial: {
        totalEstimatedBudget,
        totalActualBudget,
        budgetUtilization: totalEstimatedBudget > 0 
          ? Math.round((totalActualBudget / totalEstimatedBudget) * 100)
          : 0
      },
      trends: {
        projectGrowth,
        completionRate: totalProjects > 0 
          ? Math.round(((statusMap.completed || 0) / totalProjects) * 100)
          : 0
      },
      distribution: {
        byStatus: statusMap,
        byType: typeCounts.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {})
      }
    };
    
    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// GET /api/dashboard/charts - Get chart data
router.get('/charts', authenticate, async (req, res) => {
  try {
    const { type = 'status', period = '30' } = req.query;
    const userId = req.user.id;
    const userRole = req.user.Role?.name;
    
    // Role-based filtering
    let projectWhere = {};
    if (userRole === 'client') {
      projectWhere.metadata = { clientUserId: userId };
    } else if (userRole === 'technician') {
      projectWhere.teamMembers = { [Op.contains]: [userId] };
    }
    
    // Date range based on period
    const periodDays = parseInt(period);
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    
    let chartData = {};
    
    switch (type) {
      case 'status':
        const statusData = await Project.count({
          where: {
            ...projectWhere,
            updatedAt: { [Op.gte]: startDate }
          },
          group: 'status',
          attributes: ['status']
        });
        
        chartData = {
          labels: statusData.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1)),
          datasets: [{
            data: statusData.map(item => parseInt(item.count)),
            backgroundColor: [
              '#22c55e', // active - green
              '#0ea5e9', // completed - blue
              '#f59e0b', // on-hold - yellow
              '#ef4444'  // cancelled - red
            ]
          }]
        };
        break;
        
      case 'progress':
        // Get progress trends over time (weekly averages)
        const progressData = await Project.findAll({
          where: {
            ...projectWhere,
            updatedAt: { [Op.gte]: startDate }
          },
          attributes: ['progress', 'updatedAt'],
          order: [['updatedAt', 'ASC']],
          raw: true
        });
        
        // Group by week and calculate averages
        const weeklyProgress = {};
        progressData.forEach(project => {
          const week = new Date(project.updatedAt).toISOString().slice(0, 10);
          if (!weeklyProgress[week]) {
            weeklyProgress[week] = { sum: 0, count: 0 };
          }
          weeklyProgress[week].sum += project.progress || 0;
          weeklyProgress[week].count += 1;
        });
        
        const progressLabels = Object.keys(weeklyProgress).sort();
        const progressValues = progressLabels.map(week => 
          Math.round(weeklyProgress[week].sum / weeklyProgress[week].count)
        );
        
        chartData = {
          labels: progressLabels.map(date => new Date(date).toLocaleDateString()),
          datasets: [{
            label: 'Average Progress',
            data: progressValues,
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };
        break;
        
      case 'budget':
        const budgetData = await Project.findAll({
          where: {
            ...projectWhere,
            updatedAt: { [Op.gte]: startDate }
          },
          attributes: ['estimatedBudget', 'actualBudget', 'name'],
          raw: true
        });
        
        chartData = {
          labels: budgetData.map(p => p.name.slice(0, 20) + '...'),
          datasets: [
            {
              label: 'Estimated',
              data: budgetData.map(p => parseFloat(p.estimatedBudget) || 0),
              backgroundColor: '#0ea5e9'
            },
            {
              label: 'Actual',
              data: budgetData.map(p => parseFloat(p.actualBudget) || 0),
              backgroundColor: '#22c55e'
            }
          ]
        };
        break;
        
      default:
        chartData = { labels: [], datasets: [] };
    }
    
    res.json({ chartData, type, period });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// GET /api/dashboard/recent-projects - Get recent projects
router.get('/recent-projects', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.Role?.name;
    
    // Role-based filtering
    let projectWhere = {};
    if (userRole === 'client') {
      projectWhere.metadata = { clientUserId: userId };
    } else if (userRole === 'technician') {
      projectWhere.teamMembers = { [Op.contains]: [userId] };
    }
    
    const projects = await Project.findAll({
      where: projectWhere,
      include: [{ 
        model: User, 
        as: 'owner', 
        attributes: ['id', 'name', 'email'] 
      }],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    const recentProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      client: project.client,
      status: project.status,
      priority: project.priority,
      progress: project.progress,
      startDate: project.startDate,
      endDate: project.endDate,
      estimatedBudget: project.estimatedBudget,
      actualBudget: project.actualBudget,
      owner: project.owner,
      isOverdue: project.isOverdue(),
      daysRemaining: project.getDaysRemaining(),
      tasksCount: project.tasks ? project.tasks.length : 0,
      completedTasks: project.tasks ? project.tasks.filter(t => t.status === 'completed').length : 0
    }));
    
    res.json({ projects: recentProjects });
  } catch (error) {
    console.error('Error fetching recent projects:', error);
    res.status(500).json({ error: 'Failed to fetch recent projects' });
  }
});

// GET /api/dashboard/alerts - Get dashboard alerts
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.Role?.name;
    
    // Role-based filtering
    let projectWhere = {};
    if (userRole === 'client') {
      projectWhere.metadata = { clientUserId: userId };
    } else if (userRole === 'technician') {
      projectWhere.teamMembers = { [Op.contains]: [userId] };
    }
    
    const alerts = [];
    
    // Overdue projects
    const overdueProjects = await Project.findAll({
      where: {
        ...projectWhere,
        endDate: { [Op.lt]: new Date() },
        status: { [Op.ne]: 'completed' }
      },
      attributes: ['id', 'name', 'endDate'],
      raw: true
    });
    
    overdueProjects.forEach(project => {
      const daysOverdue = Math.ceil((new Date() - new Date(project.endDate)) / (1000 * 60 * 60 * 24));
      alerts.push({
        type: 'overdue',
        severity: 'high',
        title: 'Project Overdue',
        message: `${project.name} is ${daysOverdue} days overdue`,
        projectId: project.id,
        timestamp: new Date().toISOString()
      });
    });
    
    // Projects due soon
    const dueSoonDate = new Date();
    dueSoonDate.setDate(dueSoonDate.getDate() + 7); // Next 7 days
    
    const dueSoonProjects = await Project.findAll({
      where: {
        ...projectWhere,
        endDate: {
          [Op.between]: [new Date(), dueSoonDate]
        },
        status: { [Op.ne]: 'completed' }
      },
      attributes: ['id', 'name', 'endDate', 'progress'],
      raw: true
    });
    
    dueSoonProjects.forEach(project => {
      const daysUntilDue = Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      const severity = daysUntilDue <= 3 ? 'high' : 'medium';
      alerts.push({
        type: 'due-soon',
        severity,
        title: 'Project Due Soon',
        message: `${project.name} is due in ${daysUntilDue} days (${project.progress}% complete)`,
        projectId: project.id,
        timestamp: new Date().toISOString()
      });
    });
    
    // Budget overruns
    const budgetProjects = await Project.findAll({
      where: {
        ...projectWhere,
        actualBudget: { [Op.gt]: 0 }
      },
      attributes: ['id', 'name', 'estimatedBudget', 'actualBudget'],
      raw: true
    });
    
    budgetProjects.forEach(project => {
      const estimated = parseFloat(project.estimatedBudget) || 0;
      const actual = parseFloat(project.actualBudget) || 0;
      
      if (actual > estimated * 1.1) { // 10% over budget
        const overrun = Math.round(((actual - estimated) / estimated) * 100);
        alerts.push({
          type: 'budget-overrun',
          severity: overrun > 25 ? 'high' : 'medium',
          title: 'Budget Overrun',
          message: `${project.name} is ${overrun}% over budget`,
          projectId: project.id,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Sort by severity and timestamp
    alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    res.json({ alerts: alerts.slice(0, 20) }); // Limit to 20 most important alerts
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// GET /api/dashboard/executive-summary - Get executive summary report
router.get('/executive-summary', authenticate, authorize(['admin', 'project-manager']), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const periodDays = parseInt(period);
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    
    // Get all projects (no role filtering for executive summary)
    const projects = await Project.findAll({
      include: [{ 
        model: User, 
        as: 'owner', 
        attributes: ['id', 'name', 'email'] 
      }],
      order: [['updatedAt', 'DESC']]
    });

    // Calculate executive metrics
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const overdueProjects = projects.filter(p => p.isOverdue()).length;
    
    const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.estimatedBudget) || 0), 0);
    const spentBudget = projects.reduce((sum, p) => sum + (parseFloat(p.actualBudget) || 0), 0);
    
    const averageProgress = totalProjects > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjects)
      : 0;

    // Projects by priority
    const criticalProjects = projects.filter(p => p.priority === 'critical').length;
    const highProjects = projects.filter(p => p.priority === 'high').length;
    
    // Recent activity (last 7 days)
    const recentActivity = await AuditLog.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Team performance
    const totalUsers = await User.count({ where: { isActive: true } });
    const teamUtilization = totalUsers > 0 ? Math.min(Math.round((activeProjects / totalUsers) * 100), 100) : 0;

    // Risk assessment
    const highRiskProjects = projects.filter(project => {
      const budgetUtilization = project.estimatedBudget > 0 
        ? (project.actualBudget / project.estimatedBudget) * 100 
        : 0;
      return project.isOverdue() || budgetUtilization > 100 || 
             (project.getDaysRemaining() <= 7 && project.progress < 75);
    }).length;

    // Generate insights
    const insights = [];
    
    if (overdueProjects > 0) {
      insights.push({
        type: 'warning',
        title: 'Overdue Projects',
        message: `${overdueProjects} project(s) are overdue and require immediate attention.`
      });
    }
    
    if (averageProgress < 50) {
      insights.push({
        type: 'warning', 
        title: 'Low Progress',
        message: 'Overall project progress is below 50%. Consider resource reallocation.'
      });
    }
    
    if (spentBudget / totalBudget > 0.8) {
      insights.push({
        type: 'info',
        title: 'Budget Alert',
        message: 'Budget utilization is above 80%. Monitor spending closely.'
      });
    }
    
    if (completedProjects / totalProjects > 0.7) {
      insights.push({
        type: 'success',
        title: 'Strong Performance',
        message: 'High completion rate indicates excellent project delivery.'
      });
    }

    const executiveSummary = {
      period: `${period} days`,
      generatedAt: new Date().toISOString(),
      
      // Key Performance Indicators
      kpis: {
        totalProjects,
        activeProjects,
        completedProjects,
        overdueProjects,
        averageProgress,
        teamUtilization,
        budgetEfficiency: totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0
      },
      
      // Financial Overview
      financial: {
        totalBudget,
        spentBudget,
        remainingBudget: totalBudget - spentBudget,
        budgetUtilization: totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0
      },
      
      // Risk Assessment
      riskProfile: {
        totalRisk: highRiskProjects,
        criticalProjects,
        highPriorityProjects: highProjects,
        riskLevel: highRiskProjects > totalProjects * 0.3 ? 'High' : 
                  highRiskProjects > totalProjects * 0.15 ? 'Medium' : 'Low'
      },
      
      // Performance Trends
      performance: {
        completionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
        onTimeDelivery: totalProjects > 0 ? Math.round(((totalProjects - overdueProjects) / totalProjects) * 100) : 100,
        resourceUtilization: teamUtilization,
        recentActivity
      },
      
      // Strategic Insights
      insights,
      
      // Top Projects
      topProjects: {
        mostCritical: projects
          .filter(p => p.priority === 'critical' || p.isOverdue())
          .slice(0, 5)
          .map(p => ({
            name: p.name,
            status: p.status,
            progress: p.progress,
            daysRemaining: p.getDaysRemaining(),
            isOverdue: p.isOverdue()
          })),
        nearCompletion: projects
          .filter(p => p.progress >= 80 && p.status !== 'completed')
          .slice(0, 5)
          .map(p => ({
            name: p.name,
            progress: p.progress,
            daysRemaining: p.getDaysRemaining()
          }))
      }
    };
    
    res.json({ executiveSummary });
  } catch (error) {
    console.error('Error generating executive summary:', error);
    res.status(500).json({ error: 'Failed to generate executive summary' });
  }
});

module.exports = router;