import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AttendanceRow } from '../models/subject';

export interface AttendanceListResponse {
  success: boolean;
  count: number;
  totalAttendance: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  attendance: AttendanceRow[];
}

export interface YoloDetection {
  box: [number, number, number, number];
  confidence: number;
  matchedStudent?: {
    _id: string;
    studentId: string;
    name: string;
    similarity: number;
  };
}

export interface YoloDetectResponse {
  success: boolean;
  imageWidth: number;
  imageHeight: number;
  detections: YoloDetection[];
  imagePath?: string;
}

export interface YoloMarkPayload {
  subject: string;
  faculty: string;
  date: string;
  records: Array<{
    student: string;
    status: 'Present' | 'Absent';
    confidence?: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private api = inject(ApiService);

  getAttendance(
    page = 1,
    limit = 10,
    filters: Record<string, string> = {}
  ): Observable<AttendanceListResponse> {
    return this.api.get<AttendanceListResponse>('/attendance', {
      page,
      limit,
      ...filters
    });
  }

  markAttendance(body: any): Observable<any> {
    return this.api.post<any>('/attendance', body);
  }

  updateAttendance(id: string, body: any): Observable<any> {
    return this.api.put<any>(`/attendance/${id}`, body);
  }

  deleteAttendance(id: string): Observable<any> {
    return this.api.delete<any>(`/attendance/${id}`);
  }

  /** YOLO Face Detection - Detect faces in image and match with students */
  yoloDetect(formData: FormData): Observable<YoloDetectResponse> {
    return this.api.post<YoloDetectResponse>('/attendance/yolo-detect', formData);
  }

  /** YOLO Face Detection - Mark attendance for detected/confirmed students */
  yoloMark(payload: YoloMarkPayload): Observable<any> {
    return this.api.post<any>('/attendance/yolo-mark', payload);
  }
}