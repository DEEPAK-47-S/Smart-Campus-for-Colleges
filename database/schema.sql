-- SMARTCAMPUS NIET Database Schema

-- Core Tables
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- admin, hod, faculty, mentor, placement, student
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    hod_id INTEGER,
    FOREIGN KEY(hod_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department_id INTEGER,
    FOREIGN KEY(department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    enrollment_no TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    department_id INTEGER,
    semester INTEGER,
    section TEXT,
    mentor_id INTEGER,
    profile_pic TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(department_id) REFERENCES departments(id),
    FOREIGN KEY(mentor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    employee_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    department_id INTEGER,
    designation TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    department_id INTEGER,
    semester INTEGER,
    FOREIGN KEY(department_id) REFERENCES departments(id)
);

-- Academic Tables
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    student_id INTEGER,
    subject_id INTEGER,
    faculty_id INTEGER,
    status TEXT NOT NULL, -- present, absent
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(faculty_id) REFERENCES faculty(id),
    UNIQUE(date, student_id, subject_id)
);

CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    subject_id INTEGER,
    exam_type TEXT NOT NULL, -- internal, lab, final
    score REAL NOT NULL,
    max_score REAL NOT NULL,
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    UNIQUE(student_id, subject_id, exam_type)
);

CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    subject_id INTEGER,
    faculty_id INTEGER,
    deadline DATETIME NOT NULL,
    max_marks REAL,
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(faculty_id) REFERENCES faculty(id)
);

CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER,
    student_id INTEGER,
    file_path TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    marks_obtained REAL,
    feedback TEXT,
    FOREIGN KEY(assignment_id) REFERENCES assignments(id),
    FOREIGN KEY(student_id) REFERENCES students(id),
    UNIQUE(assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id INTEGER,
    faculty_id INTEGER,
    department_id INTEGER,
    semester INTEGER,
    section TEXT,
    room TEXT,
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(faculty_id) REFERENCES faculty(id),
    FOREIGN KEY(department_id) REFERENCES departments(id)
);

-- Administrative & Support Tables
CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    leave_type TEXT,
    reason TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    approver_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(approver_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS mentoring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER,
    student_id INTEGER,
    meeting_date DATE NOT NULL,
    discussion TEXT,
    problems TEXT,
    goals TEXT,
    action_plan TEXT,
    next_review_date DATE,
    FOREIGN KEY(mentor_id) REFERENCES users(id),
    FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT,
    attachment TEXT,
    status TEXT DEFAULT 'submitted', -- submitted, assigned, in_progress, resolved, closed
    assigned_to INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(creator_id) REFERENCES users(id),
    FOREIGN KEY(assigned_to) REFERENCES users(id)
);

-- Placements & Skills
CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    category TEXT, -- programming, soft, technical
    name TEXT NOT NULL,
    proficiency TEXT,
    FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    guide_id INTEGER,
    status TEXT DEFAULT 'proposed',
    technology TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(guide_id) REFERENCES faculty(id)
);

CREATE TABLE IF NOT EXISTS project_members (
    project_id INTEGER,
    student_id INTEGER,
    role TEXT,
    PRIMARY KEY(project_id, student_id),
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    industry TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    eligibility_criteria TEXT,
    salary_package TEXT,
    deadline DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER,
    student_id INTEGER,
    status TEXT DEFAULT 'applied', -- applied, shortlisted, interviewed, offered, rejected
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id) REFERENCES jobs(id),
    FOREIGN KEY(student_id) REFERENCES students(id),
    UNIQUE(job_id, student_id)
);

-- Misc
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER,
    target_audience TEXT, -- all, department, faculty, student
    target_dept_id INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(creator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
