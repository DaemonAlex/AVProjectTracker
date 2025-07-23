# AV Installation Project Tracker

A comprehensive web-based project management tool designed specifically for audio-visual installation projects. This tracker provides a structured workflow across five distinct phases, from initial logistics through post-installation completion.

## 🎯 Overview

The AV Installation Project Tracker is a single-page HTML application that helps teams manage complex AV installation projects with standardized workflows, progress tracking, and comprehensive documentation capabilities.

## ✨ Features

### **Phase-Based Project Management**
- **Phase 1:** Pre-Installation Logistics
- **Phase 2:** Pre-Installation AV Setup  
- **Phase 3:** Installation & Commissioning
- **Phase 4:** Post-Installation Commissioning
- **Phase 5:** Post-Installation Logistics

### **Progress Tracking**
- Real-time progress percentages for each phase
- Overall project completion percentage
- Visual status dashboard with progress cards

### **Task Management**
- Checkbox completion tracking
- Assignee management
- Start date, due date, and completion date tracking
- Rich notes and artifacts documentation
- Sub-task organization with visual hierarchy

### **Smart Filtering & Views**
- View all tasks, incomplete only, or completed only
- Filter by specific project phases
- Overdue task identification
- Due-soon alerts (within one week)

### **Alerts & Notifications**
- Automatic overdue task detection
- Due-soon warnings
- Visual status indicators with color coding

### **Data Management**
- Auto-save functionality
- Export to Excel with formatting
- Project data persistence
- JSON export for backup

### **User Experience**
- Eye-friendly soft color scheme
- Alternating row colors for improved readability
- Responsive design for mobile and desktop
- Print-friendly styling

## 🚀 Getting Started

### **Installation**
1. Download the HTML file
2. Open in any modern web browser
3. No additional software or server required

### **Basic Usage**

1. **Project Setup**
   - Enter project name in the header
   - Add project manager information
   - Data auto-saves as you type

2. **Task Management**
   - Check off completed tasks
   - Assign team members to tasks
   - Set start and due dates
   - Add detailed notes and documentation links

3. **Progress Monitoring**
   - View real-time progress in the status dashboard
   - Monitor phase-specific completion percentages
   - Track overall project advancement

4. **Filtering & Organization**
   - Use view filters to focus on specific task types
   - Filter by project phases
   - Identify overdue or upcoming tasks

## 📋 Project Phases Breakdown

### **Phase 1: Pre-Installation Logistics**
- Project folder creation and organization
- SNOW ticket management
- Stakeholder identification (RACI matrix)
- Requirements gathering and business case development
- Vendor quote management and PO processing
- Hardware logistics and delivery coordination

### **Phase 2: Pre-Installation AV Setup**
- Space naming and calendar setup
- Network infrastructure verification (VLAN setup)
- IP address assignment and firewall configuration
- Microsoft Teams Room account provisioning
- Directory service integration

### **Phase 3: Installation & Commissioning**
- Hardware delivery and installation oversight
- System configuration and commissioning
- Testing and verification protocols
- Documentation and labeling requirements
- Technical signoff procedures
- Monitoring software deployment

### **Phase 4: Post-Installation Commissioning**
- User documentation creation
- System labeling and identification
- Stakeholder training coordination
- Knowledge transfer sessions
- Final installation approval

### **Phase 5: Post-Installation Logistics**
- Invoice processing and payment approval
- Equipment inventory management
- Documentation archival in Egnyte
- SharePoint updates
- Room health monitoring setup (site-specific)

## 🎨 Visual Design

### **Color Scheme**
- **Background:** Soft blue-gray (#f0f2f5)
- **Cards/Tables:** Off-white (#fafbfc) 
- **Alternating Rows:** Light grey and white
- **Phase Headers:** Dark blue-grey (#2c3e50)
- **Accent Colors:** Professional blue tones

### **Status Indicators**
- **Completed Tasks:** Light green background
- **Overdue Tasks:** Light red background  
- **Due Soon:** Light yellow background
- **Sub-tasks:** Indented with reduced opacity

## 💾 Data Export Options

### **Excel Export**
- Formatted spreadsheet with proper column widths
- Maintains visual hierarchy with indentation
- Includes project metadata and export date
- Phase headers styled with original colors

### **JSON Export**
- Complete project data backup
- Includes all task details and metadata
- Compatible with data import/restoration

## 🔧 Technical Specifications

### **Technology Stack**
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Dependencies:** SheetJS (for Excel export, loaded dynamically)
- **Storage:** Browser memory (session-based)
- **Compatibility:** Modern browsers (Chrome, Firefox, Safari, Edge)

### **Browser Requirements**
- JavaScript enabled
- Local file download capability
- CSS Grid and Flexbox support

## 📱 Responsive Design

- **Desktop:** Full-featured experience with optimal column layouts
- **Tablet:** Adjusted grid layouts and button sizing
- **Mobile:** Stacked layout with touch-friendly controls
- **Print:** Clean, professional formatting for documentation

## 🔒 Data Privacy

- All data stored locally in browser memory
- No external servers or cloud storage
- Session-based storage (data persists during browser session)
- Manual export required for permanent storage

## 🎯 Use Cases

### **Project Managers**
- Track overall project progress
- Identify bottlenecks and overdue tasks
- Generate status reports
- Coordinate team assignments

### **Technical Teams**
- Follow standardized installation procedures
- Document technical configurations
- Track equipment and monitoring setup
- Maintain compliance with company standards

### **Stakeholders**
- Monitor project milestones
- Review completion status
- Access project documentation
- Verify deliverable completion

## 🤝 Best Practices

### **Project Setup**
1. Complete project name and manager fields immediately
2. Assign team members to tasks early in the process
3. Set realistic start and due dates for each phase
4. Document all vendor communications and approvals

### **Progress Tracking**
1. Update task completion in real-time
2. Add detailed notes for complex tasks
3. Export data regularly for backup
4. Review overdue tasks weekly

### **Documentation**
1. Include file paths for important documents
2. Record SNOW ticket numbers and references
3. Note vendor contact information
4. Save all approvals and sign-offs

## 📄 File Organization

The tracker references standard file organization:
```
Z:\Shared\It Unified Communications\AV\! Current Buildouts\[ProjectName]\
├── Project Tracker (this file)
├── Vendor Quotes and Approvals
├── Hardware Documentation (MAC/Serial numbers)
├── Installation Documentation
├── Training Materials
└── Final Sign-off Documents
```

## 🆘 Support & Maintenance

### **Troubleshooting**
- Refresh browser if auto-save stops working
- Export data before closing browser for backup
- Use Chrome or Firefox for best compatibility
- Clear browser cache if display issues occur

### **Updates**
- Save a backup copy before making modifications
- Test changes in a separate copy first
- Maintain version control for customizations

## 📋 Customization

### **Adding Custom Tasks**
1. Use the "Add Custom Task" button
2. Specify the appropriate phase (1-5)
3. Enter descriptive task name
4. Configure dates and assignments

### **Modifying Phases**
- Edit HTML to add/remove tasks
- Update phase calculations in JavaScript
- Adjust CSS for visual consistency

## 🏷️ Version Information

- **Current Version:** 2.0
- **Last Updated:** 2025
- **Compatibility:** Modern browsers
- **Dependencies:** SheetJS (dynamically loaded)

---

*This tracker is designed to standardize AV installation processes and ensure consistent project delivery across all installations.*
