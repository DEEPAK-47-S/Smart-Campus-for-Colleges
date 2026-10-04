// Student Dashboard JS Logic
async function loadModule(moduleName) {
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    const container = document.getElementById('module-container');
    container.innerHTML = `<div class="glass-card"><p>Loading ${moduleName} module...</p></div>`;

    if (moduleName === 'profile') {
        renderProfileModule(container);
    } else if (moduleName === 'attendance') {
        renderAttendanceModule(container);
    } else if (moduleName === 'marks') {
        renderMarksModule(container);
    } else if (moduleName === 'jobs') {
        renderJobsModule(container);
    } else {
        container.innerHTML = `<div class="glass-card"><p>Module ${moduleName} is under construction.</p></div>`;
    }
}

async function renderProfileModule(container) {
    container.innerHTML = `<div class="glass-card"><p>Loading profile data...</p></div>`;
    
    try {
        const data = await App.fetchAPI('/api/student/profile');
        const p = data.profile;
        const a = data.attendance;
        
        let marksHtml = '<p class="text-muted">No marks recorded yet.</p>';
        if (data.marks && data.marks.length > 0) {
            marksHtml = `
                <table class="table" style="margin-top: 0.5rem;">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Exam Type</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.marks.map(m => `
                            <tr>
                                <td>${m.subject_name}</td>
                                <td style="text-transform: capitalize;">${m.exam_type}</td>
                                <td><strong>${m.score}</strong> / ${m.max_score}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        const attColor = a.percentage >= 75 ? 'var(--secondary)' : 'var(--danger)';
        const attBarColor = a.percentage >= 75 ? '#10B981' : '#EF4444';
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 280px 1fr; gap: 2rem; align-items: start;">
                <!-- Profile Card -->
                <div class="glass-card" style="text-align: center;">
                    <div style="width: 90px; height: 90px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #818CF8); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; margin: 0 auto 1rem;">
                        ${p.first_name.charAt(0)}${p.last_name.charAt(0)}
                    </div>
                    <h3>${p.first_name} ${p.last_name}</h3>
                    <p class="text-muted" style="font-size: 0.85rem;">${p.enrollment_no}</p>
                    <hr class="divider">
                    <div style="text-align: left; display: flex; flex-direction: column; gap: 0.6rem;">
                        <div><span class="text-muted" style="font-size:0.8rem;">DEPARTMENT</span><br/><strong>${p.department_name || '—'}</strong></div>
                        <div><span class="text-muted" style="font-size:0.8rem;">SEMESTER</span><br/><strong>Sem ${p.semester}</strong></div>
                        <div><span class="text-muted" style="font-size:0.8rem;">EMAIL</span><br/><strong style="font-size:0.85rem;">${p.email || '—'}</strong></div>
                        <div><span class="text-muted" style="font-size:0.8rem;">MENTOR</span><br/><strong>${p.mentor_name || 'Not assigned'}</strong></div>
                    </div>
                    <button class="btn btn-primary" style="margin-top: 1.5rem; width: 100%;" onclick="showAIModal('${p.first_name}')">🤖 Ask AI Assistant</button>
                </div>
                
                <!-- Academics -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div class="glass-card">
                        <p class="section-title">Attendance Overview</p>
                        <div style="display: flex; align-items: center; gap: 2rem;">
                            <div style="font-size: 3rem; font-weight: 700; color: ${attColor};">
                                ${a.percentage}%
                            </div>
                            <div style="flex: 1;">
                                <div class="progress-bar-container">
                                    <div class="progress-bar" style="width: ${a.percentage}%; background: ${attBarColor};"></div>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
                                    <span>${a.present} Present</span>
                                    <span>${a.total - a.present} Absent</span>
                                    <span>${a.total} Total</span>
                                </div>
                                ${a.percentage < 75 ? '<p style="color: var(--danger); font-size: 0.8rem; margin-top: 0.5rem; font-weight: 500;">⚠️ Below 75% — attendance shortage!</p>' : '<p style="color: var(--secondary); font-size: 0.8rem; margin-top: 0.5rem;">✓ Good attendance</p>'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="glass-card">
                        <p class="section-title">Academic Performance</p>
                        ${marksHtml}
                    </div>
                </div>
            </div>
            
            <!-- AI Modal -->
            <div id="aiModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 300; justify-content: center; align-items: center; backdrop-filter: blur(4px);">
                <div class="glass-card" style="width: 500px; max-width: 90vw; background: var(--glass-bg);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h4>🤖 College AI Assistant</h4>
                        <button class="btn btn-secondary btn-sm" onclick="closeAI()">✕ Close</button>
                    </div>
                    <div id="aiChatbox" style="height: 220px; overflow-y: auto; background: rgba(0,0,0,0.06); border-radius: 10px; padding: 1rem; margin-bottom: 1rem; font-size: 0.9rem;">
                        <p><strong style="color: var(--primary);">AI:</strong> Hello! How can I help you with your academic data today?</p>
                    </div>
                    <form onsubmit="submitAI(event)" style="display: flex; gap: 0.5rem;">
                        <input type="text" id="aiInput" placeholder="Ask about attendance, marks, assignments..." required style="flex: 1;">
                        <button type="submit" class="btn btn-primary">Ask</button>
                    </form>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="glass-card"><p class="text-danger">Failed to load profile. Please try again.</p></div>`;
        console.error(e);
    }
}

async function renderAttendanceModule(container) {
    container.innerHTML = `<div class="glass-card"><p>Loading attendance data...</p></div>`;
    try {
        const data = await App.fetchAPI('/api/student/attendance');
        const summary = data.summary;
        const records = data.records;

        let summaryHtml = '<p class="text-muted">No attendance records yet.</p>';
        if (summary && summary.length > 0) {
            summaryHtml = summary.map(s => {
                const color = s.percentage >= 75 ? '#10B981' : '#EF4444';
                return `
                    <div class="glass-card" style="padding: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <div>
                                <strong>${s.subject_name}</strong>
                                <span class="text-muted" style="font-size:0.8rem; margin-left: 0.5rem;">(${s.subject_code})</span>
                            </div>
                            <span style="font-size: 1.5rem; font-weight: 700; color: ${color};">${s.percentage}%</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${s.percentage}%; background: ${color};"></div>
                        </div>
                        <div style="display: flex; gap: 1.5rem; margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-muted);">
                            <span>✓ Present: ${s.present}</span>
                            <span>✗ Absent: ${s.total - s.present}</span>
                            <span>Total: ${s.total}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="glass-card">
                    <p class="section-title">Subject-wise Attendance</p>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${summaryHtml}
                    </div>
                </div>
                
                <div class="glass-card">
                    <p class="section-title">Recent Attendance Records</p>
                    ${records.length === 0 ? '<p class="text-muted">No records.</p>' : `
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Subject</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${records.slice(0, 30).map(r => `
                                    <tr>
                                        <td>${r.date}</td>
                                        <td>${r.subject_name} <span class="text-muted">(${r.subject_code})</span></td>
                                        <td>
                                            <span class="badge ${r.status === 'present' ? 'badge-success' : 'badge-danger'}">
                                                ${r.status === 'present' ? '✓ Present' : '✗ Absent'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="glass-card"><p class="text-danger">Failed to load attendance.</p></div>`;
        console.error(e);
    }
}

async function renderMarksModule(container) {
    container.innerHTML = `<div class="glass-card"><p>Loading marks data...</p></div>`;
    try {
        const marks = await App.fetchAPI('/api/student/marks');

        if (marks.length === 0) {
            container.innerHTML = `<div class="glass-card"><p class="text-muted">No marks recorded yet.</p></div>`;
            return;
        }

        // Group by subject
        const grouped = {};
        marks.forEach(m => {
            if (!grouped[m.subject_name]) grouped[m.subject_name] = [];
            grouped[m.subject_name].push(m);
        });

        const subjectsHtml = Object.entries(grouped).map(([subject, mList]) => {
            const avg = Math.round(mList.reduce((s, m) => s + m.percentage, 0) / mList.length);
            const color = avg >= 75 ? '#10B981' : avg >= 50 ? '#F59E0B' : '#EF4444';
            return `
                <div class="glass-card" style="padding: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <strong>${subject}</strong>
                        <span style="font-size: 1.3rem; font-weight: 700; color: ${color};">${avg}% avg</span>
                    </div>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        ${mList.map(m => `
                            <div style="background: rgba(79,70,229,0.07); border-radius: 8px; padding: 0.75rem 1.25rem; text-align: center; min-width: 110px;">
                                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">${m.exam_type}</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: ${m.percentage >= 50 ? 'var(--primary)' : 'var(--danger)'};">${m.score}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">/ ${m.max_score} &nbsp; (${m.percentage}%)</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="glass-card">
                    <p class="section-title">Academic Marks</p>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${subjectsHtml}
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="glass-card"><p class="text-danger">Failed to load marks.</p></div>`;
        console.error(e);
    }
}

async function renderJobsModule(container) {
    container.innerHTML = `<div class="glass-card"><p>Loading job opportunities...</p></div>`;
    try {
        const jobs = await App.fetchAPI('/api/student/jobs');

        if (jobs.length === 0) {
            container.innerHTML = `<div class="glass-card"><p class="text-muted">No job postings available right now.</p></div>`;
            return;
        }

        container.innerHTML = `
            <div class="glass-card">
                <p class="section-title">Job Opportunities</p>
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;">
                    ${jobs.map(j => `
                        <div style="border: 1px solid var(--glass-border); border-radius: 12px; padding: 1.25rem;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <h4 style="margin-bottom: 0.25rem;">${j.title}</h4>
                                    <p class="text-muted" style="font-size: 0.85rem;">${j.company_name} · ${j.industry || ''}</p>
                                </div>
                                <div>
                                    ${j.application_status
                                        ? `<span class="badge badge-primary">${j.application_status}</span>`
                                        : `<button class="btn btn-primary btn-sm" onclick="applyJob(${j.id}, this)">Apply Now</button>`
                                    }
                                </div>
                            </div>
                            ${j.salary_package ? `<p style="margin-top: 0.75rem; font-size: 0.85rem;"><strong>Package:</strong> ${j.salary_package}</p>` : ''}
                            ${j.eligibility_criteria ? `<p style="font-size: 0.85rem;"><strong>Eligibility:</strong> ${j.eligibility_criteria}</p>` : ''}
                            ${j.deadline ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">Deadline: ${j.deadline}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="glass-card"><p class="text-danger">Failed to load jobs.</p></div>`;
        console.error(e);
    }
}

async function applyJob(jobId, btn) {
    btn.disabled = true;
    btn.textContent = 'Applying...';
    try {
        await App.fetchAPI(`/api/placement/jobs/${jobId}/apply`, { method: 'POST' });
        App.toast('Application submitted!');
        btn.textContent = 'Applied';
        btn.className = 'btn btn-success btn-sm';
    } catch (e) {
        btn.disabled = false;
        btn.textContent = 'Apply Now';
    }
}

function showAIModal(firstName) {
    const modal = document.getElementById('aiModal');
    if (modal) modal.style.display = 'flex';
}

function closeAI() {
    const modal = document.getElementById('aiModal');
    if (modal) modal.style.display = 'none';
}

async function submitAI(e) {
    e.preventDefault();
    const input = document.getElementById('aiInput');
    const query = input.value;
    const chatbox = document.getElementById('aiChatbox');
    
    chatbox.innerHTML += `<p style="margin-top: 0.5rem; text-align: right;"><strong>You:</strong> ${query}</p>`;
    input.value = '';
    chatbox.scrollTop = chatbox.scrollHeight;
    
    try {
        const data = await App.fetchAPI('/api/ai/ask', {
            method: 'POST',
            body: JSON.stringify({ query })
        });
        chatbox.innerHTML += `<p style="margin-top: 0.5rem; color: var(--primary);"><strong>AI:</strong> ${data.response}</p>`;
        chatbox.scrollTop = chatbox.scrollHeight;
    } catch (err) {
        chatbox.innerHTML += `<p style="margin-top: 0.5rem; color: var(--danger);"><strong>Error:</strong> Failed to get response.</p>`;
    }
}
