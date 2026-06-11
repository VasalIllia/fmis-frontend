import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FarmDto, CreateFarmRequest } from './farm.models';

@Injectable({
  providedIn: 'root'
})
export class FarmService {
  private http = inject(HttpClient);
  public currentFarm = signal<FarmDto | null>(null);

  public getFarm(): Observable<FarmDto> {
    return this.http.get<FarmDto>('/api/farms').pipe(
      tap(farm => this.currentFarm.set(farm))
    );
  }

  public createFarm(req: CreateFarmRequest): Observable<FarmDto> {
    return this.http.post<FarmDto>('/api/farms', req).pipe(
      tap(farm => this.currentFarm.set(farm))
    );
  }

  public updateFarm(name: string): Observable<FarmDto> {
    return this.http.put<FarmDto>('/api/farms', { name }).pipe(
      tap(farm => this.currentFarm.set(farm))
    );
  }

  public deleteFarm(): Observable<void> {
    return this.http.delete<void>('/api/farms').pipe(
      tap(() => this.currentFarm.set(null))
    );
  }
}
