import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Student } from '../models/student';

export interface StudentListResponse {
  success: boolean;
  count: number;
  totalStudents: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  students: Student[];
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  private api = inject(ApiService);

  getStudents(
    page = 1,
    limit = 10,
    search = '',
    department = '',
    semester = ''
  ): Observable<StudentListResponse> {
    return this.api.get<StudentListResponse>('/students', {
      page,
      limit,
      search,
      department,
      semester
    });
  }

  getStudentById(id: string): Observable<{ success: boolean; student: any }> {
    return this.api.get<{ success: boolean; student: any }>(`/students/${id}`);
  }

  addStudent(student: any): Observable<any> {
    return this.api.post<any>('/students', student);
  }

  updateStudent(id: string, student: any): Observable<any> {
    return this.api.put<any>(`/students/${id}`, student);
  }

  deleteStudent(id: string): Observable<any> {
    return this.api.delete<any>(`/students/${id}`);
  }

  /** Bulk import: CSV is parsed in the browser and sent as a JSON array. */
  bulkCreate(students: any[]): Observable<any> {
    return this.api.post<any>('/students/bulk', { students });
  }

  /** Upload profile picture for a student */
  uploadProfilePicture(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return this.api.post<any>(`/students/${id}/profile-picture`, formData);
  }
}
