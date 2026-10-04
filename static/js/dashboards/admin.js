// Admin Dashboard JS Logic
async function loadModule(moduleName) {
    document.getElementById('page-title').textContent = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    const container = document.getElementById('module-container');
    container.innerHTML = `<div class="glass-card"><p>Loading ${moduleName} module...</p></div>`;

    if (moduleName === 'users') {
        renderUsersModule(container);
    } else if (moduleName === 'departments') {
        renderDepartmentsModule(container);
    } else if (moduleName === 'reports') {
        renderReportsModule(container);
    } else {
        container.innerHTML = `<div class="glass-card"><p>Module ${moduleName} is under construction.</p></div>`;
    }
}

async function renderUsersModule(container) {
    container.innerHTML = `
        <div class="glass-card">
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <h3>Users List</h3>
                <button class="btn btn-primary btn-sm" onclick="showAddUserModal()">+ Add User</button>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--glass-border); text-align: left;">
                        <th style="padding: 0.5rem;">ID</th>
                        <th style="padding: 0.5rem;">Username</th>
                        <th style="padding: 0.5rem;">Role</th>
                        <th style="padding: 0.5rem;">Status</th>
                    </tr>
                </thead>
                <tbody id="users-table-body">
                    <tr><td colspan="4" style="padding: 1rem;">Loading...</td></tr>
                </tbody>
            </table>
        </div>
        
        <!-- Modal for adding user -->
        <div id="addUserModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; justify-content: center; align-items: center;">
            <div class="glass-card" style="width: 400px; background: var(--glass-bg);">
                <h4>Add New User</h4>
                <form id="addUserForm" onsubmit="submitAddUser(event)">
                    <div class="form-group mt-4">
                        <label>Username</label>
                        <input type="text" id="newUsername" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="newPassword" required>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="newRole" required>
                            <option value="admin">Admin</option>
                            <option value="hod">HOD</option>
                            <option value="faculty">Faculty</option>
                            <option value="mentor">Mentor</option>
                            <option value="placement">Placement Staff</option>
                            <option value="student">Student</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" onclick="closeAddUserModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save User</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    try {
        const users = await App.fetchAPI('/api/admin/users');
        const tbody = document.getElementById('users-table-body');
        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="padding: 1rem; text-align: center;">No users found.</td></tr>`;
            return;
        }
        
        tbody.innerHTML = users.map(u => `
            <tr style="border-bottom: 1px solid var(--glass-border);">
                <td style="padding: 0.5rem;">${u.id}</td>
                <td style="padding: 0.5rem;">${u.username}</td>
                <td style="padding: 0.5rem; text-transform: capitalize;">${u.role}</td>
                <td style="padding: 0.5rem;">
                    <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: ${u.status === 'active' ? 'var(--secondary)' : 'var(--danger)'}; color: white;">
                        ${u.status}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'flex';
}

function closeAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
    document.getElementById('addUserForm').reset();
}

async function submitAddUser(e) {
    e.preventDefault();
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    try {
        await App.fetchAPI('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ username, password, role })
        });
        App.toast('User created successfully');
        closeAddUserModal();
        renderUsersModule(document.getElementById('module-container')); // Refresh list
    } catch (err) {
        // Handled by fetchAPI
    }
}

async function renderDepartmentsModule(container) {
    container.innerHTML = `
        <div class="glass-card">
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <h3>Departments List</h3>
                <button class="btn btn-primary btn-sm" onclick="showAddDeptModal()">+ Add Department</button>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--glass-border); text-align: left;">
                        <th style="padding: 0.5rem;">Code</th>
                        <th style="padding: 0.5rem;">Name</th>
                        <th style="padding: 0.5rem;">HOD</th>
                    </tr>
                </thead>
                <tbody id="depts-table-body">
                    <tr><td colspan="3" style="padding: 1rem;">Loading...</td></tr>
                </tbody>
            </table>
        </div>
        
        <!-- Modal for adding dept -->
        <div id="addDeptModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; justify-content: center; align-items: center;">
            <div class="glass-card" style="width: 400px; background: var(--glass-bg);">
                <h4>Add New Department</h4>
                <form id="addDeptForm" onsubmit="submitAddDept(event)">
                    <div class="form-group mt-4">
                        <label>Department Name</label>
                        <input type="text" id="newDeptName" required>
                    </div>
                    <div class="form-group">
                        <label>Department Code</label>
                        <input type="text" id="newDeptCode" required>
                    </div>
                    <div class="form-group">
                        <label>HOD (User ID) - Optional</label>
                        <input type="number" id="newDeptHodId">
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" onclick="closeAddDeptModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Department</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    try {
        const depts = await App.fetchAPI('/api/admin/departments');
        const tbody = document.getElementById('depts-table-body');
        if (depts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="padding: 1rem; text-align: center;">No departments found.</td></tr>`;
            return;
        }
        
        tbody.innerHTML = depts.map(d => `
            <tr style="border-bottom: 1px solid var(--glass-border);">
                <td style="padding: 0.5rem; font-weight: bold;">${d.code}</td>
                <td style="padding: 0.5rem;">${d.name}</td>
                <td style="padding: 0.5rem;">${d.hod_name || '<span class="text-muted">Not assigned</span>'}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

function showAddDeptModal() {
    document.getElementById('addDeptModal').style.display = 'flex';
}

function closeAddDeptModal() {
    document.getElementById('addDeptModal').style.display = 'none';
    document.getElementById('addDeptForm').reset();
}

async function submitAddDept(e) {
    e.preventDefault();
    const name = document.getElementById('newDeptName').value;
    const code = document.getElementById('newDeptCode').value;
    const hodIdVal = document.getElementById('newDeptHodId').value;
    const hod_id = hodIdVal ? parseInt(hodIdVal) : null;
    
    try {
        await App.fetchAPI('/api/admin/departments', {
            method: 'POST',
            body: JSON.stringify({ name, code, hod_id })
        });
        App.toast('Department created successfully');
        closeAddDeptModal();
        renderDepartmentsModule(document.getElementById('module-container')); // Refresh list
    } catch (err) {
        // Handled by fetchAPI
    }
}

async function renderReportsModule(container) {
    container.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: 3rem;">
            <h3>Generate System Reports</h3>
            <p class="text-muted" style="margin-bottom: 2rem;">Click below to generate a comprehensive PDF report of all students in the system.</p>
            <button class="btn btn-primary" id="btn-generate-report" onclick="generateReport()">Generate Admin Report (PDF)</button>
            <div id="report-result" style="margin-top: 1.5rem;"></div>
        </div>
    `;
}

async function generateReport() {
    const btn = document.getElementById('btn-generate-report');
    btn.textContent = 'Generating...';
    btn.disabled = true;
    
    try {
        const data = await App.fetchAPI('/api/admin/generate_report');
        App.toast('Report generated successfully');
        document.getElementById('report-result').innerHTML = `
            <a href="${data.url}" target="_blank" class="btn btn-secondary">Download / View Report</a>
        `;
    } catch (e) {
        console.error(e);
    } finally {
        btn.textContent = 'Generate Admin Report (PDF)';
        btn.disabled = false;
    }
}
