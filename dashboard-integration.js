// Enhanced dashboard integration with real-time API data
const DashboardAPI = {
    baseUrl: 'http://localhost:3001/api',
    
    // Get current user info for role-based filtering
    getCurrentUser() {
        return AppState.user;
    },
    
    async getMetrics() {
        const response = await fetch(`${this.baseUrl}/dashboard/metrics`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('av_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch metrics');
        }
        
        return await response.json();
    },
    
    async getChartData(type = 'status', period = '30') {
        const response = await fetch(`${this.baseUrl}/dashboard/charts?type=${type}&period=${period}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('av_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch chart data');
        }
        
        return await response.json();
    },
    
    async getRecentProjects(limit = 10) {
        const response = await fetch(`${this.baseUrl}/dashboard/recent-projects?limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('av_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch recent projects');
        }
        
        return await response.json();
    },
    
    async getAlerts() {
        const response = await fetch(`${this.baseUrl}/dashboard/alerts`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('av_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch alerts');
        }
        
        return await response.json();
    },
    
    async getExecutiveSummary(period = '30') {
        const response = await fetch(`${this.baseUrl}/dashboard/executive-summary?period=${period}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('av_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch executive summary');
        }
        
        return await response.json();
    }
};

// Enhanced dashboard renderer
const DashboardRenderer = {
    async renderMetrics() {
        try {
            const { metrics } = await DashboardAPI.getMetrics();
            const { overview, financial, trends } = metrics;
            
            const metricCards = [
                {
                    icon: '📁',
                    iconClass: 'primary',
                    value: overview.totalProjects.toString(),
                    label: 'Total Projects',
                    change: trends.projectGrowth > 0 
                        ? `+${trends.projectGrowth}% this month`
                        : trends.projectGrowth < 0 
                        ? `${trends.projectGrowth}% this month`
                        : 'No change',
                    changeClass: trends.projectGrowth > 0 ? 'positive' : 
                                trends.projectGrowth < 0 ? 'negative' : 'neutral'
                },
                {
                    icon: '✅',
                    iconClass: 'success',
                    value: overview.completedProjects.toString(),
                    label: 'Completed Projects',
                    change: `${trends.completionRate}% completion rate`,
                    changeClass: trends.completionRate > 75 ? 'positive' : 
                                trends.completionRate > 50 ? 'neutral' : 'negative'
                },
                {
                    icon: '🚧',
                    iconClass: 'warning',
                    value: overview.activeProjects.toString(),
                    label: 'Active Projects',
                    change: overview.overdueProjects > 0 
                        ? `${overview.overdueProjects} overdue`
                        : 'All on track',
                    changeClass: overview.overdueProjects > 0 ? 'negative' : 'positive'
                },
                {
                    icon: '⚠️',
                    iconClass: 'danger',
                    value: overview.overdueProjects.toString(),
                    label: 'Overdue Projects',
                    change: overview.overdueProjects > 0 ? 'Needs attention' : 'All current',
                    changeClass: overview.overdueProjects > 0 ? 'negative' : 'positive'
                },
                {
                    icon: '💰',
                    iconClass: 'success',
                    value: `$${(financial.totalEstimatedBudget / 1000000).toFixed(1)}M`,
                    label: 'Total Budget',
                    change: `${financial.budgetUtilization}% utilized`,
                    changeClass: financial.budgetUtilization > 100 ? 'negative' : 
                                financial.budgetUtilization > 80 ? 'warning' : 'positive'
                },
                {
                    icon: '👥',
                    iconClass: 'primary',
                    value: `${overview.teamUtilization}%`,
                    label: 'Team Utilization',
                    change: overview.teamUtilization > 85 ? 'High capacity' : 
                           overview.teamUtilization > 60 ? 'Optimal range' : 'Available capacity',
                    changeClass: overview.teamUtilization > 85 ? 'warning' : 'neutral'
                },
                {
                    icon: '📊',
                    iconClass: 'primary',
                    value: `${overview.averageProgress}%`,
                    label: 'Avg Progress',
                    change: overview.averageProgress > 70 ? 'Ahead of schedule' : 
                           overview.averageProgress > 50 ? 'On track' : 'Behind schedule',
                    changeClass: overview.averageProgress > 70 ? 'positive' : 
                                overview.averageProgress > 50 ? 'neutral' : 'negative'
                },
                {
                    icon: '🔔',
                    iconClass: 'warning',
                    value: overview.recentActivity.toString(),
                    label: 'Recent Activity',
                    change: 'Last 7 days',
                    changeClass: 'neutral'
                }
            ];
            
            // Apply role-based filtering
            const currentUser = this.getCurrentUser ? this.getCurrentUser() : DashboardAPI.getCurrentUser();
            const userRole = currentUser?.role?.toLowerCase() || 'client';
            const filteredMetricCards = this.filterMetricsByRole(metricCards, userRole);
            
            const metricsGrid = document.getElementById('metricsGrid');
            metricsGrid.innerHTML = filteredMetricCards.map(metric => `
                <div class="metric-card fade-in">
                    <div class="metric-header">
                        <div class="metric-icon ${metric.iconClass}">${metric.icon}</div>
                    </div>
                    <div class="metric-value">${metric.value}</div>
                    <div class="metric-label">${metric.label}</div>
                    <div class="metric-change ${metric.changeClass}">${metric.change}</div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error rendering metrics:', error);
            this.renderErrorState('metricsGrid', 'Failed to load metrics');
        }
    },

    // Role-based metric card filtering
    filterMetricsByRole(metricCards, userRole) {
        const rolePermissions = {
            'client': ['totalProjects', 'completedProjects', 'activeProjects', 'averageProgress'],
            'technician': ['activeProjects', 'completedProjects', 'averageProgress', 'recentActivity'],
            'team-lead': ['totalProjects', 'activeProjects', 'completedProjects', 'overdueProjects', 'averageProgress', 'recentActivity'],
            'project-manager': metricCards.map((_, index) => index), // All metrics
            'admin': metricCards.map((_, index) => index) // All metrics
        };

        const allowedMetrics = rolePermissions[userRole] || [];
        if (Array.isArray(allowedMetrics) && allowedMetrics.length < 8) {
            // Filter by metric type for specific roles
            const metricTypeMap = {
                'totalProjects': 0,
                'completedProjects': 1, 
                'activeProjects': 2,
                'overdueProjects': 3,
                'totalBudget': 4,
                'teamUtilization': 5,
                'averageProgress': 6,
                'recentActivity': 7
            };
            
            return metricCards.filter((card, index) => {
                const metricType = Object.keys(metricTypeMap).find(key => metricTypeMap[key] === index);
                return allowedMetrics.includes(metricType) || allowedMetrics.includes(index);
            });
        }
        
        return metricCards; // Return all for admin/project-manager
    },
    
    async renderCharts() {
        try {
            // Status distribution chart
            const statusData = await DashboardAPI.getChartData('status', '30');
            await this.renderStatusChart(statusData.chartData);
            
            // Progress trends chart
            const progressData = await DashboardAPI.getChartData('progress', '30');
            await this.renderProgressChart(progressData.chartData);
            
        } catch (error) {
            console.error('Error rendering charts:', error);
        }
    },
    
    async renderStatusChart(chartData) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (window.statusChartInstance) {
            window.statusChartInstance.destroy();
        }
        
        const colors = {
            'Active': '#22c55e',
            'Completed': '#0ea5e9',
            'On-hold': '#f59e0b',
            'Cancelled': '#ef4444',
            'Draft': '#6b7280'
        };
        
        window.statusChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.datasets[0].data,
                    backgroundColor: chartData.labels.map(label => colors[label] || '#6b7280'),
                    borderWidth: 0,
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    async renderProgressChart(chartData) {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (window.progressChartInstance) {
            window.progressChartInstance.destroy();
        }
        
        window.progressChartInstance = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
    },
    
    async renderRecentProjects() {
        try {
            const { projects } = await DashboardAPI.getRecentProjects(10);
            
            const tableBody = document.getElementById('recentProjectsTable');
            tableBody.innerHTML = projects.map(project => {
                const progressColor = project.progress > 75 ? '#22c55e' : 
                                    project.progress > 50 ? '#0ea5e9' :
                                    project.progress > 25 ? '#f59e0b' : '#ef4444';
                
                const statusClass = {
                    'active': 'active',
                    'completed': 'completed',
                    'on-hold': 'on-hold',
                    'cancelled': 'cancelled',
                    'draft': 'draft'
                }[project.status] || 'draft';
                
                return `
                    <tr ${project.isOverdue ? 'style="background: rgba(239, 68, 68, 0.05);"' : ''}>
                        <td>
                            <div style="font-weight: 500;">${project.name}</div>
                            ${project.isOverdue ? '<div style="font-size: 0.75rem; color: #ef4444;">⚠️ Overdue</div>' : ''}
                        </td>
                        <td>${project.client}</td>
                        <td>
                            <span class="status-badge ${statusClass}">${this.formatStatus(project.status)}</span>
                        </td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div style="flex: 1; height: 6px; background: var(--gray-200); border-radius: 3px; overflow: hidden;">
                                    <div style="height: 100%; background: ${progressColor}; width: ${project.progress}%; transition: width 0.3s;"></div>
                                </div>
                                <span style="font-size: 0.75rem; color: var(--gray-600); min-width: 35px;">${project.progress}%</span>
                            </div>
                            <div style="font-size: 0.7rem; color: var(--gray-500); margin-top: 2px;">
                                ${project.completedTasks}/${project.tasksCount} tasks
                            </div>
                        </td>
                        <td>
                            <div>${this.formatDate(project.endDate)}</div>
                            ${project.daysRemaining !== null ? `
                                <div style="font-size: 0.7rem; color: ${project.daysRemaining < 0 ? '#ef4444' : project.daysRemaining < 7 ? '#f59e0b' : 'var(--gray-500)'};">
                                    ${project.daysRemaining < 0 ? `${Math.abs(project.daysRemaining)} days overdue` : `${project.daysRemaining} days left`}
                                </div>
                            ` : ''}
                        </td>
                        <td>
                            <div style="display: flex; gap: 0.25rem;">
                                <button class="btn btn-sm btn-secondary" onclick="viewProject('${project.id}')" title="View Project">
                                    👁️
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="editProject('${project.id}')" title="Edit Project">
                                    ✏️
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error rendering recent projects:', error);
            this.renderErrorState('recentProjectsTable', 'Failed to load recent projects');
        }
    },
    
    renderErrorState(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">😕</div>
                    <div>${message}</div>
                    <button class="btn btn-sm btn-primary" onclick="location.reload()" style="margin-top: 1rem;">
                        Retry
                    </button>
                </div>
            `;
        }
    },
    
    formatStatus(status) {
        return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
    },
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }
};

// Auto-refresh functionality
let dashboardRefreshInterval = null;

function startDashboardAutoRefresh() {
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
    }
    
    dashboardRefreshInterval = setInterval(async () => {
        if (AppState.currentView === 'dashboard') {
            try {
                await DashboardRenderer.renderMetrics();
                // Don't refresh charts too often to avoid flickering
                console.log('📊 Dashboard metrics refreshed');
            } catch (error) {
                console.error('Auto-refresh error:', error);
            }
        }
    }, 60000); // Refresh every minute
}

function stopDashboardAutoRefresh() {
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
        dashboardRefreshInterval = null;
    }
}

// Enhanced loadDashboard function
async function loadDashboard() {
    try {
        document.getElementById('metricsGrid').innerHTML = '<div style="text-align: center; padding: 2rem;">Loading metrics...</div>';
        
        await Promise.all([
            DashboardRenderer.renderMetrics(),
            DashboardRenderer.renderCharts(),
            DashboardRenderer.renderRecentProjects()
        ]);
        
        startDashboardAutoRefresh();
        console.log('✅ Dashboard loaded with real-time data');
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        DashboardRenderer.renderErrorState('metricsGrid', 'Failed to load dashboard');
    }
}

// Export for global use
window.DashboardAPI = DashboardAPI;
window.DashboardRenderer = DashboardRenderer;
window.loadDashboard = loadDashboard;