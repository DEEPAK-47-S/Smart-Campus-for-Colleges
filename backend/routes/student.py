from flask import Blueprint, jsonify, request, session
from backend.auth import role_required
from database.db import get_db_connection

student_bp = Blueprint('student', __name__)

@student_bp.route('/profile', methods=['GET'])
@role_required(['student', 'hod', 'mentor', 'faculty'])
def get_profile():
    student_user_id = session['user_id']
    
    conn = get_db_connection()
    student = conn.execute("""
        SELECT s.*, d.name as department_name, u.username as mentor_name 
        FROM students s 
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN users u ON s.mentor_id = u.id
        WHERE s.user_id = ?
    """, (student_user_id,)).fetchone()
    
    if not student:
        conn.close()
        return jsonify({'error': 'Student profile not found'}), 404
        
    # Get attendance summary
    total_classes = conn.execute("SELECT COUNT(*) as count FROM attendance WHERE student_id = ?", (student['id'],)).fetchone()['count']
    present_classes = conn.execute("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'present'", (student['id'],)).fetchone()['count']
    attendance_percentage = (present_classes / total_classes * 100) if total_classes > 0 else 0
    
    # Get marks
    marks = conn.execute("""
        SELECT m.exam_type, m.score, m.max_score, sub.name as subject_name 
        FROM marks m
        JOIN subjects sub ON m.subject_id = sub.id
        WHERE m.student_id = ?
    """, (student['id'],)).fetchall()
    
    conn.close()
    
    return jsonify({
        'profile': dict(student),
        'attendance': {
            'total': total_classes,
            'present': present_classes,
            'percentage': round(attendance_percentage, 2)
        },
        'marks': [dict(m) for m in marks]
    })

@student_bp.route('/attendance', methods=['GET'])
@role_required(['student'])
def get_attendance():
    conn = get_db_connection()
    student = conn.execute("SELECT id FROM students WHERE user_id = ?", (session['user_id'],)).fetchone()
    if not student:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404
    
    records = conn.execute("""
        SELECT a.date, a.status, sub.name as subject_name, sub.code as subject_code
        FROM attendance a
        JOIN subjects sub ON a.subject_id = sub.id
        WHERE a.student_id = ?
        ORDER BY a.date DESC
    """, (student['id'],)).fetchall()
    
    # Group by subject
    subject_summary = conn.execute("""
        SELECT sub.name as subject_name, sub.code as subject_code,
               COUNT(*) as total,
               SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) as present
        FROM attendance a
        JOIN subjects sub ON a.subject_id = sub.id
        WHERE a.student_id = ?
        GROUP BY a.subject_id
    """, (student['id'],)).fetchall()
    
    summary = []
    for s in subject_summary:
        row = dict(s)
        row['percentage'] = round(row['present'] / row['total'] * 100, 1) if row['total'] else 0
        summary.append(row)
    
    conn.close()
    return jsonify({
        'records': [dict(r) for r in records],
        'summary': summary
    })

@student_bp.route('/marks', methods=['GET'])
@role_required(['student'])
def get_marks():
    conn = get_db_connection()
    student = conn.execute("SELECT id FROM students WHERE user_id = ?", (session['user_id'],)).fetchone()
    if not student:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404
    
    marks = conn.execute("""
        SELECT m.exam_type, m.score, m.max_score, 
               ROUND(m.score / m.max_score * 100, 1) as percentage,
               sub.name as subject_name, sub.code as subject_code
        FROM marks m
        JOIN subjects sub ON m.subject_id = sub.id
        WHERE m.student_id = ?
        ORDER BY sub.name, m.exam_type
    """, (student['id'],)).fetchall()
    conn.close()
    return jsonify([dict(m) for m in marks])

@student_bp.route('/jobs', methods=['GET'])
@role_required(['student'])
def get_available_jobs():
    conn = get_db_connection()
    student = conn.execute("SELECT id FROM students WHERE user_id = ?", (session['user_id'],)).fetchone()
    
    jobs = conn.execute("""
        SELECT j.id, j.title, j.description, j.eligibility_criteria, j.salary_package, j.deadline,
               c.name as company_name, c.industry,
               CASE WHEN a.id IS NOT NULL THEN a.status ELSE NULL END as application_status
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        LEFT JOIN applications a ON a.job_id = j.id AND a.student_id = ?
        ORDER BY j.created_at DESC
    """, (student['id'] if student else 0,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in jobs])

@student_bp.route('/announcements', methods=['GET'])
@role_required(['student'])
def get_announcements():
    conn = get_db_connection()
    student = conn.execute("""
        SELECT s.department_id FROM students s WHERE s.user_id = ?
    """, (session['user_id'],)).fetchone()
    
    dept_id = student['department_id'] if student else None
    
    announcements = conn.execute("""
        SELECT a.title, a.content, a.created_at, a.target_audience,
               u.username as created_by
        FROM announcements a
        JOIN users u ON a.creator_id = u.id
        WHERE a.target_audience = 'all'
           OR a.target_audience = 'student'
           OR (a.target_audience = 'department' AND a.target_dept_id = ?)
        ORDER BY a.created_at DESC
        LIMIT 20
    """, (dept_id,)).fetchall()
    conn.close()
    return jsonify([dict(a) for a in announcements])
