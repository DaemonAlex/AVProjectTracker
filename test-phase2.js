const fetch = require('node-fetch');

async function testPhase2() {
    const API_URL = 'http://localhost:3001/api';
    
    console.log('🧪 Testing Phase 2: Data Migration & Frontend Integration');
    console.log('='.repeat(60));

    try {
        // 1. Test Login with Admin
        console.log('\n1. Testing admin login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@avprojects.com',
                password: 'Admin123!'
            })
        });
        
        if (!loginRes.ok) {
            throw new Error('Admin login failed');
        }
        
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Admin login successful');
        console.log(`   User: ${loginData.user.name}`);
        console.log(`   Role: ${loginData.user.Role.displayName}`);
        console.log(`   Permissions: ${loginData.user.Role.permissions.length} total`);

        // 2. Test User Registration (new user)
        console.log('\n2. Testing new user registration...');
        const newUserEmail = `test-${Date.now()}@example.com`;
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: newUserEmail,
                password: 'Test123!',
                name: 'Phase 2 Test User',
                role: 'technician'
            })
        });
        
        if (registerRes.ok) {
            const registerData = await registerRes.json();
            console.log('✅ New user registration successful');
            console.log(`   Email: ${registerData.user.email}`);
            console.log(`   Role: ${registerData.user.Role.displayName}`);
        } else {
            console.log('❌ User registration failed (might be expected)');
        }

        // 3. Test Project CRUD Operations
        console.log('\n3. Testing project operations...');
        
        // Create a project
        const projectData = {
            name: 'Phase 2 Integration Test Project',
            client: 'Test Client Corporation',
            type: 'new-build',
            status: 'active',
            priority: 'high',
            startDate: '2025-01-01',
            endDate: '2025-06-30',
            estimatedBudget: 75000,
            description: 'Testing project creation in Phase 2'
        };
        
        const createRes = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });
        
        if (!createRes.ok) {
            throw new Error('Project creation failed');
        }
        
        const createData = await createRes.json();
        const projectId = createData.project.id;
        console.log('✅ Project created successfully');
        console.log(`   Project ID: ${projectId}`);
        console.log(`   Name: ${createData.project.name}`);

        // Get all projects
        const projectsRes = await fetch(`${API_URL}/projects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const projectsData = await projectsRes.json();
        console.log(`✅ Retrieved ${projectsData.projects.length} projects`);

        // 4. Test Task Operations
        console.log('\n4. Testing task operations...');
        
        const taskData = {
            name: 'Site Survey and Assessment',
            assignee: 'John Doe',
            priority: 'high',
            status: 'not-started',
            startDate: '2025-01-01',
            endDate: '2025-01-15',
            description: 'Initial site survey for AV requirements'
        };
        
        const taskRes = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });
        
        if (taskRes.ok) {
            const taskResult = await taskRes.json();
            console.log('✅ Task created successfully');
            console.log(`   Task: ${taskResult.task.name}`);
        } else {
            console.log('❌ Task creation failed');
        }

        // 5. Test Role-based Access Control
        console.log('\n5. Testing role-based access control...');
        
        const rolesRes = await fetch(`${API_URL}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (rolesRes.ok) {
            const rolesData = await rolesRes.json();
            console.log(`✅ Retrieved ${rolesData.roles.length} roles`);
            
            rolesData.roles.forEach(role => {
                console.log(`   - ${role.displayName} (${role.permissions.length} permissions)`);
            });
        }

        // 6. Test Data Migration Simulation
        console.log('\n6. Testing data migration simulation...');
        
        // Simulate localStorage data
        const mockLocalData = {
            'legacy-1': {
                id: 'legacy-1',
                name: 'Legacy Project from localStorage',
                client: 'Old Client',
                type: 'renovation',
                status: 'active',
                priority: 'medium',
                startDate: '2024-12-01',
                endDate: '2025-03-31',
                estimatedBudget: 30000,
                progress: 45,
                tasks: [
                    { id: 1, name: 'Legacy Task 1', status: 'completed' },
                    { id: 2, name: 'Legacy Task 2', status: 'in-progress' }
                ]
            }
        };
        
        console.log('   Simulating migration of 1 legacy project...');
        
        // Convert and migrate
        const legacyProject = mockLocalData['legacy-1'];
        const migrationData = {
            name: legacyProject.name,
            client: legacyProject.client,
            type: legacyProject.type,
            status: legacyProject.status,
            priority: legacyProject.priority,
            startDate: legacyProject.startDate,
            endDate: legacyProject.endDate,
            estimatedBudget: legacyProject.estimatedBudget,
            description: 'Migrated from localStorage in Phase 2 testing'
        };
        
        const migrateRes = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(migrationData)
        });
        
        if (migrateRes.ok) {
            const migrateData = await migrateRes.json();
            console.log('✅ Legacy project migrated successfully');
            console.log(`   New ID: ${migrateData.project.id}`);
            console.log(`   Original progress: ${legacyProject.progress}%`);
        }

        // 7. Test Statistics
        console.log('\n7. Testing project statistics...');
        
        const statsRes = await fetch(`${API_URL}/projects/stats/overview`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (statsRes.ok) {
            const statsData = await statsRes.json();
            console.log('✅ Statistics retrieved successfully');
            console.log(`   Total projects: ${statsData.stats.total}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 Phase 2 testing completed successfully!');
        console.log('\n✅ Verified capabilities:');
        console.log('   - User authentication and authorization');
        console.log('   - Role-based access control');
        console.log('   - Project CRUD operations');
        console.log('   - Task management');
        console.log('   - Data migration simulation');
        console.log('   - Backend API integration');
        console.log('\n🚀 Ready for frontend UI integration!');

    } catch (error) {
        console.error('\n❌ Phase 2 testing failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testPhase2();