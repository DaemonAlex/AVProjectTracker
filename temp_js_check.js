
                    <!-- Roles Management -->
                    <div id="adminRolesContent" class="admin-tab-content">
                        <div class="admin-section">
                            <div class="section-header">
                                <h3>Roles & Permissions</h3>
                                <button class="btn btn-primary" onclick="showCreateRole()">
                                    ➕ Create Role
                                </button>
                            </div>
                            
                            <div class="roles-grid" id="rolesGrid">
                                <!-- Role cards will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- System Settings -->
                    <div id="adminSettingsContent" class="admin-tab-content">
                        <div class="admin-section">
                            <div class="section-header">
                                <h3>System Settings</h3>
                            </div>
                            
                            <div class="settings-form">
                                <div class="form-group">
                                    <label>Company Name</label>
                                    <input type="text" class="form-control" id="companyName" value="Wintrust Bank - Unified Communications">
                                </div>
                                
                                <div class="form-group">
                                    <label>Default Project Status</label>
                                    <select class="form-control" id="defaultProjectStatus">
                                        <option value="not-started">Not Started</option>
                                        <option value="planning">Planning</option>
                                        <option value="active" selected>Active</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>Session Timeout (minutes)</label>
                                    <input type="number" class="form-control" id="sessionTimeout" value="60">
                                </div>
                                
                                <div class="form-group">
