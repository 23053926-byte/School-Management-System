import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Subject, SubjectListResponse } from '../models/subject';

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private api = inject(ApiService);

  getSubjects(
    page = 1,
    limit = 10,
    search = '',
    department = '',
    semester = '',
    faculty = ''
  ): Observable<SubjectListResponse> {
    return this.api.get<SubjectListResponse>('/subjects', {
      page,
      limit,
      search,
      department,
      semester,
      faculty
    });
  }

  getSubjectById(id: string): Observable<{ success: boolean; subject: Subject }> {
    return this.api.get<{ success: boolean; subject: Subject }>(`/subjects/${id}`);
  }

  addSubject(subject: any): Observable<any> {
    return this.api.post<any>('/subjects', subject);
  }

  updateSubject(id: string, subject: any): Observable<any> {
    return this.api.put<any>(`/subjects/${id}`, subject);
  }

  deleteSubject(id: string): Observable<any> {
    return this.api.delete<any>(`/subjects/${id}`);
  }
}