from flask import Blueprint, jsonify, request, session
from backend.auth import role_required
from database.db import get_db_connection

placement_bp = Blueprint('placement', __name__)

@placement_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok'})

@placement_bp.route('/dashboard_stats', methods=['GET'])
@role_required(['placement', 'admin'])
def get_placement_stats():
    conn = get_db_connection()
    total_jobs = conn.execute("SELECT COUNT(*) as c FROM jobs").fetchone()['c']
    total_companies = conn.execute("SELECT COUNT(*) as c FROM companies").fetchone()['c']
    total_applications = conn.execute("SELECT COUNT(*) as c FROM applications").fetchone()['c']
    placed_students = conn.execute("SELECT COUNT(DISTINCT student_id) as c FROM applications WHERE status='offered'").fetchone()['c']
    conn.close()
    return jsonify({
        'total_jobs': total_jobs,
        'total_companies': total_companies,
        'total_applications': total_applications,
        'placed_students': placed_students
    })

@placement_bp.route('/jobs', methods=['GET'])
@role_required(['placement', 'admin', 'student'])
def get_jobs():
    conn = get_db_connection()
    jobs = conn.execute("""
        SELECT j.id, j.title, j.description, j.eligibility_criteria, j.salary_package, j.deadline,
               c.name as company_name, c.industry
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        ORDER BY j.created_at DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(row) for row in jobs])

@placement_bp.route('/jobs', methods=['POST'])
@role_required(['placement', 'admin'])
def create_job():
    data = request.get_json()
    company_name = data.get('company_name')
    industry = data.get('industry', '')
    title = data.get('title')
    description = data.get('description', '')
    eligibility = data.get('eligibility_criteria', '')
    salary = data.get('salary_package', '')
    deadline = data.get('deadline')
    
    if not company_name or not title:
        return jsonify({'error': 'Company name and title required'}), 400
    
    conn = get_db_connection()
    try:
        # Upsert company
        existing = conn.execute("SELECT id FROM companies WHERE name = ?", (company_name,)).fetchone()
        if existing:
            company_id = existing['id']
        else:
            conn.execute("INSERT INTO companies (name, industry) VALUES (?, ?)", (company_name, industry))
            company_id = conn.execute("SELECT last_insert_rowid() as id").fetchone()['id']
        
        conn.execute("""
            INSERT INTO jobs (company_id, title, description, eligibility_criteria, salary_package, deadline)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (company_id, title, description, eligibility, salary, deadline))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400
    conn.close()
    return jsonify({'message': 'Job posted successfully'})

@placement_bp.route('/jobs/<int:job_id>/apply', methods=['POST'])
@role_required(['student'])
def apply_for_job(job_id):
    conn = get_db_connection()
    student = conn.execute("SELECT id FROM students WHERE user_id = ?", (session['user_id'],)).fetchone()
    if not student:
        conn.close()
        return jsonify({'error': 'Student profile not found'}), 404
    
    try:
        conn.execute("INSERT INTO applications (job_id, student_id) VALUES (?, ?)", (job_id, student['id']))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': 'Already applied or error: ' + str(e)}), 400
    conn.close()
    return jsonify({'message': 'Applied successfully'})

@placement_bp.route('/applications', methods=['GET'])
@role_required(['placement', 'admin'])
def get_applications():
    conn = get_db_connection()
    apps = conn.execute("""
        SELECT a.id, a.status, a.applied_at,
               s.enrollment_no, s.first_name, s.last_name,
               j.title as job_title, c.name as company_name
        FROM applications a
        JOIN students s ON a.student_id = s.id
        JOIN jobs j ON a.job_id = j.id
        JOIN companies c ON j.company_id = c.id
        ORDER BY a.applied_at DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(row) for row in apps])

@placement_bp.route('/applications/<int:app_id>/status', methods=['PATCH'])
@role_required(['placement', 'admin'])
def update_application_status(app_id):
    data = request.get_json()
    status = data.get('status')
    valid_statuses = ['applied', 'shortlisted', 'interviewed', 'offered', 'rejected']
    if status not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    conn = get_db_connection()
    conn.execute("UPDATE applications SET status = ? WHERE id = ?", (status, app_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Status updated'})
