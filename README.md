# 🎓 SMARTCAMPUS - Unified College & University ERP Platform

SmartCampus is a comprehensive, enterprise-grade College & University ERP System built with Flask, SQLite/PostgreSQL, and Modern Vanilla JavaScript. It connects all campus stakeholders into a unified digital ecosystem.

---

## 👥 Roles, Capabilities & Responsibilities

### 1. 🛡️ System Administrator (`admin`)
- **Responsibilities:** Managing campus-wide users, roles, system status, audit logs, and global announcements.
- **Key Modules:** User Management, Department Setup, Audit Trail, System Health Analytics, Global Broadcasts.
- **Seed Login:** `username: admin` | `password: 123456`

---

### 2. 🏛️ Head of Department (`hod`)
- **Responsibilities:** Overseeing departmental performance, faculty assignment, student academic progress, and branch analytics.
- **Key Modules:** Department Analytics, Faculty Management, Student Directory, Course Approval.
- **Seed Login:** `username: hod_cse` | `password: 123456`

---

### 3. 👨‍🏫 Faculty / Professor (`faculty`)
- **Responsibilities:** Marking student attendance, entering internal/external exam marks, managing subjects, and publishing notices.
- **Key Modules:** Daily Attendance Registry, Marks Portal, Subject Rosters, Department Notices.
- **Seed Login:** `username: faculty_john` | `password: 123456`

---

### 4. 🤝 Academic Mentor (`mentor`)
- **Responsibilities:** Guiding assigned mentees, conducting 1-on-1 performance reviews, tracking 360° student growth, and recording meeting minutes.
- **Key Modules:** Assigned Mentees, 360° Student Academic Profile, Meeting Log System.
- **Seed Login:** `username: mentor_jane` | `password: 123456`

---

### 5. 💼 Placement Officer (`placement`)
- **Responsibilities:** Managing campus recruitment drives, company relations, job postings, and tracking student applications.
- **Key Modules:** Placement Dashboard, Job Posting Engine, Student Application Tracker, Selection Status Updater.
- **Seed Login:** `username: placement_officer` | `password: 123456`

---

### 6. 🎓 Student (`student`)
- **Responsibilities:** Accessing academic progress, checking daily attendance %, subject marks, applying for jobs, and receiving campus updates.
- **Key Modules:** Student Dashboard, Subject-wise Attendance, Marks Summary, Placement Drive Applications, Announcements.
- **Seed Login:** `username: student_alice` | `password: 123456`

---

## ⚡ Deployment Instructions for Vercel

1. Push this repository to GitHub.
2. Log into [Vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository `DEEPAK-47-S/Smart-Campus-for-Colleges`.
4. Click **Deploy**. Vercel will automatically build the Flask application using `vercel.json` and `vercel_app.py`.
