import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'user';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:3000/users';
  private roleSubject = new BehaviorSubject<'admin' | 'user' | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userIdSubject = new BehaviorSubject<number | null>(null);
  currentRole$ = this.roleSubject.asObservable();
  currentUserId$ = this.userIdSubject.asObservable();
  private tokenKey = 'authToken';
  private roleKey = 'userRole';
  private userIdKey = 'userId';

  constructor(private http: HttpClient) {
    // Restore state from localStorage on initialization
    this.restoreAuthState();
  }

  // Restore authentication state from localStorage on app init
  private restoreAuthState() {
    const token = this.getStoredToken();
    const role = this.getStoredRole();
    const userId = this.getStoredUserId();

    if (token && role && userId !== null) {
      this.tokenSubject.next(token);
      this.roleSubject.next(role);
      this.userIdSubject.next(userId);
    }
  }

  login(username: string, password: string): Observable<boolean> {
    return this.http.get<User[]>(`${this.baseUrl}?username=${username}`).pipe(
      map((users) => {
        const user = users.find((u) => u.password === password);
        if (user) {
          const token = this.generateToken(user);
          this.setToken(token);
          this.setRole(user.role);
          this.setUserId(user.id);
          return true;
        }
        return false;
      }),
      catchError((err) => {
        console.error('Login error:', err);
        return throwError(
          () =>
            new Error(
              'Login failed. Please check your credentials or server status.'
            )
        );
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.userIdKey);
    this.tokenSubject.next(null);
    this.roleSubject.next(null);
    this.userIdSubject.next(null);
  }

  private generateToken(user: User): string {
    return btoa(`${user.id}:${user.username}:${user.role}:${Date.now()}`);
  }

  private setToken(token: string) {
    this.tokenSubject.next(token);
    localStorage.setItem(this.tokenKey, token);
  }

  setRole(role: 'admin' | 'user') {
    this.roleSubject.next(role);
    localStorage.setItem(this.roleKey, role);
  }

  private setUserId(userId: number) {
    this.userIdSubject.next(userId);
    localStorage.setItem(this.userIdKey, userId.toString());
  }

  getStoredRole(): 'admin' | 'user' | null {
    const role = localStorage.getItem(this.roleKey);
    return role === 'admin' || role === 'user' ? role : null;
  }

  getStoredToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getStoredUserId(): number | null {
    const userId = localStorage.getItem(this.userIdKey);
    return userId ? +userId : null;
  }

  isAdmin(): boolean {
    return this.roleSubject.value === 'admin';
  }

  isLoggedIn(): boolean {
    return !!this.tokenSubject.value && !!this.roleSubject.value;
  }

  getCurrentUserId(): number | null {
    return this.userIdSubject.value;
  }
}
