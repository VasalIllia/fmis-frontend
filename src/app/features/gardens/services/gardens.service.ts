import { buildHttpParams } from '../../../core/utils/http.utils';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult, FarmLocationDto } from '../../animals/models/animals.models';
import {
  GardenDto,
  CreateGardenDto,
  UpdateGardenDto,
  GardenHarvestDto,
  CreateGardenHarvestDto,
  UpdateGardenHarvestDto,
  GardenType,
  GardenStatus
} from '../models/gardens.models';
import { SellProductRequest, MeasurementUnit } from '../../animals/models/animals.models';

@Injectable({
  providedIn: 'root'
})
export class GardensService {
  private http = inject(HttpClient);

  // --- LOCATIONS ---
  getGardenLocations(query?: { Search?: string; PageNumber?: number; PageSize?: number }): Observable<PagedResult<FarmLocationDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<FarmLocationDto>>('/api/gardens/locations', { params });
  }

  createGardenLocation(body: { name: string; description?: string | null }): Observable<FarmLocationDto> {
    return this.http.post<FarmLocationDto>('/api/gardens/locations', body);
  }

  updateLocation(id: number, body: { name: string; description?: string | null; module: 'Gardens' }): Observable<FarmLocationDto> {
    return this.http.put<FarmLocationDto>(`/api/locations/${id}`, body);
  }

  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`/api/locations/${id}`);
  }

  // --- GARDENS ---
  getGardens(query?: {
    Search?: string;
    LocationId?: number;
    Status?: GardenStatus;
    Type?: GardenType;
    Unit?: MeasurementUnit;
    PlantingDateFrom?: string;
    PlantingDateTo?: string;
    Year?: number;
    PageNumber?: number;
    PageSize?: number;
  }): Observable<PagedResult<GardenDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<GardenDto>>('/api/gardens', { params });
  }

  getGardenById(id: number): Observable<GardenDto> {
    return this.http.get<GardenDto>(`/api/gardens/${id}`);
  }

  createGarden(body: CreateGardenDto): Observable<GardenDto> {
    return this.http.post<GardenDto>('/api/gardens', body);
  }

  updateGarden(id: number, body: UpdateGardenDto): Observable<GardenDto> {
    return this.http.put<GardenDto>(`/api/gardens/${id}`, body);
  }

  deleteGarden(id: number): Observable<void> {
    return this.http.delete<void>(`/api/gardens/${id}`);
  }

  // --- HARVESTS ---
  getHarvests(query?: {
    Search?: string;
    GardenId?: number;
    GardenType?: GardenType;
    GardenStatus?: GardenStatus;
    Unit?: MeasurementUnit;
    HarvestDateFrom?: string;
    HarvestDateTo?: string;
    DateFrom?: string;
    DateTo?: string;
    Year?: number;
    IncludeAllYears?: boolean;
    PageNumber?: number;
    PageSize?: number;
  }): Observable<PagedResult<GardenHarvestDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<GardenHarvestDto>>('/api/gardens/harvests', { params });
  }

  getHarvestById(id: number): Observable<GardenHarvestDto> {
    return this.http.get<GardenHarvestDto>(`/api/gardens/harvests/${id}`);
  }

  createHarvest(body: CreateGardenHarvestDto): Observable<GardenHarvestDto> {
    return this.http.post<GardenHarvestDto>('/api/gardens/harvests', body);
  }

  updateHarvest(id: number, body: UpdateGardenHarvestDto): Observable<GardenHarvestDto> {
    return this.http.put<GardenHarvestDto>(`/api/gardens/harvests/${id}`, body);
  }

  deleteHarvest(id: number): Observable<void> {
    return this.http.delete<void>(`/api/gardens/harvests/${id}`);
  }

  sellHarvest(id: number, body: SellProductRequest): Observable<any> {
    return this.http.post<any>(`/api/gardens/harvests/${id}/sell`, body);
  }
}
