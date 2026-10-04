from flask import Blueprint, jsonify, request, session
from backend.auth import role_required
from database.db import get_db_connection
from werkzeug.security import generate_password_hash
from backend.reports import generate_admin_report

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard_stats', methods=['GET'])
@role_required(['admin'])
def get_stats():
    conn = get_db_connection()
    students_count = conn.execute("SELECT COUNT(*) as count FROM students").fetchone()['count']
    faculty_count = conn.execute("SELECT COUNT(*) as count FROM faculty").fetchone()['count']
    depts_count = conn.execute("SELECT COUNT(*) as count FROM departments").fetchone()['count']
    companies_count = conn.execute("SELECT COUNT(*) as count FROM companies").fetchone()['count']
    conn.close()
    
    return jsonify({
        'total_students': students_count,
        'total_faculty': faculty_count,
        'total_departments': depts_count,
        'total_companies': companies_count
    })

@admin_bp.route('/users', methods=['GET'])
@role_required(['admin'])
def get_users():
    conn = get_db_connection()
    users = conn.execute("SELECT id, username, role, status, created_at FROM users ORDER BY created_at DESC").fetchall()
    conn.close()
    return jsonify([dict(row) for row in users])

@admin_bp.route('/users', methods=['POST'])
@role_required(['admin'])
def create_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    
    if not username or not password or not role:
        return jsonify({'error': 'Missing fields'}), 400
        
    password_hash = generate_password_hash(password)
    
    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
                     (username, password_hash, role))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400
    conn.close()
    
    return jsonify({'message': 'User created successfully'})

@admin_bp.route('/users/<int:user_id>/toggle_status', methods=['PATCH'])
@role_required(['admin'])
def toggle_user_status(user_id):
    conn = get_db_connection()
    user = conn.execute("SELECT status FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    new_status = 'inactive' if user['status'] == 'active' else 'active'
    conn.execute("UPDATE users SET status = ? WHERE id = ?", (new_status, user_id))
    conn.commit()
    conn.close()
    return jsonify({'message': f'User status changed to {new_status}', 'status': new_status})

@admin_bp.route('/departments', methods=['GET'])
@role_required(['admin', 'hod'])
def get_departments():
    conn = get_db_connection()
    depts = conn.execute("SELECT d.id, d.name, d.code, u.username as hod_name FROM departments d LEFT JOIN users u ON d.hod_id = u.id").fetchall()
    conn.close()
    return jsonify([dict(row) for row in depts])

@admin_bp.route('/departments', methods=['POST'])
@role_required(['admin'])
def create_department():
    data = request.get_json()
    name = data.get('name')
    code = data.get('code')
    hod_id = data.get('hod_id')
    
    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO departments (name, code, hod_id) VALUES (?, ?, ?)", 
                     (name, code, hod_id))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400
    conn.close()
    
    return jsonify({'message': 'Department created successfully'})

@admin_bp.route('/announcements', methods=['POST'])
@role_required(['admin', 'hod'])
def post_announcement():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    target_audience = data.get('target_audience', 'all')
    target_dept_id = data.get('target_dept_id')
    
    if not title or not content:
        return jsonify({'error': 'Title and content required'}), 400
    
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO announcements (creator_id, target_audience, target_dept_id, title, content)
            VALUES (?, ?, ?, ?, ?)
        """, (session['user_id'], target_audience, target_dept_id, title, content))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400
    conn.close()
    return jsonify({'message': 'Announcement posted successfully'})

@admin_bp.route('/announcements', methods=['GET'])
@role_required(['admin'])
def get_announcements():
    conn = get_db_connection()
    announcements = conn.execute("""
        SELECT a.id, a.title, a.content, a.target_audience, a.created_at,
               u.username as created_by
        FROM announcements a
        JOIN users u ON a.creator_id = u.id
        ORDER BY a.created_at DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(a) for a in announcements])

@admin_bp.route('/generate_report', methods=['GET'])
@role_required(['admin'])
def generate_report():
    try:
        report_path = generate_admin_report()
        return jsonify({'message': 'Report generated successfully', 'url': f'/{report_path}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
