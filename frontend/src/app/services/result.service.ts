import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ResultService {
  private api = inject(ApiService);

  getStudentResult(
    studentId: string
  ): Observable<{ success: boolean; student: any; count: number; data: any[] }> {
    return this.api.get<{ success: boolean; student: any; count: number; data: any[] }>(
      `/results/student/${studentId}`
    );
  }

  getResultSummary(
    studentId: string,
    semester?: string
  ): Observable<{ success: boolean; student: any; summary: any; subjects: any[] }> {
    const params: any = {};
    if (semester) params.semester = semester;
    return this.api.get<{ success: boolean; student: any; summary: any; subjects: any[] }>(
      `/results/student/${studentId}/summary`,
      { params }
    );
  }
}