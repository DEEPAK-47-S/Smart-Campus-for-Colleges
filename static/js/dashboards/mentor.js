// Mentor Dashboard JS
document.addEventListener('DOMContentLoaded', async () => {
    loadModule('students');
});

async function loadModule(moduleName) {
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    const container = document.getElementById('module-container');
    if (!container) return;
    
    container.innerHTML = `<div class="glass-card"><p>Loading ${moduleName} module...</p></div>`;

    if (moduleName === 'students') {
        try {
            const students = await App.fetchAPI('/api/mentor/students');
            if (!students || students.length === 0) {
                container.innerHTML = `<div class="glass-card"><p class="text-muted">No mentees currently assigned to you.</p></div>`;
                return;
            }

            container.innerHTML = `
                <div class="glass-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3><i class="fas fa-user-graduate"></i> My Assigned Mentees (${students.length})</h3>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Enrollment No</th>
                                <th>Student Name</th>
                                <th>Department</th>
                                <th>Sem</th>
                                <th>Attendance %</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(s => `
                                <tr>
                                    <td><strong>${App.escapeHTML(s.enrollment_no)}</strong></td>
                                    <td>${App.escapeHTML(s.first_name)} ${App.escapeHTML(s.last_name)}</td>
                                    <td>${App.escapeHTML(s.department_name || 'N/A')}</td>
                                    <td>Sem ${s.semester || 'N/A'}</td>
                                    <td>
                                        <span class="badge ${ (s.attendance_pct || 0) >= 75 ? 'badge-success' : 'badge-danger'}">
                                            ${s.attendance_pct != null ? s.attendance_pct + '%' : 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="viewStudentProfile(${s.id})">
                                            <i class="fas fa-id-card"></i> 360° Profile
                                        </button>
                                        <button class="btn btn-primary btn-sm" onclick="openMeetingModal(${s.id}, '${App.escapeHTML(s.first_name)} ${App.escapeHTML(s.last_name)}')">
                                            <i class="fas fa-comments"></i> Log Meeting
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="glass-card"><p class="text-danger">Failed to load assigned students: ${App.escapeHTML(err.message)}</p></div>`;
        }
    } else if (moduleName === 'meetings') {
        container.innerHTML = `
            <div class="glass-card">
                <h3><i class="fas fa-calendar-alt"></i> Mentoring Records & Meetings</h3>
                <p class="text-muted" style="margin-top: 0.5rem;">Select a mentee from "My Students" to view meeting logs or record a new session.</p>
            </div>
        `;
    } else {
        container.innerHTML = `<div class="glass-card"><p>Module ${moduleName} under development.</p></div>`;
    }
}

async function viewStudentProfile(studentId) {
    try {
        const data = await App.fetchAPI(`/api/mentor/student/${studentId}/profile`);
        const p = data.profile;
        const att = data.attendance;
        const marks = data.marks || [];

        const modalHTML = `
            <div class="modal-overlay" id="profileModal" style="display: flex;">
                <div class="glass-card modal-content" style="max-width: 650px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.8rem; margin-bottom: 1rem;">
                        <h3 style="margin:0;"><i class="fas fa-user-circle"></i> ${App.escapeHTML(p.first_name)} ${App.escapeHTML(p.last_name)} (360° Profile)</h3>
                        <button onclick="document.getElementById('profileModal').remove()" style="background:none; border:none; color: var(--text-color); font-size: 1.2rem; cursor:pointer;">&times;</button>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <p><strong>Enrollment:</strong> ${App.escapeHTML(p.enrollment_no)}</p>
                            <p><strong>Email:</strong> ${App.escapeHTML(p.email)}</p>
                            <p><strong>Department:</strong> ${App.escapeHTML(p.department_name || 'N/A')}</p>
                        </div>
                        <div>
                            <p><strong>Semester:</strong> ${p.semester || 'N/A'}</p>
                            <p><strong>Section:</strong> ${App.escapeHTML(p.section || 'N/A')}</p>
                            <p><strong>Attendance:</strong> <span class="badge ${att.percentage >= 75 ? 'badge-success' : 'badge-danger'}">${att.percentage}% (${att.present}/${att.total} days)</span></p>
                        </div>
                    </div>
                    <h4>Academic Marks Summary</h4>
                    ${marks.length === 0 ? '<p class="text-muted">No marks recorded yet.</p>' : `
                        <table class="table" style="margin-top: 0.5rem;">
                            <thead>
                                <tr><th>Subject</th><th>Exam</th><th>Score</th></tr>
                            </thead>
                            <tbody>
                                ${marks.map(m => `
                                    <tr>
                                        <td>${App.escapeHTML(m.subject_name)}</td>
                                        <td>${App.escapeHTML(m.exam_type)}</td>
                                        <td><strong>${m.score} / ${m.max_score}</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                    <div style="text-align: right; margin-top: 1.5rem;">
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('profileModal').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (err) {
        App.toast('Failed to load profile: ' + err.message, 'danger');
    }
}

function openMeetingModal(studentId, studentName) {
    const modalHTML = `
        <div class="modal-overlay" id="meetingModal" style="display: flex;">
            <div class="glass-card modal-content" style="max-width: 500px; width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.8rem; margin-bottom: 1rem;">
                    <h3 style="margin:0;"><i class="fas fa-comments"></i> Mentor Session: ${App.escapeHTML(studentName)}</h3>
                    <button onclick="document.getElementById('meetingModal').remove()" style="background:none; border:none; color: var(--text-color); font-size: 1.2rem; cursor:pointer;">&times;</button>
                </div>
                <form id="logMeetingForm">
                    <div class="form-group" style="margin-bottom: 0.8rem;">
                        <label>Meeting Date</label>
                        <input type="date" id="m_date" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.8rem;">
                        <label>Discussion Summary</label>
                        <textarea id="m_discussion" class="form-control" rows="2" placeholder="Key topics discussed..."></textarea>
                    </div>
                    <div class="form-group" style="margin-bottom: 0.8rem;">
                        <label>Problems Identified</label>
                        <textarea id="m_problems" class="form-control" rows="2" placeholder="Academic / Personal challenges..."></textarea>
                    </div>
                    <div class="form-group" style="margin-bottom: 0.8rem;">
                        <label>Action Plan / Goals</label>
                        <textarea id="m_goals" class="form-control" rows="2" placeholder="Tasks for student..."></textarea>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('meetingModal').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-sm">Save Meeting Record</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('logMeetingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await App.fetchAPI('/api/mentor/meeting', {
                method: 'POST',
                body: JSON.stringify({
                    student_id: studentId,
                    meeting_date: document.getElementById('m_date').value,
                    discussion: document.getElementById('m_discussion').value,
                    problems: document.getElementById('m_problems').value,
                    goals: document.getElementById('m_goals').value
                })
            });
            App.toast('Meeting logged successfully!', 'success');
            document.getElementById('meetingModal').remove();
        } catch (err) {
            App.toast('Failed to save meeting: ' + err.message, 'danger');
        }
    });
}
