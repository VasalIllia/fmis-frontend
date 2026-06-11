import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let errorMessage = 'Сталася невідома помилка.';

      if (err.status === 0) {
        errorMessage = 'Немає з\'єднання з сервером.';
      } else if (err.status === 401) {
        errorMessage = 'Сесія закінчилася. Авторизуйтесь знову.';
      } else if (err.status === 403) {
        errorMessage = 'Доступ заборонено. Акаунт може бути заблоковано.';
      } else if (err.status === 404) {
        errorMessage = 'Запис не знайдено.';
      } else if (err.status === 500) {
        errorMessage = 'Сталася помилка сервера. Спробуйте ще раз.';
      } else if (err.error) {
        if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.error.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
          // IdentityErrorResponse
          if (err.error.errors[0].description) {
             errorMessage = err.error.errors.map((e: any) => e.description).join('\\n');
          } else {
             // Validation problem
             errorMessage = Object.entries(err.error.errors)
               .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
               .join('\\n');
          }
        } else if (err.error.message) {
          errorMessage = err.error.message;
        } else if (err.error.detail) {
          errorMessage = err.error.detail;
        } else if (err.error.title) {
          errorMessage = err.error.title;
        }
      }

      toastService.danger(errorMessage);
      return throwError(() => err);
    })
  );
};
