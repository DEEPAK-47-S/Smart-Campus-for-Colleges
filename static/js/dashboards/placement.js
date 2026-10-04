// Placement Dashboard JS
document.addEventListener('DOMContentLoaded', async () => {
    loadModule('dashboard');
});

async function loadModule(moduleName) {
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    const container = document.getElementById('module-container');
    if (!container) return;

    container.innerHTML = `<div class="glass-card"><p>Loading ${moduleName} module...</p></div>`;

    if (moduleName === 'dashboard' || moduleName === 'overview') {
        try {
            const stats = await App.fetchAPI('/api/placement/dashboard_stats');
            container.innerHTML = `
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div class="glass-card">
                        <p class="text-muted">Active Job Openings</p>
                        <h2 style="color: var(--primary);">${stats.total_jobs || 0}</h2>
                    </div>
                    <div class="glass-card">
                        <p class="text-muted">Partner Companies</p>
                        <h2>${stats.total_companies || 0}</h2>
                    </div>
                    <div class="glass-card">
                        <p class="text-muted">Total Applications</p>
                        <h2>${stats.total_applications || 0}</h2>
                    </div>
                    <div class="glass-card">
                        <p class="text-muted">Students Placed</p>
                        <h2 style="color: var(--secondary);">${stats.placed_students || 0}</h2>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="glass-card"><p class="text-danger">Failed to load statistics: ${App.escapeHTML(err.message)}</p></div>`;
        }
    } else if (moduleName === 'jobs') {
        try {
            const jobs = await App.fetchAPI('/api/placement/jobs');
            container.innerHTML = `
                <div class="glass-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3><i class="fas fa-briefcase"></i> Job Postings (${jobs.length})</h3>
                        <button class="btn btn-primary btn-sm" onclick="openPostJobModal()">+ Post New Job</button>
                    </div>
                    ${jobs.length === 0 ? '<p class="text-muted">No active job postings found.</p>' : `
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Title</th>
                                    <th>Package</th>
                                    <th>Eligibility</th>
                                    <th>Deadline</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${jobs.map(j => `
                                    <tr>
                                        <td><strong>${App.escapeHTML(j.company_name)}</strong> <small class="text-muted">(${App.escapeHTML(j.industry || 'IT')})</small></td>
                                        <td>${App.escapeHTML(j.title)}</td>
                                        <td><span class="badge badge-success">${App.escapeHTML(j.salary_package || 'N/A')}</span></td>
                                        <td>${App.escapeHTML(j.eligibility_criteria || 'Open')}</td>
                                        <td>${j.deadline ? App.escapeHTML(j.deadline) : 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="glass-card"><p class="text-danger">Failed to load jobs: ${App.escapeHTML(err.message)}</p></div>`;
        }
    } else if (moduleName === 'applications') {
        try {
            const apps = await App.fetchAPI('/api/placement/applications');
            container.innerHTML = `
                <div class="glass-card">
                    <h3><i class="fas fa-file-alt"></i> Student Applications</h3>
                    ${apps.length === 0 ? '<p class="text-muted">No student applications received yet.</p>' : `
                        <table class="table" style="margin-top: 1rem;">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Enrollment</th>
                                    <th>Job Title</th>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${apps.map(a => `
                                    <tr>
                                        <td>${App.escapeHTML(a.first_name)} ${App.escapeHTML(a.last_name)}</td>
                                        <td><strong>${App.escapeHTML(a.enrollment_no)}</strong></td>
                                        <td>${App.escapeHTML(a.job_title)}</td>
                                        <td>${App.escapeHTML(a.company_name)}</td>
                                        <td>
                                            <span class="badge ${a.status === 'offered' ? 'badge-success' : (a.status === 'rejected' ? 'badge-danger' : 'badge-warning')}">
                                                ${App.escapeHTML(a.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <select onchange="updateAppStatus(${a.id}, this.value)" style="padding: 0.2rem; border-radius: 4px; background: var(--glass-bg); color: var(--text-color);">
                                                <option value="applied" ${a.status==='applied'?'selected':''}>Applied</option>
                                                <option value="shortlisted" ${a.status==='shortlisted'?'selected':''}>Shortlisted</option>
                                                <option value="interviewed" ${a.status==='interviewed'?'selected':''}>Interviewed</option>
                                                <option value="offered" ${a.status==='offered'?'selected':''}>Offered</option>
                                                <option value="rejected" ${a.status==='rejected'?'selected':''}>Rejected</option>
                                            </select>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="glass-card"><p class="text-danger">Failed to load applications: ${App.escapeHTML(err.message)}</p></div>`;
        }
    } else {
        container.innerHTML = `<div class="glass-card"><p>Module ${moduleName} is under construction.</p></div>`;
    }
}

function openPostJobModal() {
    const modalHTML = `
        <div class="modal-overlay" id="jobModal" style="display: flex;">
            <div class="glass-card modal-content" style="max-width: 500px; width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.8rem; margin-bottom: 1rem;">
                    <h3 style="margin:0;"><i class="fas fa-plus-circle"></i> Post New Placement Opportunity</h3>
                    <button onclick="document.getElementById('jobModal').remove()" style="background:none; border:none; color: var(--text-color); font-size: 1.2rem; cursor:pointer;">&times;</button>
                </div>
                <form id="postJobForm">
                    <div class="form-group" style="margin-bottom: 0.8rem;">
                        <label>Company Name</label>
                        <input type="text" id="j_company" class="form-control" placeholder="e.g. Google / Microsoft" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 0.8rem;">
                        <label>Industry</label>
                        <input type="text" id="j_industry" class="form-control" placeholder="e.g. Information Technology" value="IT / Software">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.8rem;">
                        <label>Job Title</label>
                        <input type="text" id="j_title" class="form-control" placeholder="e.g. Software Engineer Trainee" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 0.8rem;">
                        <label>Salary Package (LPA / Stipend)</label>
                        <input type="text" id="j_salary" class="form-control" placeholder="e.g. 12 LPA">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.8rem;">
                        <label>Eligibility Criteria</label>
                        <input type="text" id="j_eligibility" class="form-control" placeholder="e.g. CGPA > 7.5, CSE/IT">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.8rem;">
                        <label>Application Deadline</label>
                        <input type="date" id="j_deadline" class="form-control">
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('jobModal').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-sm">Post Opportunity</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('postJobForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await App.fetchAPI('/api/placement/jobs', {
                method: 'POST',
                body: JSON.stringify({
                    company_name: document.getElementById('j_company').value,
                    industry: document.getElementById('j_industry').value,
                    title: document.getElementById('j_title').value,
                    salary_package: document.getElementById('j_salary').value,
                    eligibility_criteria: document.getElementById('j_eligibility').value,
                    deadline: document.getElementById('j_deadline').value
                })
            });
            App.toast('Job posted successfully!', 'success');
            document.getElementById('jobModal').remove();
            loadModule('jobs');
        } catch (err) {
            App.toast('Failed to post job: ' + err.message, 'danger');
        }
    });
}

async function updateAppStatus(appId, newStatus) {
    try {
        await App.fetchAPI(`/api/placement/applications/${appId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });
        App.toast('Application status updated to ' + newStatus, 'success');
    } catch (err) {
        App.toast('Failed to update status: ' + err.message, 'danger');
    }
}
