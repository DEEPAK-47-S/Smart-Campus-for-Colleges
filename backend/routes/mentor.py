from flask import Blueprint, jsonify, request, session
from backend.auth import role_required
from database.db import get_db_connection

mentor_bp = Blueprint('mentor', __name__)

@mentor_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok'})

@mentor_bp.route('/students', methods=['GET'])
@role_required(['mentor', 'admin'])
def get_my_students():
    mentor_user_id = session['user_id']
    conn = get_db_connection()
    students = conn.execute("""
        SELECT s.id, s.enrollment_no, s.first_name, s.last_name, s.email, s.semester, s.section,
               d.name as department_name,
               (SELECT ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END)*100/COUNT(*),1)
                FROM attendance a WHERE a.student_id=s.id) as attendance_pct
        FROM students s
        LEFT JOIN departments d ON s.department_id = d.id
        WHERE s.mentor_id = ?
        ORDER BY s.enrollment_no
    """, (mentor_user_id,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in students])

@mentor_bp.route('/student/<int:student_id>/profile', methods=['GET'])
@role_required(['mentor', 'admin'])
def get_student_profile(student_id):
    conn = get_db_connection()
    student = conn.execute("""
        SELECT s.*, d.name as department_name
        FROM students s
        LEFT JOIN departments d ON s.department_id = d.id
        WHERE s.id = ?
    """, (student_id,)).fetchone()
    
    if not student:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404
    
    marks = conn.execute("""
        SELECT m.exam_type, m.score, m.max_score, sub.name as subject_name
        FROM marks m JOIN subjects sub ON m.subject_id = sub.id
        WHERE m.student_id = ?
    """, (student_id,)).fetchall()
    
    total_att = conn.execute("SELECT COUNT(*) as c FROM attendance WHERE student_id = ?", (student_id,)).fetchone()['c']
    present_att = conn.execute("SELECT COUNT(*) as c FROM attendance WHERE student_id = ? AND status='present'", (student_id,)).fetchone()['c']
    att_pct = round(present_att / total_att * 100, 1) if total_att else 0
    
    conn.close()
    return jsonify({
        'profile': dict(student),
        'marks': [dict(m) for m in marks],
        'attendance': {'total': total_att, 'present': present_att, 'percentage': att_pct}
    })

@mentor_bp.route('/meeting', methods=['POST'])
@role_required(['mentor'])
def log_meeting():
    data = request.get_json()
    student_id = data.get('student_id')
    meeting_date = data.get('meeting_date')
    discussion = data.get('discussion')
    problems = data.get('problems')
    goals = data.get('goals')
    action_plan = data.get('action_plan')
    next_review_date = data.get('next_review_date')
    
    mentor_user_id = session['user_id']
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO mentoring (mentor_id, student_id, meeting_date, discussion, problems, goals, action_plan, next_review_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (mentor_user_id, student_id, meeting_date, discussion, problems, goals, action_plan, next_review_date))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400
    conn.close()
    return jsonify({'message': 'Meeting logged successfully'})

@mentor_bp.route('/meetings/<int:student_id>', methods=['GET'])
@role_required(['mentor', 'admin'])
def get_meetings(student_id):
    conn = get_db_connection()
    meetings = conn.execute("""
        SELECT * FROM mentoring WHERE student_id = ? ORDER BY meeting_date DESC
    """, (student_id,)).fetchall()
    conn.close()
    return jsonify([dict(m) for m in meetings])
