import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Faculty, FacultyListResponse } from '../models/faculty';

@Injectable({ providedIn: 'root' })
export class FacultyService {
  private api = inject(ApiService);

  getFaculties(
    page = 1,
    limit = 10,
    search = '',
    department = '',
    designation = ''
  ): Observable<FacultyListResponse> {
    return this.api.get<FacultyListResponse>('/faculty', {
      page,
      limit,
      search,
      department,
      designation
    });
  }

  getFacultyById(id: string): Observable<{ success: boolean; faculty: Faculty }> {
    return this.api.get<{ success: boolean; faculty: Faculty }>(`/faculty/${id}`);
  }

  addFaculty(faculty: any): Observable<{ success: boolean; message: string; faculty: Faculty }> {
    return this.api.post<{ success: boolean; message: string; faculty: Faculty }>('/faculty', faculty);
  }

  updateFaculty(id: string, faculty: any): Observable<any> {
    return this.api.put<any>(`/faculty/${id}`, faculty);
  }

  deleteFaculty(id: string): Observable<any> {
    return this.api.delete<any>(`/faculty/${id}`);
  }
}