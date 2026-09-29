import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { FacultyService } from '../../services/faculty.service';
import { SubjectService } from '../../services/subject.service';
import { AttendanceService } from '../../services/attendance.service';
import { MarksService } from '../../services/marks.service';

interface Stat {
  label: string;
  value: number;
  icon: string;
  color: string;
  loading: boolean;
}

interface QuickAction {
  label: string;
  description: string;
  route: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [DatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboard implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private studentService = inject(StudentService);
  private facultyService = inject(FacultyService);
  private subjectService = inject(SubjectService);
  private attendanceService = inject(AttendanceService);
  private marksService = inject(MarksService);
  private cdr = inject(ChangeDetectorRef);

  userName = this.authService.getUser()?.name ?? 'Admin';

  stats: Stat[] = [
    { label: 'Total Students', value: 0, icon: 'users', color: '#6366f1', loading: true },
    { label: 'Faculty Members', value: 0, icon: 'teacher', color: '#0ea5e9', loading: true },
    { label: 'Subjects', value: 0, icon: 'book', color: '#8b5cf6', loading: true },
    { label: 'Attendance Records', value: 0, icon: 'calendar', color: '#10b981', loading: true },
    { label: 'Marks Entries', value: 0, icon: 'clipboard', color: '#f59e0b', loading: true }
  ];

  actions: QuickAction[] = [
    { label: 'Manage Students', description: 'Add, edit or remove students', route: '/app/students', icon: 'users', color: '#6366f1' },
    { label: 'Manage Faculty', description: 'Staff records & profiles', route: '/app/faculties', icon: 'teacher', color: '#0ea5e9' },
    { label: 'Subjects', description: 'Create & assign subjects', route: '/app/subjects', icon: 'book', color: '#8b5cf6' },
    { label: 'Mark Attendance', description: 'Record daily attendance', route: '/app/attendance', icon: 'calendar', color: '#10b981' },
    { label: 'Marks Entry', description: 'Add & update marks', route: '/app/marks', icon: 'clipboard', color: '#f59e0b' },
    { label: 'View Results', description: 'Student results & progress', route: '/app/results', icon: 'award', color: '#ef4444' }
  ];

  today = new Date();

  ngOnInit(): void {
    this.loadStatistics();
  }

  private loadStatistics(): void {
    this.studentService.getStudents(1, 1).subscribe({
      next: (res) => {
        this.setStat(0, res.totalStudents || 0);
      },
      error: (err) => {
        console.error('Student error:', err);
        this.setStat(0, 0);
      }
    });

    this.facultyService.getFaculties(1, 1).subscribe({
      next: (res) => {
        this.setStat(1, res.totalFaculty || 0);
      },
      error: (err) => {
        console.error('Faculty error:', err);
        this.setStat(1, 0);
      }
    });

    this.subjectService.getSubjects(1, 1).subscribe({
      next: (res) => {
        this.setStat(2, res.totalSubjects || 0);
      },
      error: (err) => {
        console.error('Subject error:', err);
        this.setStat(2, 0);
      }
    });

    this.attendanceService.getAttendance(1, 1).subscribe({
      next: (res) => {
        this.setStat(3, res.totalAttendance || 0);
      },
      error: (err) => {
        console.error('Attendance error:', err);
        this.setStat(3, 0);
      }
    });

    this.marksService.getAllMarks(1, 1).subscribe({
      next: (res) => {
        this.setStat(4, res.total || 0);
      },
      error: (err) => {
        console.error('Marks error:', err);
        this.setStat(4, 0);
      }
    });
  }

  private setStat(index: number, value: number): void {
    this.stats[index].value = value;
    this.stats[index].loading = false;
    this.cdr.markForCheck();
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }
}
