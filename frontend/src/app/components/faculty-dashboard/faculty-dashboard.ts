import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { SubjectService } from '../../services/subject.service';
import { AttendanceService } from '../../services/attendance.service';

interface QuickAction {
  label: string;
  description: string;
  route: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-faculty-dashboard',
  imports: [DatePipe],
  templateUrl: './faculty-dashboard.html',
  styleUrl: './faculty-dashboard.css'
})
export class FacultyDashboard implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private studentService = inject(StudentService);
  private subjectService = inject(SubjectService);
  private attendanceService = inject(AttendanceService);

  userName = this.authService.getUser()?.name ?? 'Faculty';

  totalStudents: number | null = null;
  totalSubjects: number | null = null;
  totalAttendance: number | null = null;

  actions: QuickAction[] = [
    { label: 'Mark Attendance', description: 'Record today\'s attendance', route: '/app/attendance', icon: 'calendar', color: '#10b981' },
    { label: 'Enter Marks', description: 'Add & update student marks', route: '/app/marks', icon: 'clipboard', color: '#f59e0b' },
    { label: 'View Results', description: 'Check student performance', route: '/app/results', icon: 'award', color: '#ef4444' },
    { label: 'Students', description: 'Browse the student directory', route: '/app/students', icon: 'users', color: '#6366f1' }
  ];

  today = new Date();

  ngOnInit(): void {
    this.studentService.getStudents(1, 1).subscribe({
      next: (res) => (this.totalStudents = res.totalStudents || 0),
      error: () => (this.totalStudents = 0)
    });
    this.subjectService.getSubjects(1, 1).subscribe({
      next: (res) => (this.totalSubjects = res.totalSubjects || 0),
      error: () => (this.totalSubjects = 0)
    });
    this.attendanceService.getAttendance(1, 1).subscribe({
      next: (res) => (this.totalAttendance = res.totalAttendance || 0),
      error: () => (this.totalAttendance = 0)
    });
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }
}
