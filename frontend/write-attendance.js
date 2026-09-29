const fs = require('fs');
const content = import { Component, OnInit, inject } from '@angular/core';
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
  form = { student: '', subject: '', faculty: '', date: '', status: 'Present', remarks: '' };

  ngOnInit(): void { this.loadAttendance(); this.loadLookups(); }

  loadAttendance(): void {
    this.loading = true;
    this.errorMessage = '';
    let filters = {};
    if (this.selectedStatus) filters['status'] = this.selectedStatus;
    this.attendanceService.getAttendance(this.currentPage, this.itemsPerPage, filters).subscribe({
      next: (res) => {
        this.records = res.attendance || [];
        this.total = res.totalAttendance || 0;
        this.totalPages = res.totalPages || 1;
        this.loading = false;
      },
      error: (err) => {
        this.records = []; this.total = 0; this.totalPages = 1; this.loading = false;
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

  applyFilters(): void { this.currentPage = 1; this.loadAttendance(); }
  clearFilters(): void { this.selectedStatus = ''; this.currentPage = 1; this.loadAttendance(); }

  statusBadge(status: string): string {
    if (status === 'Present') return 'badge-success';
    if (status === 'Absent') return 'badge-danger';
    if (status === 'Late') return 'badge-warning';
    return 'badge-neutral';
  }

  startBulkMode(): void {
    this.showBulkMode = true;
    this.bulkSubject = '';
    this.bulkDate = new Date().toISOString().substring(0, 10);
    this.bulkFaculty = this.faculties.length > 0 ? (this.faculties[0]._id || '') : '';
    this.bulkStudents = [];
  }

  exitBulkMode(): void { this.showBulkMode = false; this.bulkStudents = []; }

  loadBulkStudents(): void {
    if (!this.bulkSubject) { this.bulkStudents = []; return; }
    this.bulkLoading = true;
    const subject = this.subjects.find((s) => s._id === this.bulkSubject);
    if (!subject) { this.bulkStudents = []; this.bulkLoading = false; return; }
    const matching = this.students.filter((s) => s.department === subject.department && String(s.semester) === String(subject.semester));
    this.bulkStudents = matching.map((s) => ({ studentId: s._id || '', studentName: s.name, studentCode: s.studentId, status: '' }));
    this.bulkLoading = false;
  }

  setStatus(studentId, status): void {
    const s = this.bulkStudents.find((x) => x.studentId === studentId);
    if (s) s.status = status;
  }

  setAllStatus(status): void { this.bulkStudents.forEach((s) => (s.status = status)); }

  saveBulkAttendance(): void {
    const toSave = this.bulkStudents.filter((s) => s.status !== '');
    if (toSave.length === 0) { this.bulkError = 'Please select a status for at least one student.'; return; }
    this.bulkSaving = true; this.bulkError = ''; this.bulkSuccess = '';
    let completed = 0, failed = 0;
    const total = toSave.length;
    toSave.forEach((s) => {
      this.attendanceService.markAttendance({ student: s.studentId, subject: this.bulkSubject, faculty: this.bulkFaculty, date: this.bulkDate, status: s.status }).subscribe({
        next: () => { completed++; if (completed + failed === total) { this.bulkSaving = false; this.bulkSuccess = 'Saved for ' + completed + ' student(s).'; setTimeout(() => (this.bulkSuccess = ''), 3000); this.exitBulkMode(); this.loadAttendance(); } },
        error: (err) => { failed++; console.error('[Attendance] Bulk error:', err); if (completed + failed === total) { this.bulkSaving = false; this.bulkError = 'Saved ' + completed + ', failed ' + failed; setTimeout(() => (this.bulkError = ''), 4000); this.exitBulkMode(); this.loadAttendance(); } }
      });
    });
  }

  openMark(): void {
    this.form = { student: '', subject: '', faculty: '', date: new Date().toISOString().substring(0, 10), status: 'Present', remarks: '' };
    this.formError = ''; this.showModal = true;
  }

  closeModal(): void { if (!this.saving) this.showModal = false; }

  save(): void {
    this.formError = '';
    if (!this.form.student || !this.form.subject || !this.form.faculty || !this.form.date) { this.formError = 'Please select student, subject, faculty and date.'; return; }
    this.saving = true;
    this.attendanceService.markAttendance(this.form).subscribe({
      next: (res) => { this.saving = false; this.showModal = false; this.successMessage = res?.message || 'Attendance marked.'; setTimeout(() => (this.successMessage = ''), 3000); this.loadAttendance(); },
      error: (err) => { this.saving = false; this.formError = err?.error?.message || 'Unable to mark attendance.'; }
    });
  }

  deleteRecord(id): void {
    if (!id) return;
    this.attendanceService.deleteAttendance(id).subscribe({
      next: (res) => { this.successMessage = res?.message || 'Deleted.'; setTimeout(() => (this.successMessage = ''), 3000); this.loadAttendance(); },
      error: (err) => { this.errorMessage = err?.error?.message || 'Unable to delete.'; setTimeout(() => (this.errorMessage = ''), 3000); }
    });
  }

  previousPage(): void { if (this.currentPage > 1) { this.currentPage--; this.loadAttendance(); } }
  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; this.loadAttendance(); } }
}
;
fs.writeFileSync('d:/7th semester/SchoolmanagementSantoshAdmin/School Management System - portal/frontend/src/app/components/attendance/attendance.ts', content);
console.log('OK');
