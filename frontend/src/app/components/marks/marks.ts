import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MarksService } from '../../services/marks.service';
import { LookupService } from '../../services/lookup.service';
import { Student } from '../../models/student';
import { Subject } from '../../models/subject';
import { Faculty } from '../../models/faculty';

@Component({
  selector: 'app-marks',
  imports: [FormsModule],
  templateUrl: './marks.html',
  styleUrl: './marks.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarksComponent implements OnInit {
  private marksService = inject(MarksService);
  private lookup = inject(LookupService);
  private cdr = inject(ChangeDetectorRef);

  rows: any[] = [];
  students: Student[] = [];
  subjects: Subject[] = [];
  faculties: Faculty[] = [];

  selectedResult = '';

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  total = 0;

  loading = false;
  errorMessage = '';
  successMessage = '';

  showModal = false;
  editingId: string | null = null;
  saving = false;
  formError = '';
  form = {
    student: '',
    subject: '',
    faculty: '',
    internalMarks: '',
    externalMarks: '',
    remarks: ''
  };

  ngOnInit(): void {
    this.loadMarks();
    this.loadLookups();
  }

     loadMarks(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    let filters: Record<string, string> = {};
    if (this.selectedResult) filters['result'] = this.selectedResult;
    this.marksService.getAllMarks(this.currentPage, this.itemsPerPage, filters).subscribe({
      next: (res) => {
        this.rows = res.data || [];
        this.total = res.total || 0;
        this.totalPages = res.pages || 1;
        this.loading = false;
        this.cdr.markForCheck();
        console.log('[Marks] Loaded', this.rows.length, 'records, total:', this.total);
      },
      error: (err) => {
        this.rows = [];
        this.total = 0;
        this.totalPages = 1;
        this.loading = false;
        this.errorMessage = 'Unable to load marks.';
        this.cdr.markForCheck();
        console.error('[Marks] Load error:', err);
      }
    });
  }

  loadLookups(): void {
    this.lookup.getStudents().subscribe((s) => (this.students = s));
    this.lookup.getSubjects().subscribe((s) => (this.subjects = s));
    this.lookup.getFaculties().subscribe((s) => (this.faculties = s));
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadMarks();
  }

  clearFilters(): void {
    this.selectedResult = '';
    this.currentPage = 1;
    this.loadMarks();
  }

  gradeBadge(grade: string): string {
    if (grade === 'F') return 'badge-danger';
    if (['O', 'A+'].includes(grade)) return 'badge-success';
    return 'badge-brand';
  }

  resultBadge(result: string): string {
    return result === 'Pass' ? 'badge-success' : 'badge-danger';
  }

  openAdd(): void {
    this.form = { student: '', subject: '', faculty: '', internalMarks: '', externalMarks: '', remarks: '' };
    this.editingId = null;
    this.formError = '';
    this.showModal = true;
  }

  openEdit(m: any): void {
    this.openAdd();
    this.editingId = m._id ?? null;
    this.form = {
      student: m.student?._id ?? '',
      subject: m.subject?._id ?? '',
      faculty: m.faculty?._id ?? '',
      internalMarks: m.internalMarks != null ? String(m.internalMarks) : '',
      externalMarks: m.externalMarks != null ? String(m.externalMarks) : '',
      remarks: m.remarks || ''
    };
  }

  closeModal(): void {
    if (!this.saving) this.showModal = false;
  }

  totalOf(m: any): number {
    return (Number(m.internalMarks) || 0) + (Number(m.externalMarks) || 0);
  }

  save(): void {
    this.formError = '';
    if (!this.form.student || !this.form.subject || !this.form.faculty || this.form.internalMarks === '' || this.form.externalMarks === '') {
      this.formError = 'Please fill student, subject, faculty and marks.';
      return;
    }
    const payload = {
      student: this.form.student,
      subject: this.form.subject,
      faculty: this.form.faculty,
      internalMarks: Number(this.form.internalMarks),
      externalMarks: Number(this.form.externalMarks),
      remarks: this.form.remarks
    };
    this.saving = true;
    const request = this.editingId
      ? this.marksService.updateMarks(this.editingId, payload)
      : this.marksService.createMarks(payload);
    request.subscribe({
      next: (res) => {
        this.saving = false;
        this.showModal = false;
        this.successMessage = res?.message || (this.editingId ? 'Marks updated.' : 'Marks recorded.');
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadMarks();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || 'Unable to save marks.';
      }
    });
  }

  deleteRow(m: any): void {
    if (!m?._id) return;
    this.marksService.deleteMarks(m._id).subscribe({
      next: (res) => {
        this.successMessage = res?.message || 'Marks entry deleted.';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadMarks();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Unable to delete marks.';
        setTimeout(() => (this.errorMessage = ''), 3000);
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.loadMarks(); }
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.loadMarks(); }
  }
}