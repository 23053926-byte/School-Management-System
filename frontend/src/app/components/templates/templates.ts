import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplateService, Template } from '../../services/template.service';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './templates.html',
  styleUrl: './templates.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplatesComponent implements OnInit {
  private templateService = inject(TemplateService);
  private cdr = inject(ChangeDetectorRef);

  templates: Template[] = [];
  filteredType: 'report' | 'admit' | '' = '';
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
  deleteTarget: Template | null = null;
  deleting = false;

  showPreview = false;
  previewTemplate: Template | null = null;

  form: Template = {
    name: '',
    type: 'report',
    description: '',
    fields: [],
    customization: {
      schoolName: 'Sunrise Public School',
      examName: 'First Terminal Examination 2025-26',
      accentColor: '#4f46e5',
      showLogo: true,
      showPhoto: true,
      showGrade: true,
      showAttendance: true
    },
    layout: {
      headerHeight: 100,
      footerHeight: 80,
      backgroundColor: '#ffffff',
      fontSize: 12
    },
    isDefault: false
  };

  templateTypes = [
    { value: 'report', label: '📄 Report Card' },
    { value: 'admit', label: '🎫 Admit Card' }
  ];

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.templateService
      .getAllTemplates(this.currentPage, this.itemsPerPage, this.filteredType || undefined)
      .subscribe({
        next: (res) => {
          this.templates = res.templates || [];
          this.total = res.total || 0;
          this.totalPages = res.pages || 1;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.templates = [];
          this.total = 0;
          this.totalPages = 1;
          this.loading = false;
          this.errorMessage = 'Unable to load templates.';
          this.cdr.markForCheck();
          console.error('[Templates] Load error:', err);
        }
      });
  }

  filterByType(type: 'report' | 'admit' | ''): void {
    this.filteredType = type;
    this.currentPage = 1;
    this.loadTemplates();
  }

  openAdd(): void {
    this.resetForm();
    this.editingId = null;
    this.showModal = true;
  }

  openEdit(template: Template): void {
    this.editingId = template._id || null;
    this.form = { ...template };
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.saving) this.showModal = false;
  }

  resetForm(): void {
    this.form = {
      name: '',
      type: 'report',
      description: '',
      fields: [],
      customization: {
        schoolName: 'Sunrise Public School',
        examName: 'First Terminal Examination 2025-26',
        accentColor: '#4f46e5',
        showLogo: true,
        showPhoto: true,
        showGrade: true,
        showAttendance: true
      },
      layout: {
        headerHeight: 100,
        footerHeight: 80,
        backgroundColor: '#ffffff',
        fontSize: 12
      },
      isDefault: false
    };
    this.formError = '';
  }

  save(): void {
    this.formError = '';
    if (!this.form.name || !this.form.type) {
      this.formError = 'Template name and type are required.';
      return;
    }

    this.saving = true;
    const request = this.editingId
      ? this.templateService.updateTemplate(this.editingId, this.form)
      : this.templateService.createTemplate(this.form);

    request.subscribe({
      next: (res) => {
        this.saving = false;
        this.showModal = false;
        this.successMessage = res?.message || (this.editingId ? 'Template updated.' : 'Template created.');
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadTemplates();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || 'Unable to save template.';
        this.cdr.markForCheck();
      }
    });
  }

  confirmDelete(template: Template): void {
    this.deleteTarget = template;
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

    this.templateService.deleteTemplate(id).subscribe({
      next: (res) => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.deleteTarget = null;
        this.successMessage = res?.message || 'Template deleted.';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadTemplates();
      },
      error: (err) => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.deleteTarget = null;
        this.errorMessage = err?.error?.message || 'Unable to delete template.';
        setTimeout(() => (this.errorMessage = ''), 3000);
        this.cdr.markForCheck();
      }
    });
  }

  duplicate(template: Template): void {
    if (!template._id) return;
    this.loading = true;

    this.templateService.duplicateTemplate(template._id).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res?.message || 'Template duplicated.';
        setTimeout(() => (this.successMessage = ''), 3000);
        this.loadTemplates();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Unable to duplicate template.';
        setTimeout(() => (this.errorMessage = ''), 3000);
        this.cdr.markForCheck();
      }
    });
  }

  openPreview(template: Template): void {
    this.previewTemplate = template;
    this.showPreview = true;
  }

  closePreview(): void {
    this.showPreview = false;
    this.previewTemplate = null;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTemplates();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTemplates();
    }
  }
}
