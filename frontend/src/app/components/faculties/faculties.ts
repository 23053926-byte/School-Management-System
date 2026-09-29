import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FacultyService } from '../../services/faculty.service';
import { LookupService } from '../../services/lookup.service';
import { Faculty } from '../../models/faculty';

@Component({
  selector: 'app-faculties',
  imports: [FormsModule],
  templateUrl: './faculties.html',
  styleUrl: './faculties.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FacultiesComponent implements OnInit {
  private facultyService = inject(FacultyService);
  private lookup = inject(LookupService);
  private cdr = inject(ChangeDetectorRef);

  faculties: Faculty[] = [];

  searchText = '';
  selectedDepartment = '';
  selectedDesignation = '';

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  total = 0;

  loading = false;
  errorMessage = '';
  successMessage = '';

  // Modal state
  showModal = false;
  editingId: string | null = null;
  saving = false;
  formError = '';

  showDeleteModal = false;
  deleteTarget: Faculty | null = null;
  deleting = false;

  departments = ['CSE', 'ECE', 'EEE', 'ME', 'CE'];
  designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Instructor'];

  form = {
    facultyId: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    department: '',
    designation: '',
    qualification: '',
    experience: '',
    joiningDate: '',
    address: ''
  };

  ngOnInit(): void {
    this.loadFaculties();
  }

  loadFaculties(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.facultyService
      .getFaculties(this.currentPage, this.itemsPerPage, this.searchText, this.selectedDepartment, this.selectedDesignation)
      .subscribe({
        next: (res) => {
          this.faculties = res.faculties || [];
          this.total = res.totalFaculty || 0;
          this.totalPages = res.totalPages || 1;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.faculties = [];
          this.total = 0;
          this.totalPages = 1;
          this.loading = false;
          this.errorMessage = 'Unable to load faculty records.';
          this.cdr.markForCheck();
        }
      });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadFaculties();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedDepartment = '';
    this.selectedDesignation = '';
    this.currentPage = 1;
    this.loadFaculties();
  }

  resetForm(): void {
    this.form = {
      facultyId: '',
      name: '',
      email: '',
      phone: '',
      gender: '',
      department: '',
      designation: '',
      qualification: '',
      experience: '',
      joiningDate: '',
      address: ''
    };
    this.editingId = null;
    this.formError = '';
  }

  openAdd(): void {
    this.resetForm();
    this.showModal = true;
  }

  openEdit(f: Faculty): void {
    this.resetForm();
    this.editingId = f._id ?? null;
    this.form = {
      facultyId: f.facultyId || '',
      name: f.name || '',
      email: f.email || '',
      phone: f.phone || '',
      gender: f.gender || '',
      department: f.department || '',
      designation: f.designation || '',
      qualification: f.qualification || '',
      experience: f.experience ? String(f.experience) : '',
      joiningDate: f.joiningDate ? String(f.joiningDate).substring(0, 10) : '',
      address: f.address || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.saving) this.showModal = false;
  }

  save(): void {
    this.formError = '';
    if (!this.form.facultyId || !this.form.name || !this.form.email || !this.form.phone || !this.form.department || !this.form.designation || !this.form.qualification) {
      this.formError = 'Please fill in all required fields.';
      return;
    }

    this.saving = true;
    const payload = { ...this.form, experience: this.form.experience ? Number(this.form.experience) : undefined };

    const request = this.editingId
      ? this.facultyService.updateFaculty(this.editingId, payload)
      : this.facultyService.addFaculty(payload);

    request.subscribe({
      next: (res) => {
        this.saving = false;
        this.showModal = false;
        this.successMessage = res?.message || (this.editingId ? 'Faculty updated.' : 'Faculty added.');
        setTimeout(() => (this.successMessage = ''), 3000);
        this.lookup.refreshFaculties();
        this.lookup.refreshSubjects();
        this.loadFaculties();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || 'Unable to save faculty record.';
      }
    });
  }

  confirmDelete(f: Faculty): void {
    this.deleteTarget = f;
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
    this.facultyService.deleteFaculty(id).subscribe({
      next: (res) => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.deleteTarget = null;
        this.successMessage = res?.message || 'Faculty deleted.';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.lookup.refreshFaculties();
        this.lookup.refreshSubjects();
        this.loadFaculties();
      },
      error: (err) => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.deleteTarget = null;
        this.errorMessage = err?.error?.message || 'Unable to delete faculty.';
        setTimeout(() => (this.errorMessage = ''), 3000);
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.loadFaculties(); }
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.loadFaculties(); }
  }
}