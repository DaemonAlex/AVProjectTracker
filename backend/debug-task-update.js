const fetch = require('node-fetch');

async function debugTaskUpdate() {
    const API_URL = 'http://localhost:3001/api';
    
    try {
        // Login
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@avprojects.com',
                password: 'Admin123!'
            })
        });
        
        const loginData = await loginRes.json();
        const token = loginData.token;
        
        // Get existing projects
        const projectsRes = await fetch(`${API_URL}/projects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const projectsData = await projectsRes.json();
        console.log('Existing projects:', projectsData.projects.length);
        
        if (projectsData.projects.length > 0) {
            const project = projectsData.projects[0];
            console.log('Testing with project:', project.id);
            console.log('Project tasks:', project.tasks.length);
            
            if (project.tasks.length > 0) {
                const task = project.tasks[0];
                console.log('Updating task:', task.id);
                
                const updateRes = await fetch(`${API_URL}/projects/${project.id}/tasks/${task.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: 'in-progress' })
                });
                
                console.log('Update response status:', updateRes.status);
                const updateData = await updateRes.text();
                console.log('Update response:', updateData);
                
                if (updateRes.ok) {
                    const json = JSON.parse(updateData);
                    console.log('Update successful:', json.message);
                    if (json.project) {
                        console.log('Updated progress:', json.project.progress);
                    }
                }
            } else {
                console.log('No tasks found to update');
            }
        }
    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debugTaskUpdate();