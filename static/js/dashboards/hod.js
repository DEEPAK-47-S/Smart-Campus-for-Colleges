// HOD Dashboard JS
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const stats = await App.fetchAPI('/api/hod/dashboard_stats');
        if (document.getElementById('stat-students')) document.getElementById('stat-students').textContent = stats.total_students;
        if (document.getElementById('stat-faculty')) document.getElementById('stat-faculty').textContent = stats.total_faculty;
        if (document.getElementById('stat-attendance')) document.getElementById('stat-attendance').textContent = stats.avg_attendance + '%';
        if (document.getElementById('stat-marks')) document.getElementById('stat-marks').textContent = stats.avg_marks + '%';
    } catch (e) {
        console.error('Failed to load HOD stats', e);
    }
});

async function loadModule(moduleName) {
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    const container = document.getElementById('module-container');
    container.innerHTML = `<div class="glass-card"><p>Loading ${moduleName} module...</p></div>`;

    if (moduleName === 'analytics') {
        renderAnalyticsModule(container);
    } else if (moduleName === 'students') {
        renderStudentsModule(container);
    } else if (moduleName === 'faculty') {
        renderFacultyModule(container);
    } else {
        container.innerHTML = `<div class="glass-card"><p>Module ${moduleName} is under construction.</p></div>`;
    }
}

async function renderAnalyticsModule(container) {
    try {
        const stats = await App.fetchAPI('/api/hod/dashboard_stats');
        const attColor = stats.avg_attendance >= 75 ? '#10B981' : '#EF4444';
        const markColor = stats.avg_marks >= 50 ? 'var(--primary)' : '#EF4444';

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="stats-grid">
                    <div class="glass-card stat-card">
                        <h5>Total Students</h5>
                        <h3>${stats.total_students}</h3>
                    </div>
                    <div class="glass-card stat-card">
                        <h5>Total Faculty</h5>
                        <h3>${stats.total_faculty}</h3>
                    </div>
                    <div class="glass-card stat-card">
                        <h5>Avg Attendance</h5>
                        <h3 style="color: ${attColor};">${stats.avg_attendance}%</h3>
                    </div>
                    <div class="glass-card stat-card">
                        <h5>Avg Marks</h5>
                        <h3 style="color: ${markColor};">${stats.avg_marks}%</h3>
                    </div>
                </div>

                <div class="glass-card">
                    <p class="section-title">Department Overview</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 0.5rem;">
                        <div style="padding: 1.5rem; border: 1px solid var(--glass-border); border-radius: 12px; text-align: center;">
                            <h5 class="text-muted">Overall Attendance</h5>
                            <div style="font-size: 3rem; font-weight: 700; color: ${attColor}; margin: 0.75rem 0;">${stats.avg_attendance}%</div>
                            <div class="progress-bar-container"><div class="progress-bar" style="width: ${stats.avg_attendance}%; background: ${attColor};"></div></div>
                        </div>
                        <div style="padding: 1.5rem; border: 1px solid var(--glass-border); border-radius: 12px; text-align: center;">
                            <h5 class="text-muted">Average Marks</h5>
                            <div style="font-size: 3rem; font-weight: 700; color: ${markColor}; margin: 0.75rem 0;">${stats.avg_marks}%</div>
                            <div class="progress-bar-container"><div class="progress-bar" style="width: ${stats.avg_marks}%; background: ${markColor};"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="glass-card"><p class="text-danger">Failed to load analytics.</p></div>`;
    }
}

async function renderStudentsModule(container) {
    try {
        const students = await App.fetchAPI('/api/hod/students');
        if (students.length === 0) {
            container.innerHTML = `<div class="glass-card"><p class="text-muted">No students in your department.</p></div>`;
            return;
        }
        container.innerHTML = `
            <div class="glass-card">
                <p class="section-title">Department Students (${students.length})</p>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Enrollment No</th>
                            <th>Name</th>
                            <th>Semester</th>
                            <th>Section</th>
                            <th>Attendance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => {
                            const pct = s.attendance_pct || 0;
                            const badge = pct >= 75 ? 'badge-success' : 'badge-danger';
                            return `
                                <tr>
                                    <td><strong>${s.enrollment_no}</strong></td>
                                    <td>${s.first_name} ${s.last_name}</td>
                                    <td>Sem ${s.semester}</td>
                                    <td>${s.section || '—'}</td>
                                    <td><span class="badge ${badge}">${pct}%</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="glass-card"><p class="text-danger">Failed to load students.</p></div>`;
    }
}

async function renderFacultyModule(container) {
    try {
        const faculty = await App.fetchAPI('/api/hod/faculty');
        if (faculty.length === 0) {
            container.innerHTML = `<div class="glass-card"><p class="text-muted">No faculty in your department.</p></div>`;
            return;
        }
        container.innerHTML = `
            <div class="glass-card">
                <p class="section-title">Department Faculty (${faculty.length})</p>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Designation</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${faculty.map(f => `
                            <tr>
                                <td><strong>${f.employee_id}</strong></td>
                                <td>${f.first_name} ${f.last_name}</td>
                                <td>${f.designation || '—'}</td>
                                <td>${f.email || '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="glass-card"><p class="text-danger">Failed to load faculty.</p></div>`;
    }
}
