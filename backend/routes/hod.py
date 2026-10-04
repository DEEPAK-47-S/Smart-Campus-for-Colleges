from flask import Blueprint, jsonify, request, session
from backend.auth import role_required
from database.db import get_db_connection

hod_bp = Blueprint('hod', __name__)

@hod_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok'})

@hod_bp.route('/dashboard_stats', methods=['GET'])
@role_required(['hod', 'admin'])
def get_hod_stats():
    conn = get_db_connection()
    # Get the hod's department
    hod_user_id = session['user_id']
    dept = conn.execute("SELECT id FROM departments WHERE hod_id = ?", (hod_user_id,)).fetchone()
    
    if not dept:
        conn.close()
        return jsonify({'total_students': 0, 'total_faculty': 0, 'avg_attendance': 0, 'avg_marks': 0})
    
    dept_id = dept['id']
    
    student_count = conn.execute("SELECT COUNT(*) as c FROM students WHERE department_id = ?", (dept_id,)).fetchone()['c']
    faculty_count = conn.execute("SELECT COUNT(*) as c FROM faculty WHERE department_id = ?", (dept_id,)).fetchone()['c']
    
    # Average attendance for department
    att = conn.execute("""
        SELECT COUNT(*) as total, SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) as present
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE s.department_id = ?
    """, (dept_id,)).fetchone()
    avg_att = round((att['present'] / att['total'] * 100), 1) if att['total'] else 0
    
    # Average marks
    marks = conn.execute("""
        SELECT AVG(m.score / m.max_score * 100) as avg
        FROM marks m
        JOIN students s ON m.student_id = s.id
        WHERE s.department_id = ?
    """, (dept_id,)).fetchone()
    avg_marks = round(marks['avg'], 1) if marks['avg'] else 0
    
    conn.close()
    return jsonify({
        'total_students': student_count,
        'total_faculty': faculty_count,
        'avg_attendance': avg_att,
        'avg_marks': avg_marks
    })

@hod_bp.route('/students', methods=['GET'])
@role_required(['hod', 'admin'])
def get_dept_students():
    hod_user_id = session['user_id']
    conn = get_db_connection()
    dept = conn.execute("SELECT id FROM departments WHERE hod_id = ?", (hod_user_id,)).fetchone()
    if not dept:
        conn.close()
        return jsonify([])
    
    students = conn.execute("""
        SELECT s.enrollment_no, s.first_name, s.last_name, s.semester, s.section,
               (SELECT ROUND(SUM(CASE WHEN a.status='present' THEN 1.0 ELSE 0 END)*100/COUNT(*),1) 
                FROM attendance a WHERE a.student_id=s.id) as attendance_pct
        FROM students s WHERE s.department_id = ?
        ORDER BY s.semester, s.enrollment_no
    """, (dept['id'],)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in students])

@hod_bp.route('/faculty', methods=['GET'])
@role_required(['hod', 'admin'])
def get_dept_faculty():
    hod_user_id = session['user_id']
    conn = get_db_connection()
    dept = conn.execute("SELECT id FROM departments WHERE hod_id = ?", (hod_user_id,)).fetchone()
    if not dept:
        conn.close()
        return jsonify([])
    
    faculty = conn.execute("""
        SELECT f.employee_id, f.first_name, f.last_name, f.designation, f.email
        FROM faculty f WHERE f.department_id = ?
        ORDER BY f.first_name
    """, (dept['id'],)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in faculty])
