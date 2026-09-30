import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id: string;
  organizationId: string;
  organizationName?: string;
  name: string;
  email: string;
  role: string;
}

export interface Organization {
  organizationId: string;
  organizationName: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api/auth'
    : 'https://school-management-system-yafo.onrender.com/api/auth';


  login(
    email: string,
    password: string,
    organizationId?: string
  ): Observable<LoginResponse> {

    const body: any = {
      email: email,
      password: password
    };

    if (organizationId) {
      body.organizationId = organizationId;
    }

    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/login`,
        body
      )
      .pipe(

        tap((response) => {

          if (response.success && response.token) {

            // Save JWT
            localStorage.setItem(
              'token',
              response.token
            );

            // Save user information with organization context
            localStorage.setItem(
              'user',
              JSON.stringify(response.user)
            );

            // Save organization separately for quick access
            localStorage.setItem(
              'organization',
              JSON.stringify({
                organizationId: response.user.organizationId,
                organizationName: response.user.organizationName
              })
            );

          }

        })

      );

  }


  getToken(): string | null {

    return localStorage.getItem('token');

  }


  getUser(): User | null {

    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    return JSON.parse(user);

  }


  getOrganization(): Organization | null {

    const org = localStorage.getItem('organization');

    if (!org) {
      return null;
    }

    return JSON.parse(org);

  }


  getRole(): string | null {

    const user = this.getUser();

    return user?.role ?? null;

  }


  getOrganizationId(): string | null {

    const user = this.getUser();

    return user?.organizationId ?? null;

  }


  isLoggedIn(): boolean {

    return !!this.getToken();

  }


  logout(): void {

    localStorage.removeItem('token');

    localStorage.removeItem('user');

    localStorage.removeItem('organization');

  }

}
