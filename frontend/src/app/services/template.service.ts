import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Template {
  _id?: string;
  name: string;
  type: 'report' | 'admit';
  description: string;
  fields: any[];
  customization: any;
  layout: any;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private api = inject(ApiService);

  getAllTemplates(page = 1, limit = 10, type?: string): Observable<any> {
    const params: any = { page, limit };
    if (type) params.type = type;
    return this.api.get<any>('/templates', params);
  }

  getTemplate(id: string): Observable<any> {
    return this.api.get<any>(`/templates/${id}`);
  }

  createTemplate(template: Template): Observable<any> {
    return this.api.post<any>('/templates', template);
  }

  updateTemplate(id: string, template: Partial<Template>): Observable<any> {
    return this.api.put<any>(`/templates/${id}`, template);
  }

  deleteTemplate(id: string): Observable<any> {
    return this.api.delete<any>(`/templates/${id}`);
  }

  getDefaultTemplate(type: 'report' | 'admit'): Observable<any> {
    return this.api.get<any>(`/templates/default/${type}`);
  }

  duplicateTemplate(id: string): Observable<any> {
    return this.api.post<any>(`/templates/${id}/duplicate`, {});
  }
}
