import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResultService } from '../../services/result.service';
import { LookupService } from '../../services/lookup.service';
import { Student } from '../../models/student';

@Component({
  selector: 'app-results',
  imports: [FormsModule],
  templateUrl: './results.html',
  styleUrl: './results.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultsComponent implements OnInit {
  private resultService = inject(ResultService);
  private lookup = inject(LookupService);
  private cdr = inject(ChangeDetectorRef);

  students: Student[] = [];
  selectedStudentId = '';
  selectedSemester = '';

  result: any = null; // summary
  subjects: any[] = [];

  loadingStudents = false;
  loadingResult = false;
  errorMessage = '';
  hasLoaded = false;

  semesters = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Sem_NUR', 'LKG', 'UKG'];

  ngOnInit(): void {
    this.loadingStudents = true;
    this.lookup.getStudents().subscribe({
      next: (s) => {
        this.students = s;
        this.loadingStudents = false;
      },
      error: () => {
        this.students = [];
        this.loadingStudents = false;
        this.errorMessage = 'Unable to load students.';
      }
    });
  }

  onStudentChange(): void {
    this.errorMessage = '';
    this.result = null;
    this.subjects = [];
    this.hasLoaded = false;

    if (!this.selectedStudentId) return;

    this.loadingResult = true;
    this.resultService.getResultSummary(this.selectedStudentId, this.selectedSemester).subscribe({
      next: (res) => {
        this.result = res.summary;
        this.subjects = res.subjects || [];
        this.loadingResult = false;
        this.hasLoaded = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingResult = false;
        this.hasLoaded = true;
        this.errorMessage = err?.error?.message || 'No result available for this student.';
        this.cdr.markForCheck();
      }
    });
  }

  onSemesterChange(): void {
    if (this.selectedStudentId) {
      this.onStudentChange();
    }
  }

  percentageLabel(): string {
    if (!this.result) return '—';
    return this.result.percentage != null ? `${this.result.percentage}%` : '—';
  }

  resultBadge(): string {
    return this.result?.overallResult === 'Pass' ? 'badge-success' : 'badge-danger';
  }

  gradeBadge(grade: string): string {
    if (grade === 'F') return 'badge-danger';
    if (['O', 'A+'].includes(grade)) return 'badge-success';
    return 'badge-brand';
  }

  subjectResultBadge(result: string): string {
    return result === 'Pass' ? 'badge-success' : 'badge-danger';
  }
}