import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : 'https://school-management-system-yafo.onrender.com/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
      'Content-Type': 'application/json'
    });
  }

  private clean(
    params?: Record<string, string | number | boolean | undefined>
  ): HttpParams {
    let p = new HttpParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== '' && v !== undefined && v !== null) {
          p = p.set(k, String(v));
        }
      }
    }
    return p;
  }

  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Observable<T> {
    return this.http.get<T>(`${API_BASE}${path}`, {
      headers: this.headers(),
      params: this.clean(params)
    });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${API_BASE}${path}`, body, {
      headers: this.headers()
    });
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${API_BASE}${path}`, body, {
      headers: this.headers()
    });
  }

    delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${API_BASE}${path}`, {
      headers: this.headers()
    });
  }

  /**
   * Upload a file (CSV / Excel) as multipart/form-data.
   * The auth token is attached automatically.
   */
  uploadFile<T>(path: string, file: File, extra?: Record<string, string>): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        formData.append(key, value);
      }
    }
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}` });
    return this.http.post<T>(`${API_BASE}${path}`, formData, { headers });
  }
}