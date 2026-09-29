import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MarksRow } from '../models/subject';

export interface MarksListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: MarksRow[];
}

@Injectable({ providedIn: 'root' })
export class MarksService {
  private api = inject(ApiService);

  getAllMarks(
    page = 1,
    limit = 10,
    filters: Record<string, string> = {}
  ): Observable<MarksListResponse> {
    return this.api.get<MarksListResponse>('/marks', {
      page,
      limit,
      ...filters
    });
  }

  createMarks(body: any): Observable<any> {
    return this.api.post<any>('/marks', body);
  }

  updateMarks(id: string, body: any): Observable<any> {
    return this.api.put<any>(`/marks/${id}`, body);
  }

  deleteMarks(id: string): Observable<any> {
    return this.api.delete<any>(`/marks/${id}`);
  }
}