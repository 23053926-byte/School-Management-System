import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { StudentService } from './student.service';
import { SubjectService } from './subject.service';
import { FacultyService } from './faculty.service';
import { Student } from '../models/student';
import { Subject } from '../models/subject';
import { Faculty } from '../models/faculty';

/**
 * Caches the dropdown lookups (students / subjects / faculties) so that
 * navigating between Attendance, Marks, Subjects and Results doesn't
 * re-fetch the same lists over and over. Data is fetched once per session
 * and cached with shareReplay({ bufferSize: 1, refCount: true }).
 *
 * If a call errors the cache is cleared so the next subscriber refetches
 * instead of replaying a stale error.
 */
@Injectable({ providedIn: 'root' })
export class LookupService {
  private studentService = inject(StudentService);
  private subjectService = inject(SubjectService);
  private facultyService = inject(FacultyService);

  private students$: Observable<Student[]> | null = null;
  private subjects$: Observable<Subject[]> | null = null;
  private faculties$: Observable<Faculty[]> | null = null;

  getStudents(): Observable<Student[]> {
    if (!this.students$) {
      this.students$ = this.studentService.getStudents(1, 500).pipe(
        map((res) => res.students || []),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      // Clear cache on error so next subscriber refetches
      this.students$.subscribe({
        error: () => { this.students$ = null; }
      });
    }
    return this.students$;
  }

  getSubjects(): Observable<Subject[]> {
    if (!this.subjects$) {
      this.subjects$ = this.subjectService.getSubjects(1, 500).pipe(
        map((res) => res.subjects || []),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.subjects$.subscribe({
        error: () => { this.subjects$ = null; }
      });
    }
    return this.subjects$;
  }

  getFaculties(): Observable<Faculty[]> {
    if (!this.faculties$) {
      this.faculties$ = this.facultyService.getFaculties(1, 500).pipe(
        map((res) => res.faculties || []),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.faculties$.subscribe({
        error: () => { this.faculties$ = null; }
      });
    }
    return this.faculties$;
  }

  /** Clear caches after a create/update/delete so lists stay fresh. */
  refreshStudents(): void { this.students$ = null; }
  refreshSubjects(): void { this.subjects$ = null; }
  refreshFaculties(): void { this.faculties$ = null; }
  refreshAll(): void {
    this.students$ = null;
    this.subjects$ = null;
    this.faculties$ = null;
  }
}