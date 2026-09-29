import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResultService } from '../../services/result.service';
import { LookupService } from '../../services/lookup.service';
import { TemplateService } from '../../services/template.service';
import { Student } from '../../models/student';

type DocMode = 'report' | 'admit';
type TemplateId = 'classic' | 'modern' | 'elegant' | 'formal' | 'compact' | 'badge' | string;

interface TemplateInfo {
  id: TemplateId;
  name: string;
  icon: string;
  desc: string;
  mode: DocMode;
  _id?: string;
  customization?: any;
  layout?: any;
}

@Component({
  selector: 'app-reports',
  imports: [FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
  private lookup = inject(LookupService);
  private resultService = inject(ResultService);
  private templateService = inject(TemplateService);
  private cdr = inject(ChangeDetectorRef);

  // ---- Mode & templates ----
  mode: DocMode = 'report';
  selectedTemplate: TemplateId = 'classic';
  useCustomTemplate = false;

  templates: TemplateInfo[] = [
    { id: 'classic', name: 'Classic', icon: '🏛️', desc: 'Traditional bordered layout', mode: 'report' },
    { id: 'modern', name: 'Modern', icon: '📊', desc: 'Progress bars and stat chips', mode: 'report' },
    { id: 'elegant', name: 'Elegant', icon: '✨', desc: 'Clean minimal serif design', mode: 'report' },
    { id: 'formal', name: 'Formal', icon: '🎓', desc: 'Official exam header style', mode: 'admit' },
    { id: 'compact', name: 'Compact', icon: '🎫', desc: 'Small ticket-style card', mode: 'admit' },
    { id: 'badge', name: 'Badge', icon: '🪪', desc: 'ID-card style with photo box', mode: 'admit' }
  ];

  customTemplates: TemplateInfo[] = [];
  loadingTemplates = false;

  // ---- Data ----
  students: Student[] = [];
  selectedStudent = '';
  selectedSemester = '';
  loading = false;
  resultData: any = null;
  summary: any = null;
  subjects: any[] = [];
  errorMessage = '';

  semesters = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Sem_NUR', 'LKG', 'UKG'];

  // ---- Customization ----
  customization = {
    schoolName: 'Sunrise Public School',
    schoolAddress: 'Affiliated to State Board of Education',
    examName: 'First Terminal Examination 2025-26',
    showLogo: true,
    showPhoto: true,
    showGrade: true,
    showAttendance: true,
    accentColor: '#4f46e5',
    principalSignature: 'Principal',
    classTeacherNote: ''
  };

  today = new Date();

  ngOnInit(): void {
    this.lookup.getStudents().subscribe((s) => (this.students = s));
    this.loadCustomTemplates();
  }

  loadCustomTemplates(): void {
    this.loadingTemplates = true;
    this.templateService.getAllTemplates(1, 100, this.mode).subscribe({
      next: (res) => {
        this.customTemplates = (res.templates || []).map((t: any) => ({
          id: t._id,
          name: t.name,
          icon: '📋',
          desc: t.description || 'Custom template',
          mode: t.type,
          _id: t._id,
          customization: t.customization,
          layout: t.layout
        }));
        this.loadingTemplates = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[Reports] Error loading custom templates:', err);
        this.customTemplates = [];
        this.loadingTemplates = false;
        this.cdr.markForCheck();
      }
    });
  }

  applyCustomTemplate(): void {
    if (!this.useCustomTemplate || !this.selectedTemplate) return;

    const template = this.customTemplates.find(t => t._id === this.selectedTemplate);
    if (template && template.customization) {
      this.customization = {
        ...this.customization,
        ...template.customization
      };
      this.cdr.markForCheck();
    }
  }

  setMode(m: DocMode): void {
    this.mode = m;
    const first = this.templates.find((t) => t.mode === m);
    if (first) this.selectedTemplate = first.id;
    this.resultData = null;
    this.summary = null;
    this.subjects = [];
    this.errorMessage = '';
  }

  templatesFor(mode: DocMode): TemplateInfo[] {
    return this.templates.filter((t) => t.mode === mode);
  }

  useTemplate(id: TemplateId): void {
    this.selectedTemplate = id;
  }

  onStudentChange(): void {
    this.resultData = null;
    this.summary = null;
    this.subjects = [];
    if (this.selectedStudent) this.loadResult();
  }

  loadResult(): void {
    this.loading = true;
    this.errorMessage = '';
    this.resultService.getResultSummary(this.selectedStudent, this.selectedSemester || undefined).subscribe({
      next: (res: any) => {
        this.resultData = res.student || null;
        this.summary = res.summary || null;
        this.subjects = res.subjects || [];
        this.loading = false;
        this.cdr.markForCheck();
        console.log('[Reports] Loaded result for', this.selectedStudent);
      },
      error: (err) => {
        this.loading = false;
        this.resultData = null;
        this.summary = null;
        this.subjects = [];
        if (this.mode === 'report') {
          this.errorMessage = 'No marks found for this student yet. Add marks first to generate a report card.';
        }
        this.cdr.markForCheck();
        console.error('[Reports] Load error:', err);
      }
    });
  }

  onSemesterChange(): void {
    if (this.selectedStudent) {
      this.loadResult();
    }
  }

  studentInfo(): Student | null {
    return this.students.find((s) => s._id === this.selectedStudent) || null;
  }

  semesterLabel(sem: string | undefined): string {
    if (!sem) return '—';
    const pre: Record<string, string> = {
      Sem_NUR: 'Nursery',
      LKG: 'LKG',
      UKG: 'UKG'
    };
    return pre[sem] || ('Semester ' + sem);
  }

  gradeBadge(grade: string): string {
    if (['O', 'A+'].includes(grade)) return 'badge-success';
    if (['A', 'B+'].includes(grade)) return 'badge-info';
    if (grade === 'B') return 'badge-warning';
    return 'badge-danger';
  }

  percentOf(sub: any): number {
    return Math.round(Number(sub.internalMarks || 0) + Number(sub.externalMarks || 0));
  }

  get sgpa(): string {
    return this.summary?.sgpa !== undefined && this.summary?.sgpa !== null
      ? Number(this.summary.sgpa).toFixed(2)
      : '—';
  }

  get percentage(): string {
    return this.summary?.percentage !== undefined && this.summary?.percentage !== null
      ? Number(this.summary.percentage).toFixed(1) + '%'
      : '—';
  }

  printDocument(): void {
    if (this.mode === 'report' && !this.resultData) {
      this.errorMessage = 'Select a student with marks first.';
      return;
    }
    window.print();
  }

  resetCustomization(): void {
    this.customization.schoolName = 'Sunrise Public School';
    this.customization.examName =
      this.mode === 'report' ? 'First Terminal Examination 2025-26' : 'Annual Examination 2025-26';
    this.customization.accentColor = '#4f46e5';
    this.customization.showPhoto = true;
    this.customization.showLogo = true;
    this.customization.showGrade = true;
    this.customization.showAttendance = true;
  }
}
