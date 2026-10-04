import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from database.db import get_db_connection

def generate_admin_report():
    reports_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads')
    os.makedirs(reports_dir, exist_ok=True)
    filepath = os.path.join(reports_dir, 'admin_report.pdf')
    
    doc = SimpleDocTemplate(filepath, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    story.append(Paragraph("SMARTCAMPUS NIET - Admin Report", styles['Title']))
    story.append(Spacer(1, 12))
    
    conn = get_db_connection()
    
    # Get Students
    students = conn.execute("SELECT enrollment_no, first_name, last_name, semester FROM students").fetchall()
    
    if students:
        story.append(Paragraph("Students List", styles['Heading2']))
        data = [["Enrollment No", "First Name", "Last Name", "Semester"]]
        for s in students:
            data.append([s['enrollment_no'], s['first_name'], s['last_name'], str(s['semester'])])
            
        table = Table(data, colWidths=[100, 150, 150, 80])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        story.append(table)
        
    conn.close()
    
    doc.build(story)
    return 'static/uploads/admin_report.pdf'
