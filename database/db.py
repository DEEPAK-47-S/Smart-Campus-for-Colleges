import sqlite3
import os
import shutil
from werkzeug.security import generate_password_hash

# Handle serverless / read-only filesystem (like Vercel /tmp directory)
if os.environ.get('VERCEL'):
    DB_PATH = '/tmp/smartcampus.db'
    ORIG_DB = os.path.join(os.path.dirname(__file__), 'smartcampus.db')
    if not os.path.exists(DB_PATH) and os.path.exists(ORIG_DB):
        shutil.copyfile(ORIG_DB, DB_PATH)
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), 'smartcampus.db')

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'schema.sql')

def get_db_connection():
    if os.environ.get('VERCEL') and not os.path.exists(DB_PATH):
        init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    with open(SCHEMA_PATH, 'r') as f:
        conn.executescript(f.read())
    
    default_users = [
        ('admin', generate_password_hash('123456'), 'admin'),
        ('hod_cse', generate_password_hash('123456'), 'hod'),
        ('faculty_john', generate_password_hash('123456'), 'faculty'),
        ('mentor_jane', generate_password_hash('123456'), 'mentor'),
        ('placement_officer', generate_password_hash('123456'), 'placement'),
        ('student_alice', generate_password_hash('123456'), 'student'),
    ]
    
    for username, p_hash, role in default_users:
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        if row:
            cursor.execute("UPDATE users SET password_hash = ?, role = ?, status = 'active' WHERE username = ?", (p_hash, role, username))
        else:
            cursor.execute("INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, 'active')", (username, p_hash, role))

    conn.commit()

    admin_id = cursor.execute("SELECT id FROM users WHERE username = 'admin'").fetchone()['id']
    hod_id = cursor.execute("SELECT id FROM users WHERE username = 'hod_cse'").fetchone()['id']
    faculty_id = cursor.execute("SELECT id FROM users WHERE username = 'faculty_john'").fetchone()['id']
    mentor_id = cursor.execute("SELECT id FROM users WHERE username = 'mentor_jane'").fetchone()['id']
    placement_id = cursor.execute("SELECT id FROM users WHERE username = 'placement_officer'").fetchone()['id']
    student_id = cursor.execute("SELECT id FROM users WHERE username = 'student_alice'").fetchone()['id']

    cursor.execute("SELECT id FROM departments WHERE code = 'CSE'")
    dept_row = cursor.fetchone()
    if not dept_row:
        cursor.execute("INSERT INTO departments (name, code, hod_id) VALUES ('Computer Science', 'CSE', ?)", (hod_id,))
        dept_id = cursor.lastrowid
    else:
        dept_id = dept_row['id']

    cursor.execute("SELECT id FROM students WHERE user_id = ?", (student_id,))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO students (user_id, enrollment_no, first_name, last_name, email, department_id, semester, mentor_id)
            VALUES (?, 'EN2026001', 'Alice', 'Smith', 'alice@niet.edu', ?, 3, ?)
        """, (student_id, dept_id, mentor_id))

    cursor.execute("SELECT id FROM faculty WHERE user_id = ?", (faculty_id,))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO faculty (user_id, employee_id, first_name, last_name, email, department_id, designation)
            VALUES (?, 'EMP001', 'John', 'Doe', 'john@niet.edu', ?, 'Assistant Professor')
        """, (faculty_id, dept_id))

    cursor.execute("SELECT id FROM subjects WHERE code = 'CS201'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO subjects (name, code, department_id, semester) VALUES ('Data Structures', 'CS201', ?, 3)", (dept_id,))

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database re-initialized successfully.")
