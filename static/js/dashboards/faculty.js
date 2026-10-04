// Faculty Dashboard JS Logic
async function loadModule(moduleName) {
    document.getElementById('page-title').textContent = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    const container = document.getElementById('module-container');
    container.innerHTML = `<div class="glass-card"><p>Loading ${moduleName} module...</p></div>`;

    if (moduleName === 'attendance') {
        renderAttendanceModule(container);
    } else if (moduleName === 'marks') {
        renderMarksModule(container);
    } else if (moduleName === 'assignments') {
        container.innerHTML = `<div class="glass-card"><p>Assignments module under construction.</p></div>`;
    }
}

async function renderAttendanceModule(container) {
    container.innerHTML = `
        <div class="glass-card">
            <h3>Mark Attendance</h3>
            <div style="display: flex; gap: 1rem; margin-top: 1rem; margin-bottom: 2rem;">
                <div class="form-group" style="flex: 1;">
                    <label>Subject</label>
                    <select id="attendanceSubject"></select>
                </div>
                <div class="form-group" style="flex: 1;">
                    <label>Date</label>
                    <input type="date" id="attendanceDate" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group" style="display: flex; align-items: flex-end;">
                    <button class="btn btn-primary" onclick="loadStudentsForAttendance()">Load Students</button>
                </div>
            </div>
            
            <div id="attendance-list-container" style="display: none;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--glass-border); text-align: left;">
                            <th style="padding: 0.5rem;">Enrollment No</th>
                            <th style="padding: 0.5rem;">Name</th>
                            <th style="padding: 0.5rem;">Status</th>
                        </tr>
                    </thead>
                    <tbody id="attendance-table-body">
                    </tbody>
                </table>
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button class="btn btn-primary" onclick="submitAttendance()">Save Attendance</button>
                </div>
            </div>
        </div>
    `;
    
    // Load subjects
    try {
        const subjects = await App.fetchAPI('/api/faculty/subjects');
        const select = document.getElementById('attendanceSubject');
        select.innerHTML = subjects.map(s => `<option value="${s.id}">${s.code} - ${s.name}</option>`).join('');
    } catch(e) {
        console.error(e);
    }
}

let currentAttendanceStudents = [];

async function loadStudentsForAttendance() {
    const subjectId = document.getElementById('attendanceSubject').value;
    if (!subjectId) return;
    
    try {
        currentAttendanceStudents = await App.fetchAPI(`/api/faculty/attendance/students?subject_id=${subjectId}`);
        const tbody = document.getElementById('attendance-table-body');
        
        tbody.innerHTML = currentAttendanceStudents.map(s => `
            <tr style="border-bottom: 1px solid var(--glass-border);">
                <td style="padding: 0.5rem;">${s.enrollment_no}</td>
                <td style="padding: 0.5rem;">${s.first_name} ${s.last_name}</td>
                <td style="padding: 0.5rem;">
                    <select id="status-${s.id}">
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                    </select>
                </td>
            </tr>
        `).join('');
        
        document.getElementById('attendance-list-container').style.display = 'block';
    } catch (e) {
        console.error(e);
    }
}

async function submitAttendance() {
    const subjectId = document.getElementById('attendanceSubject').value;
    const date = document.getElementById('attendanceDate').value;
    
    const attendanceData = currentAttendanceStudents.map(s => ({
        student_id: s.id,
        status: document.getElementById(`status-${s.id}`).value
    }));
    
    try {
        await App.fetchAPI('/api/faculty/attendance', {
            method: 'POST',
            body: JSON.stringify({ subject_id: subjectId, date, attendance: attendanceData })
        });
        App.toast('Attendance saved successfully');
        document.getElementById('attendance-list-container').style.display = 'none';
    } catch(e) {
        console.error(e);
    }
}

async function renderMarksModule(container) {
    container.innerHTML = `
        <div class="glass-card">
            <h3>Enter Marks</h3>
            <form id="marksForm" onsubmit="submitMarks(event)">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem;">
                    <div class="form-group">
                        <label>Student</label>
                        <select id="marksStudent" required></select>
                    </div>
                    <div class="form-group">
                        <label>Subject</label>
                        <select id="marksSubject" required></select>
                    </div>
                    <div class="form-group">
                        <label>Exam Type</label>
                        <select id="marksType" required>
                            <option value="internal">Internal</option>
                            <option value="lab">Lab</option>
                            <option value="final">Final</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Score</label>
                        <input type="number" id="marksScore" required min="0" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>Max Score</label>
                        <input type="number" id="marksMax" required min="1" value="100">
                    </div>
                </div>
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button type="submit" class="btn btn-primary">Save Marks</button>
                </div>
            </form>
        </div>
    `;
    
    try {
        const subjects = await App.fetchAPI('/api/faculty/subjects');
        const subjectSelect = document.getElementById('marksSubject');
        subjectSelect.innerHTML = subjects.map(s => `<option value="${s.id}">${s.code} - ${s.name}</option>`).join('');
        
        const students = await App.fetchAPI('/api/faculty/attendance/students'); // reuse endpoint
        const studentSelect = document.getElementById('marksStudent');
        studentSelect.innerHTML = students.map(s => `<option value="${s.id}">${s.enrollment_no} - ${s.first_name} ${s.last_name}</option>`).join('');
    } catch (e) {
        console.error(e);
    }
}

async function submitMarks(e) {
    e.preventDefault();
    const payload = {
        student_id: document.getElementById('marksStudent').value,
        subject_id: document.getElementById('marksSubject').value,
        exam_type: document.getElementById('marksType').value,
        score: document.getElementById('marksScore').value,
        max_score: document.getElementById('marksMax').value
    };
    
    try {
        await App.fetchAPI('/api/faculty/marks', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        App.toast('Marks saved successfully');
        document.getElementById('marksForm').reset();
    } catch(e) {
        console.error(e);
    }
}
