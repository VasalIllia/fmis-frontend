import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import {
  RegisterRequest,
  LoginRequest,
  MeResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  InfoResponse,
  UpdateInfoRequest,
  ErrorProblemDetails,
  IdentityErrorResponse
} from './auth.models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // State Signals
  public isAuthenticated = signal<boolean>(false);
  public userId = signal<string | null>(null);
  public farmId = signal<string | null>(null);
  public isInitialized = signal<boolean>(false);



  public initAuth(): Observable<MeResponse | null> {
    return this.http.get<MeResponse>('/api/auth/me').pipe(
      tap(res => {
        if (res && res.userId) {
          this.isAuthenticated.set(true);
          this.userId.set(res.userId);
          this.farmId.set(res.farmId);
        } else {
          this.clearState();
        }
        this.isInitialized.set(true);
      }),
      catchError(() => {
        this.clearState();
        this.isInitialized.set(true);
        return of(null);
      })
    );
  }

  public register(req: RegisterRequest): Observable<void> {
    return this.http.post<void>('/api/auth/register', req);
  }

  public login(req: LoginRequest): Observable<any> {
    return this.http.post('/api/auth/login?useCookies=true&useSessionCookies=false', req);
  }

  public getPostAuthRoute(me?: MeResponse | null): string[] {
    const userId = me?.userId ?? this.userId();
    const farmId = me?.farmId ?? this.farmId();

    if (!userId) {
      return ['/auth/login'];
    }

    return ['/overview'];
  }

  public redirectAfterAuth(me?: MeResponse | null): void {
    this.router.navigate(this.getPostAuthRoute(me), { replaceUrl: true });
  }

  public resendConfirmationEmail(email: string): Observable<void> {
    return this.http.post<void>('/api/auth/resendConfirmationEmail', { email });
  }

  public confirmEmail(userId: string, code: string, changedEmail?: string): Observable<void> {
    let url = `/api/auth/confirmEmail?userId=${encodeURIComponent(userId)}&code=${encodeURIComponent(code)}`;
    if (changedEmail) {
      url += `&changedEmail=${encodeURIComponent(changedEmail)}`;
    }
    return this.http.get<void>(url);
  }

  public forgotPassword(req: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>('/api/auth/forgotPassword', req);
  }

  public resetPassword(req: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>('/api/auth/resetPassword', req);
  }

  public getInfo(): Observable<InfoResponse> {
    return this.http.get<InfoResponse>('/api/auth/manage/info');
  }

  public updateInfo(req: UpdateInfoRequest): Observable<InfoResponse> {
    return this.http.post<InfoResponse>('/api/auth/manage/info', req);
  }

  public logout(): void {
    this.http.post('/api/auth/logout', {}).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.clearState();
      this.router.navigate(['/auth/login']);
    });
  }

  public updateFarmId(newFarmId: string | null): void {
    this.farmId.set(newFarmId);
  }

  private clearState(): void {
    this.isAuthenticated.set(false);
    this.userId.set(null);
    this.farmId.set(null);
  }
}
