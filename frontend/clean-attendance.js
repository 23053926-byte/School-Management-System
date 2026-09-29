const fs = require('fs');
const path = 'd:/7th semester/SchoolmanagementSantoshAdmin/School Management System - portal/frontend/src/app/components/attendance/attendance.ts';

const content = `import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AttendanceService } from '../../services/attendance.service';
import { LookupService } from '../../services/lookup.service';
import { Student } from '../../models/student';
import { Subject } from '../../models/subject';
import { Faculty } from '../../models/faculty';

export interface BulkStudentStatus {
  studentId: string;
  studentName: string;
  studentCode: string;
  status: 'Present' | 'Absent' | 'Late' | '';
}

@Component({
  selector: 'app-attendance',
  imports: [FormsModule, DatePipe],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css'
})
export class AttendanceComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private lookup = inject(LookupService);

  records: any[] = [];
  selectedStatus = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  total = 0;
  loading = false;
  errorMessage = '';
  successMessage = '';

  students: Student[] = [];
  subjects: Subject[] = [];
  faculties: Faculty[] = [];

  showBulkMode = false;
  bulkSubject = '';
  bulkDate = new Date().toISOString().substring(0, 10);
  bulkFaculty = '';
  bulkStudents: BulkStudentStatus[] = [];
  bulkLoading = false;
  bulkSaving = false;
  bulkError = '';
  bulkSuccess = '';

  showModal = false;
  saving = false;
  formError = '';
  form = {
    student: '',
    subject: '',
    faculty: '',
    date: '',
    status: 'Present',
    remarks: ''
  };

  ngOnInit(): void {
    this.loadAttendance();
    this.loadLookups();
  }

  loadAttendance(): void {
    this.loading = true;
    this.errorMessage = '';
    let filters: Record<string, string> = {};
    if (this.selectedStatus) filters['status'] = this.selectedStatus;
    this.attendanceService.getAttendance(this.currentPage, this.itemsPerPage, filters).subscribe({
      next: (res) => {
        this.records = res.attendance || [];
        this.total = res.totalAttendance || 0;
        this.totalPages = res.totalPages || 1;
        this.loading = false;
      },
      error: (err) => {
        this.records = [];
        this.total = 0;
        this.totalPages = 1;
        this.loading = false;
        this.errorMessage = 'Unable to load attendance.';
        console.error('[Attendance] Load error:', err);
      }
    });
  }

  loadLookups(): void {
    this.lookup.getStudents().subscribe((s) => (this.students = s));
    this.lookup.getSubjects().subscribe((s) => (this.subjects = s));
    this.lookup.getFaculties().subscribe((f) => (this.faculties = f));
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadAttendance();
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadAttendance();
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'Present': return 'badge-success';
      case 'Absent': return 'badge-danger';
      case 'Late': return 'badge-warning';
      default: return 'badge-neutral';
    }
  }
`;

fs.writeFileSync(path, content, 'utf8');
console.log('Part 1 written');
