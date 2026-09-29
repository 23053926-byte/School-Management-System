const fs = require('fs');
const path = 'd:/7th semester/SchoolmanagementSantoshAdmin/School Management System - portal/frontend/src/app/components/attendance/attendance.ts';

const content = `
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
console.log('Part 3 written');
