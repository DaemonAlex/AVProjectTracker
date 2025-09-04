const fetch = require('node-fetch');

async function testAPI() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    // Test registration
    console.log('\n1. Testing user registration...');
    const registerRes = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john@example.com',
        password: 'Test123!',
        name: 'John Doe'
      })
    });
    const registerData = await registerRes.json();
    console.log('Registration response:', registerData);
    
    if (registerData.token) {
      const token = registerData.token;
      
      // Test getting current user
      console.log('\n2. Testing get current user...');
      const meRes = await fetch(`${baseURL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meData = await meRes.json();
      console.log('Current user:', meData);
      
      // Test login
      console.log('\n3. Testing login...');
      const loginRes = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@avprojects.com',
          password: 'Admin123!'
        })
      });
      const loginData = await loginRes.json();
      console.log('Admin login response:', loginData);
      
      if (loginData.token) {
        const adminToken = loginData.token;
        
        // Test getting all users (admin)
        console.log('\n4. Testing get all users (admin)...');
        const usersRes = await fetch(`${baseURL}/users`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const usersData = await usersRes.json();
        console.log('All users:', usersData);
        
        // Test creating a project
        console.log('\n5. Testing project creation...');
        const projectRes = await fetch(`${baseURL}/projects`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            name: 'Test AV Installation',
            client: 'ABC Corporation',
            type: 'new-build',
            status: 'active',
            priority: 'high',
            startDate: '2025-01-01',
            endDate: '2025-06-30',
            estimatedBudget: 50000,
            description: 'Complete AV system installation for conference room'
          })
        });
        const projectData = await projectRes.json();
        console.log('Project created:', projectData);
        
        // Test getting all projects
        console.log('\n6. Testing get all projects...');
        const projectsRes = await fetch(`${baseURL}/projects`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const projectsData = await projectsRes.json();
        console.log('All projects:', projectsData);
      }
    }
    
    console.log('\n✅ API tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Install node-fetch if needed
const { exec } = require('child_process');
exec('npm list node-fetch', (error) => {
  if (error) {
    console.log('Installing node-fetch...');
    exec('npm install node-fetch@2', (err) => {
      if (err) {
        console.error('Failed to install node-fetch:', err);
      } else {
        testAPI();
      }
    });
  } else {
    testAPI();
  }
});