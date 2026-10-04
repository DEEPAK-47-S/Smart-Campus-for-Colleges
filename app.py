from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from functools import wraps
import os
from database.db import get_db_connection, init_db

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'smartcampus_niet_super_secret_key_dev')
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Import routes after app initialization to avoid circular imports
from backend.routes.admin import admin_bp
from backend.routes.faculty import faculty_bp
from backend.routes.student import student_bp
from backend.routes.hod import hod_bp
from backend.routes.mentor import mentor_bp
from backend.routes.placement import placement_bp
from backend.auth import auth_bp
from backend.ai_assistant import ai_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(faculty_bp, url_prefix='/api/faculty')
app.register_blueprint(student_bp, url_prefix='/api/student')
app.register_blueprint(hod_bp, url_prefix='/api/hod')
app.register_blueprint(mentor_bp, url_prefix='/api/mentor')
app.register_blueprint(placement_bp, url_prefix='/api/placement')
app.register_blueprint(ai_bp, url_prefix='/api/ai')

# Initialize DB on startup
with app.app_context():
    init_db()

# Template rendering routes
@app.route('/')
def index():
    if 'user_id' in session:
        role = session.get('role')
        return redirect(url_for(f'{role}_dashboard'))
    return render_template('index.html')

@app.route('/admin')
def admin_dashboard():
    if session.get('role') != 'admin':
        return redirect(url_for('index'))
    return render_template('admin_dashboard.html')

@app.route('/hod')
def hod_dashboard():
    if session.get('role') != 'hod':
        return redirect(url_for('index'))
    return render_template('hod_dashboard.html')

@app.route('/faculty')
def faculty_dashboard():
    if session.get('role') != 'faculty':
        return redirect(url_for('index'))
    return render_template('faculty_dashboard.html')

@app.route('/mentor')
def mentor_dashboard():
    if session.get('role') != 'mentor':
        return redirect(url_for('index'))
    return render_template('mentor_dashboard.html')

@app.route('/placement')
def placement_dashboard():
    if session.get('role') != 'placement':
        return redirect(url_for('index'))
    return render_template('placement_dashboard.html')

@app.route('/student')
def student_dashboard():
    if session.get('role') != 'student':
        return redirect(url_for('index'))
    return render_template('student_dashboard.html')

if __name__ == '__main__':
    app.run(debug=False, port=5000)
