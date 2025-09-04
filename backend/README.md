# AV Project Management Backend API

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup
The application uses SQLite for development and can use PostgreSQL for production.
Database tables will be created automatically on first run.

### 4. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### 5. Default Admin Account
On first run, an admin account will be created with credentials from `.env`:
- Email: admin@avprojects.com (or your configured email)
- Password: ChangeThisPassword123! (change immediately)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/password` - Change password

### Users
- `GET /api/users` - Get all users (requires users.read)
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/preferences` - Update user preferences

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/stats/overview` - Get project statistics

### Tasks
- `POST /api/projects/:id/tasks` - Add task to project
- `PUT /api/projects/:id/tasks/:taskId` - Update task
- `DELETE /api/projects/:id/tasks/:taskId` - Delete task

### Roles
- `GET /api/roles` - Get all roles
- `GET /api/roles/:id` - Get specific role
- `POST /api/roles` - Create new role (admin only)
- `PUT /api/roles/:id` - Update role (admin only)
- `DELETE /api/roles/:id` - Delete role (admin only)
- `POST /api/roles/:id/permissions` - Add permission
- `DELETE /api/roles/:id/permissions/:permission` - Remove permission

## Authentication

All API requests (except login/register) require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control

### Default Roles and Permissions

#### Administrator
- Full system access
- User management
- Role management
- All project operations
- All reports

#### Project Manager
- Create/edit/delete all projects
- View all reports
- View users

#### Team Lead
- Edit assigned projects
- View portfolio and risk reports

#### Technician
- Update task status
- View assigned projects
- Basic project reports

#### Client
- View own projects only
- Limited reports

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "details": {} // Optional additional information
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Database Models

### User
- id (UUID)
- email (unique)
- password (hashed)
- name
- roleId
- department
- isActive
- lastLogin
- preferences (JSON)
- createdAt/updatedAt

### Project
- id (UUID)
- name
- client
- type (new-build/renovation/maintenance/other)
- status (draft/active/on-hold/completed/cancelled)
- priority (low/medium/high/critical)
- ownerId
- teamMembers (JSON array)
- tasks (JSON array)
- startDate/endDate
- estimatedBudget/actualBudget
- progress (0-100)
- createdAt/updatedAt

### Role
- id
- name (unique)
- displayName
- description
- permissions (JSON array)
- priority
- isSystem
- createdAt/updatedAt

### AuditLog
- id
- userId
- action
- entityType
- entityId
- changes (JSON)
- metadata (JSON)
- ipAddress
- userAgent
- createdAt

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Refresh token rotation
- Rate limiting
- CORS protection
- SQL injection prevention
- XSS protection via Helmet
- Audit logging for all changes

## Development Tips

1. Enable debug mode by setting `NODE_ENV=development`
2. Check logs in `logs/` directory for debugging
3. Use Postman collection (coming soon) for API testing
4. Database file is created at `./database.sqlite` in development

## Production Deployment

1. Set `NODE_ENV=production`
2. Use PostgreSQL instead of SQLite
3. Configure proper JWT secrets
4. Set up SSL/TLS
5. Use a process manager like PM2
6. Set up proper logging and monitoring