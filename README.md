# APEX Platform - AV Project Management System

## Overview
APEX (AV Project Execution Platform) is a comprehensive project management system designed specifically for Audio/Visual installation projects. This single-file HTML application provides complete project lifecycle management with phase tracking, task management, and advanced reporting capabilities.

## Features

### 🎯 Project Management
- **Complete Project Lifecycle**: Track projects from initial request through completion
- **4-Phase System**: 
  - Pre-installation - Logistics (15 tasks)
  - Pre-Installation - AV Setup (8 tasks)
  - Post-Installation Commissioning (16 tasks)
  - Post-Installation - Logistics (5 tasks)
- **44 Default Tasks**: Standard AV installation tasks automatically generated for new projects
- **Task Management**: Add, edit, delete, and move tasks between phases
- **RAG Status Reporting**: Color-coded Red/Amber/Green status indicators for quick health assessment

### 📊 Advanced Features
- **Enhanced Search**: Search across projects, clients, locations, descriptions, and tasks
- **Multiple Views**: List view, calendar view, and dashboard analytics
- **Export Capabilities**: Export to Excel, PDF, and CSV formats
- **Budget Tracking**: Track estimated vs. actual budgets
- **Progress Monitoring**: Visual progress indicators and completion tracking
- **Team Management**: Assign tasks to team members and track workload

### 🔐 Access Control
- **Role-Based Access**: Admin, Project Manager, Technician, and Client roles
- **Demo Accounts** for testing:
  - Admin: `admin@company.com` / `admin123`
  - Project Manager: `pm@company.com` / `pm123`
  - Technician: `tech@company.com` / `tech123`
  - Client: `client@company.com` / `client123`

### 💼 Business Lines
Configured for the following organizations:
- Barrington Bank & Trust Company, N.A.
- Beverly Bank & Trust Company, N.A.
- Crystal Lake Bank & Trust Company, N.A.
- Hinsdale Bank & Trust Company, N.A.
- Lake Forest Bank & Trust Company, N.A.
- Libertyville Bank & Trust Company, N.A.
- Northbrook Bank & Trust Company, N.A.
- Old Plank Trail Community Bank, N.A.
- St. Charles Bank & Trust Company, N.A.
- Schaumburg Bank & Trust Company, N.A.
- State Bank of the Lakes, N.A.
- Town Bank, N.A.
- Village Bank & Trust, N.A.
- Wheaton Bank & Trust Company, N.A.
- Wintrust Bank, N.A.

## Installation

1. **Download** the `APEX Platform.html` file
2. **Open** it in any modern web browser (Chrome, Firefox, Edge, Safari)
3. **Start using** - no installation or setup required!

## Usage

### Quick Start
1. Open the application in your browser
2. Use one of the demo accounts to log in
3. Create a new project (includes 44 default phase tasks automatically)
4. Manage tasks through each phase of the installation
5. Track progress and generate reports

### Key Workflows

#### Creating a Project
1. Click "➕ New Project"
2. Fill in project details
3. Check "Include default phase tasks" for standard AV installation tasks
4. All tasks start with GREEN (On Track) status

#### Managing Tasks
- Tasks are organized by phase
- Click on any task to edit details or move to different phase
- RAG status can be updated to reflect current health
- Use filters to find specific tasks quickly

#### Generating Reports
- Navigate to Reports section
- Select report type and time period
- Export in preferred format (Excel, PDF, CSV)

## Technical Details

- **Architecture**: Single-file HTML application
- **Storage**: Browser localStorage for data persistence
- **Framework**: Vanilla JavaScript (no dependencies for core functionality)
- **Export Libraries**: XLSX, jsPDF (loaded from CDN)
- **Responsive**: Mobile-friendly design
- **Theme**: Light/Dark mode support

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Data Management

- **Automatic Save**: All changes saved instantly to browser localStorage
- **Backup**: Use Export function to create JSON backups
- **Import**: Restore from JSON backup files
- **Data Limit**: Browser typically supports 5-10MB of localStorage

## Version History

- **v1.3**: Added comprehensive phase management system with 44 default tasks
- **v1.2**: Updated business lines, fixed RAG reporting
- **v1.1**: Enhanced search, removed kanban view
- **v1.0**: Initial release with core functionality

## Support

For issues, feature requests, or questions, please create an issue in this repository.

## License

Proprietary - All rights reserved

---

**Authored by DeamonScripts**