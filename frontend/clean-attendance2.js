const fs = require('fs');
const path = 'd:/7th semester/SchoolmanagementSantoshAdmin/School Management System - portal/frontend/src/app/components/attendance/attendance.ts';

const content = `
  // ===================== BULK ATTENDANCE =====================
  startBulkMode(): void {
    this.showBulkMode = true;
    this.bulkSubject = '';
    this.bulkDate = new Date().toISOString().substring(0, 10);
    this.bulkFaculty = this.faculties.length > 0 ? (this.faculties[0]._id || '') : '';
    this.bulkStudents = [];
  }

  exitBulkMode(): void {
    this.showBulkMode = false;
    this.bulkStudents = [];
  }

  loadBulkStudents(): void {
    if (!this.bulkSubject) {
      this.bulkStudents = [];
      return;
    }
    this.bulkLoading = true;
    const subject = this.subjects.find((s) => s._id === this.bulkSubject);
    if (!subject) {
      this.bulkStudents = [];
      this.bulkLoading = false;
      return;
    }
    const dept = subject.department;
    const sem = subject.semester;
    const matchingStudents = this.students.filter(
      (s) => s.department === dept && String(s.semester) === String(sem)
    );
    this.bulkStudents = matchingStudents.map((s) => ({
      studentId: s._id || '',
      studentName: s.name,
      studentCode: s.studentId,
      status: ''
    }));
    this.bulkLoading = false;
    console.log('[Attendance] Bulk students loaded:', this.bulkStudents.length);
  }

  setStatus(studentId: string, status: string): void {
    const s = this.bulkStudents.find((x) => x.studentId === studentId);
    if (s) s.status = status as any;
  }

  setAllStatus(status: string): void {
    this.bulkStudents.forEach((s) => (s.status = status as any));
  }

  saveBulkAttendance(): void {
    const toSave = this.bulkStudents.filter((s) => s.status !== '');
    if (toSave.length === 0) {
      this.bulkError = 'Please select a status for at least one student.';
      return;
    }
    this.bulkSaving = true;
    this.bulkError = '';
    this.bulkSuccess = '';
    let completed = 0;
    let failed = 0;
    const total = toSave.length;
    toSave.forEach((s) => {
      this.attendanceService.markAttendance({
        student: s.studentId,
        subject: this.bulkSubject,
        faculty: this.bulkFaculty,
        date: this.bulkDate,
        status: s.status
      }).subscribe({
        next: () => {
          completed++;
          if (completed + failed === total) {
            this.bulkSaving = false;
            this.bulkSuccess = 'Attendance saved for ' + completed + ' student(s).' + (failed > 0 ? ' ' + failed + ' failed.' : '');
            setTimeout(() => (this.bulkSuccess = ''), 3000);
            this.exitBulkMode();
            this.loadAttendance();
          }
        },
        error: (err) => {
          failed++;
          console.error('[Attendance] Bulk save error for', s.studentName, err);
          if (completed + failed === total) {
            this.bulkSaving = false;
            this.bulkError = 'Saved ' + completed + ' student(s). ' + failed + ' failed.';
            setTimeout(() => (this.bulkError = ''), 4000);
            this.exitBulkMode();
            this.loadAttendance();
          }
        }
      });
    });
  }

  // ===================== SINGLE RECORD =====================
  openMark(): void {
    this.form = { student: '', subject: '', faculty: '', date: new Date().toISOString().substring(0, 10), status: 'Present', remarks: '' };
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.saving) this.showModal = false;
  }

  save(): void {
    this.formError = '';
    if (!this.form.student || !this.form.subject || !this.form.faculty || !this.form.date) {
      this.formError = 'Please select student, subject, faculty and date.';
      return;
    }
    this.saving = true;
    this.attendanceService.markAttendance(this.form).subscribe({
      next: (res) => {
        this.saving = false;
        this.showModal = false;
        this.successMessage = res?.message || 'Attendance marked successfully.';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadAttendance();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || 'Unable to mark attendance.';
      }
    });
  }

  deleteRecord(id: string | undefined): void {
    if (!id) return;
    this.attendanceService.deleteAttendance(id).subscribe({
      next: (res) => {
        this.successMessage = res?.message || 'Attendance record deleted.';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadAttendance();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Unable to delete the record.';
        setTimeout(() => (this.errorMessage = ''), 3000);
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.loadAttendance(); }
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.loadAttendance(); }
  }
}
`;

fs.writeFileSync(path, content, 'utf8');
console.log('Part 2 written');
