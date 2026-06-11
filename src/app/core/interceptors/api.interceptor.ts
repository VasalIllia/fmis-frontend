import { HttpInterceptorFn } from '@angular/common/http';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = 'https://localhost:7242';
  const url = req.url.startsWith('/api') ? `${baseUrl}${req.url}` : req.url;

  const apiReq = req.clone({
    url: url,
    withCredentials: true
  });

  return next(apiReq);
};
