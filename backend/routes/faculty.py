from flask import Blueprint, jsonify, request, session
from backend.auth import role_required
from database.db import get_db_connection

faculty_bp = Blueprint('faculty', __name__)

@faculty_bp.route('/attendance/students', methods=['GET'])
@role_required(['faculty'])
def get_students_for_attendance():
    subject_id = request.args.get('subject_id')
    # For demo purposes, just getting all students. In reality, filter by subject enrollment.
    conn = get_db_connection()
    students = conn.execute("SELECT id, enrollment_no, first_name, last_name FROM students").fetchall()
    conn.close()
    return jsonify([dict(row) for row in students])

@faculty_bp.route('/attendance', methods=['POST'])
@role_required(['faculty'])
def mark_attendance():
    data = request.get_json()
    subject_id = data.get('subject_id')
    date = data.get('date')
    attendance_data = data.get('attendance') # list of {student_id, status}
    
    conn = get_db_connection()
    faculty = conn.execute("SELECT id FROM faculty WHERE user_id = ?", (session['user_id'],)).fetchone()
    
    if not faculty:
        conn.close()
        return jsonify({'error': 'Faculty profile not found'}), 404
        
    try:
        for record in attendance_data:
            conn.execute("""
                INSERT INTO attendance (date, student_id, subject_id, faculty_id, status)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(date, student_id, subject_id) DO UPDATE SET status=excluded.status
            """, (date, record['student_id'], subject_id, faculty['id'], record['status']))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400
    conn.close()
    
    return jsonify({'message': 'Attendance marked successfully'})

@faculty_bp.route('/marks', methods=['POST'])
@role_required(['faculty'])
def enter_marks():
    data = request.get_json()
    student_id = data.get('student_id')
    subject_id = data.get('subject_id')
    exam_type = data.get('exam_type')
    score = data.get('score')
    max_score = data.get('max_score')
    
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO marks (student_id, subject_id, exam_type, score, max_score)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(student_id, subject_id, exam_type) DO UPDATE SET score=excluded.score, max_score=excluded.max_score
        """, (student_id, subject_id, exam_type, score, max_score))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400
    conn.close()
    return jsonify({'message': 'Marks updated successfully'})

@faculty_bp.route('/subjects', methods=['GET'])
@role_required(['faculty'])
def get_faculty_subjects():
    # Demo: fetch all subjects for the faculty to select from
    conn = get_db_connection()
    subjects = conn.execute("SELECT id, name, code FROM subjects").fetchall()
    conn.close()
    return jsonify([dict(row) for row in subjects])
