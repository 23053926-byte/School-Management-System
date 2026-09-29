import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { StudentService } from '../../services/student.service';
import { LookupService } from '../../services/lookup.service';
import { Student } from '../../models/student';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './students.html',
  styleUrl: './students.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private studentService = inject(StudentService);
  private lookup = inject(LookupService);
  private router = inject(Router);
  private authService = inject(AuthService);

  students: any[] = [];
  searchText = '';
  selectedDepartment = '';
  selectedSemester = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalStudents = 0;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showDeleteModal = false;
  deleteTarget: any = null;
  deleting = false;
  role = '';
  csvUploading = false;
  csvError = '';
  csvSuccess = '';
  selectedFile: File | null = null;
  departments = ['CSE', 'ECE', 'EEE', 'ME', 'CE'];
  semesters = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Sem_NUR', 'LKG', 'UKG'];

  ngOnInit(): void {
    this.role = this.authService.getRole() ?? '';
    this.loadStudents();
  }

  // ================= CSV / Excel Upload =================
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    if (!this.selectedFile) this.csvError = 'No file selected.';
  }

  uploadCsv(): void {
    if (!this.selectedFile) {
      this.csvError = 'Please select a CSV file first.';
      return;
    }
    this.csvUploading = true;
    this.csvError = '';
    this.csvSuccess = '';

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = this.parseCsv(String(reader.result || ''));
        if (rows.length === 0) {
          this.csvUploading = false;
          this.csvError = 'No valid rows found. Check the template for required columns (studentId, name).';
          return;
        }
        this.studentService.bulkCreate(rows).subscribe({
          next: (res: any) => {
            this.csvUploading = false;
            this.csvSuccess = res?.message || `Imported ${rows.length} students.`;
            setTimeout(() => (this.csvSuccess = ''), 5000);
            this.selectedFile = null;
            this.lookup.refreshStudents();
            this.loadStudents();
          },
          error: (err) => {
            this.csvUploading = false;
            this.csvError = err?.error?.message || 'Failed to import students.';
            setTimeout(() => (this.csvError = ''), 5000);
            console.error('[Students] CSV upload error:', err);
          }
        });
      } catch (e) {
        this.csvUploading = false;
        this.csvError = 'Unable to parse the file. Please use the provided template.';
        console.error('[Students] CSV parse error:', e);
      }
    };
    reader.onerror = () => {
      this.csvUploading = false;
      this.csvError = 'Unable to read the selected file.';
    };
    reader.readAsText(this.selectedFile);
  }

  /** Minimal CSV parser supporting quoted values. */
  parseCsv(text: string): any[] {
    const lines: string[][] = [];
    let cur: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += ch;
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        cur.push(field); field = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        cur.push(field); field = '';
        if (cur.some((c) => c.trim() !== '')) lines.push(cur);
        cur = [];
      } else field += ch;
    }
    if (field !== '' || cur.length) { cur.push(field); if (cur.some((c) => c.trim() !== '')) lines.push(cur); }

    if (lines.length < 2) return [];
    const headers = lines[0].map((h) => h.trim());
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row: any = {};
      headers.forEach((h, idx) => (row[h] = (lines[i][idx] ?? '').trim()));
      if (!row.studentId || !row.name) continue;
      rows.push({
        studentId: row.studentId,
        name: row.name,
        email: row.email || `${row.studentId.toLowerCase()}@school.edu`,
        phone: row.phone || '',
        dateOfBirth: row.dateOfBirth || undefined,
        gender: row.gender || undefined,
        address: row.address || '',
        department: row.department || 'CSE',
        course: row.course || 'B.Tech',
        semester: row.semester || '1',
        admissionYear: row.admissionYear ? Number(row.admissionYear) : new Date().getFullYear()
      });
    }
    return rows;
  }

  downloadCsvTemplate(): void {
    const csv = 'studentId,name,email,phone,dateOfBirth,gender,address,department,course,semester,admissionYear\n'
      + 'STU001,John Doe,john@school.edu,1234567890,2005-01-01,Male,"123 Main St",CSE,B.Tech CSE,1,2023\n'
      + 'STU002,Jane Smith,jane@school.edu,1234567891,2006-02-02,Female,"456 Park Ave",ECE,B.Tech ECE,3,2022';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }

  goToAddStudent(): void {
    this.router.navigate(['/app/students/new']);
  }

  editStudent(student: Student): void {
    if (!student._id) return;
    this.router.navigate(['/app/students/edit', student._id]);
  }

  confirmDelete(student: Student): void {
    this.deleteTarget = student;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  deleteStudent(): void {
    if (!this.deleteTarget?._id) return;
    const id = this.deleteTarget._id;
    this.deleting = true;
    this.studentService.deleteStudent(id).subscribe({
      next: (res) => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.deleteTarget = null;
        this.successMessage = res?.message || 'Student deleted successfully.';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.lookup.refreshStudents();
        this.loadStudents();
      },
      error: (err) => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.deleteTarget = null;
        this.errorMessage = err?.error?.message || 'Unable to delete student.';
        setTimeout(() => (this.errorMessage = ''), 3000);
      }
    });
  }

  loadStudents(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.studentService
      .getStudents(this.currentPage, this.itemsPerPage, this.searchText, this.selectedDepartment, this.selectedSemester)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.students = response.students || [];
          this.totalStudents = response.totalStudents || 0;
          this.totalPages = response.totalPages || 1;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading students:', error);
          this.students = [];
          this.totalStudents = 0;
          this.totalPages = 1;
          this.errorMessage = 'Unable to load students. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadStudents();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadStudents();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedDepartment = '';
    this.selectedSemester = '';
    this.currentPage = 1;
    this.loadStudents();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadStudents();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadStudents();
    }
  }
}
