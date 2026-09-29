import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubjectService } from '../../services/subject.service';
import { LookupService } from '../../services/lookup.service';
import { Subject } from '../../models/subject';
import { Faculty } from '../../models/faculty';

@Component({
  selector: 'app-subjects',
  imports: [FormsModule],
  templateUrl: './subjects.html',
  styleUrl: './subjects.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubjectsComponent implements OnInit {
  private subjectService = inject(SubjectService);
  private lookup = inject(LookupService);
  private cdr = inject(ChangeDetectorRef);

  subjects: Subject[] = [];
  faculties: Faculty[] = [];

  searchText = '';
  selectedDepartment = '';
  selectedSemester = '';

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

  showDeleteModal = false;
  deleteTarget: Subject | null = null;
  deleting = false;

    departments = ['CSE', 'ECE', 'EEE', 'ME', 'CE'];
  semesters = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Sem_NUR', 'LKG', 'UKG'];

  form = {
    subjectId: '',
    subjectCode: '',
    subjectName: '',
    department: '',
    course: '',
    semester: '',
    credits: '',
    faculty: '',
    description: ''
  };

  ngOnInit(): void {
    this.loadSubjects();
    this.loadFaculties();
  }

  loadSubjects(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.subjectService
      .getSubjects(this.currentPage, this.itemsPerPage, this.searchText, this.selectedDepartment, this.selectedSemester)
      .subscribe({
        next: (res) => {
          this.subjects = res.subjects || [];
          this.total = res.totalSubjects || 0;
          this.totalPages = res.totalPages || 1;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.subjects = [];
          this.total = 0;
          this.totalPages = 1;
          this.loading = false;
          this.errorMessage = 'Unable to load subjects.';
          this.cdr.markForCheck();
        }
      });
  }

  loadFaculties(): void {
    this.lookup.getFaculties().subscribe((f) => (this.faculties = f));
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadSubjects();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedDepartment = '';
    this.selectedSemester = '';
    this.currentPage = 1;
    this.loadSubjects();
  }
resetForm(): void {
    this.form = {
      subjectId: '',
      subjectCode: '',
      subjectName: '',
      department: '',
      course: '',
      semester: '',
      credits: '',
      faculty: '',
      description: ''
    };
    this.editingId = null;
    this.formError = '';
  }

  openAdd(): void {
    this.resetForm();
    this.showModal = true;
  }

  openEdit(s: Subject): void {
    this.resetForm();
    this.editingId = s._id ?? null;
    this.form = {
      subjectId: s.subjectId || '',
      subjectCode: s.subjectCode || '',
      subjectName: s.subjectName || '',
      department: s.department || '',
      course: s.course || '',
      semester: s.semester ? String(s.semester) : '',
      credits: s.credits ? String(s.credits) : '',
      faculty: typeof s.faculty === 'object' && s.faculty ? (s.faculty as any)._id : (s.faculty as string) || '',
      description: s.description || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.saving) this.showModal = false;
  }

  facultyName(s: Subject): string {
    if (s.faculty && typeof s.faculty === 'object') {
      return (s.faculty as any).name;
    }
    return '—';
  }

  save(): void {
    this.formError = '';
    if (!this.form.subjectId || !this.form.subjectCode || !this.form.subjectName || !this.form.department || !this.form.course || !this.form.semester || !this.form.credits) {
      this.formError = 'Please fill in all required fields.';
      return;
    }

    this.saving = true;
    const payload: any = {
      subjectId: this.form.subjectId,
      subjectCode: this.form.subjectCode,
      subjectName: this.form.subjectName,
      department: this.form.department,
      course: this.form.course,
      semester: Number(this.form.semester),
      credits: Number(this.form.credits),
      faculty: this.form.faculty || null,
      description: this.form.description
    };

    const request = this.editingId
      ? this.subjectService.updateSubject(this.editingId, payload)
      : this.subjectService.addSubject(payload);

    request.subscribe({
      next: (res) => {
        this.saving = false;
        this.showModal = false;
        this.successMessage = res?.message || (this.editingId ? 'Subject updated.' : 'Subject added.');
        setTimeout(() => (this.successMessage = ''), 3000);
        this.lookup.refreshSubjects();
        this.loadSubjects();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || 'Unable to save subject.';
      }
    });
  }

  confirmDelete(s: Subject): void {
    this.deleteTarget = s;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  delete(): void {
    if (!this.deleteTarget?._id) return;
    const id = this.deleteTarget._id;
    this.deleting = true;
    this.subjectService.deleteSubject(id).subscribe({
      next: (res) => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.deleteTarget = null;
        this.successMessage = res?.message || 'Subject deleted.';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.lookup.refreshSubjects();
        this.loadSubjects();
      },
      error: (err) => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.deleteTarget = null;
        this.errorMessage = err?.error?.message || 'Unable to delete subject.';
        setTimeout(() => (this.errorMessage = ''), 3000);
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.loadSubjects(); }
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.loadSubjects(); }
  }
}