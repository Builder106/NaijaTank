import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  
  // Mock user for development
  private mockUser: User = {
    id: 'user123',
    phoneNumber: '+2348012345678',
    name: 'John Doe',
    email: 'john@example.com',
    reputationScore: 85,
    reportCount: 12,
    createdAt: '2023-05-15T10:30:00Z',
    lastLogin: new Date().toISOString()
  };

  constructor(private http: HttpClient) {}

  login(phoneNumber: string, countryCode: string): Observable<User> {
    // For development, return mock user
    if (phoneNumber && countryCode) {
      return of(this.mockUser).pipe(
        delay(1000),
        tap(user => {
          localStorage.setItem(this.tokenKey, 'mock-jwt-token');
          localStorage.setItem(this.userKey, JSON.stringify(user));
        })
      );
    }
    return throwError(() => new Error('Invalid phone number'));
    
    // Actual implementation would be:
    // return this.http.post<{token: string, user: User}>(`${this.apiUrl}/login`, { phoneNumber, countryCode })
    //   .pipe(
    //     tap(response => {
    //       localStorage.setItem(this.tokenKey, response.token);
    //       localStorage.setItem(this.userKey, JSON.stringify(response.user));
    //     }),
    //     map(response => response.user)
    //   );
  }

  logout(): Observable<void> {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    return of(void 0).pipe(delay(300));
    
    // Actual implementation would be:
    // return this.http.post<void>(`${this.apiUrl}/logout`, {})
    //   .pipe(
    //     tap(() => {
    //       localStorage.removeItem(this.tokenKey);
    //       localStorage.removeItem(this.userKey);
    //     })
    //   );
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    return userJson ? JSON.parse(userJson) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}