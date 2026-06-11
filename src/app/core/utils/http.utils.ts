import { HttpParams } from '@angular/common/http';

export function buildHttpParams(query?: any): HttpParams {
  let params = new HttpParams();
  if (!query) return params;

  Object.keys(query).forEach(key => {
    const val = query[key];
    if (val !== undefined && val !== null && val !== '') {
      params = params.set(key, val.toString());
    }
  });
  return params;
}
