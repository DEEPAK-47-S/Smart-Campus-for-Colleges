from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash
from functools import wraps
from database.db import get_db_connection

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'Unauthorized'}), 401
            if session.get('role') not in roles:
                return jsonify({'error': 'Forbidden: Insufficient privileges'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
        
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ? AND status = 'active'", (username,)).fetchone()
    
    if user and check_password_hash(user['password_hash'], password):
        session.clear()
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        
        conn.execute("INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)", 
                     (user['id'], 'login', request.remote_addr))
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'role': user['role']
            }
        }), 200
    
    conn.close()
    return jsonify({'error': 'Invalid username or password'}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    email = data.get('email', '')

    valid_roles = ['student', 'faculty', 'hod', 'mentor', 'placement', 'admin']
    if not username or not password or not role:
        return jsonify({'error': 'Username, password and role are required'}), 400
    if role not in valid_roles:
        return jsonify({'error': 'Invalid role selected'}), 400

    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'Username already exists'}), 400

    try:
        p_hash = generate_password_hash(password)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, 'active')", 
                       (username, p_hash, role))
        user_id = cursor.lastrowid

        # Populate corresponding profile based on role
        dept = conn.execute("SELECT id FROM departments LIMIT 1").fetchone()
        dept_id = dept['id'] if dept else None

        if role == 'student':
            enrollment = f"EN{user_id:06d}"
            conn.execute("""
                INSERT INTO students (user_id, enrollment_no, first_name, last_name, email, department_id, semester)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            """, (user_id, enrollment, first_name or username, last_name or 'User', email or f"{username}@campus.edu", dept_id))
        elif role in ['faculty', 'hod', 'mentor', 'placement']:
            emp_id = f"EMP{user_id:04d}"
            conn.execute("""
                INSERT INTO faculty (user_id, employee_id, first_name, last_name, email, department_id, designation)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (user_id, emp_id, first_name or username, last_name or 'User', email or f"{username}@campus.edu", dept_id, role.capitalize()))

        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400

    conn.close()
    return jsonify({'message': 'Registration successful! You can now log in.'}), 201

@auth_bp.route('/logout', methods=['POST'])
def logout():
    if 'user_id' in session:
        conn = get_db_connection()
        conn.execute("INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)", 
                     (session['user_id'], 'logout', request.remote_addr))
        conn.commit()
        conn.close()
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
@login_required
def me():
    return jsonify({
        'id': session['user_id'],
        'username': session['username'],
        'role': session['role']
    }), 200
