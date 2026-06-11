import { buildHttpParams } from '../../../core/utils/http.utils';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult, FarmLocationDto } from '../../animals/models/animals.models';
import {
  CropDto,
  CreateCropDto,
  UpdateCropDto,
  CropHarvestDto,
  CreateCropHarvestDto,
  UpdateCropHarvestDto,
  CropType,
  CropStatus
} from '../models/crops.models';
import { SellProductRequest, MeasurementUnit } from '../../animals/models/animals.models';

@Injectable({
  providedIn: 'root'
})
export class CropsService {
  private http = inject(HttpClient);

  // --- LOCATIONS ---
  getCropLocations(query?: { Search?: string; PageNumber?: number; PageSize?: number }): Observable<PagedResult<FarmLocationDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<FarmLocationDto>>('/api/crops/locations', { params });
  }

  createCropLocation(body: { name: string; description?: string | null }): Observable<FarmLocationDto> {
    return this.http.post<FarmLocationDto>('/api/crops/locations', body);
  }

  updateLocation(id: number, body: { name: string; description?: string | null; module: 'Crops' }): Observable<FarmLocationDto> {
    return this.http.put<FarmLocationDto>(`/api/locations/${id}`, body);
  }

  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`/api/locations/${id}`);
  }

  // --- CROPS ---
  getCrops(query?: {
    Search?: string;
    LocationId?: number;
    Status?: CropStatus;
    Type?: CropType;
    Unit?: MeasurementUnit;
    SowingDateFrom?: string;
    SowingDateTo?: string;
    Year?: number;
    IncludeAllYears?: boolean;
    PageNumber?: number;
    PageSize?: number;
  }): Observable<PagedResult<CropDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<CropDto>>('/api/crops', { params });
  }

  getCropById(id: number): Observable<CropDto> {
    return this.http.get<CropDto>(`/api/crops/${id}`);
  }

  createCrop(body: CreateCropDto): Observable<CropDto> {
    return this.http.post<CropDto>('/api/crops', body);
  }

  updateCrop(id: number, body: UpdateCropDto): Observable<CropDto> {
    return this.http.put<CropDto>(`/api/crops/${id}`, body);
  }

  deleteCrop(id: number): Observable<void> {
    return this.http.delete<void>(`/api/crops/${id}`);
  }

  // --- HARVESTS ---
  getHarvests(query?: {
    Search?: string;
    CropId?: number;
    CropType?: CropType;
    CropStatus?: CropStatus;
    Unit?: MeasurementUnit;
    HarvestDateFrom?: string;
    HarvestDateTo?: string;
    DateFrom?: string;
    DateTo?: string;
    Year?: number;
    IncludeAllYears?: boolean;
    PageNumber?: number;
    PageSize?: number;
  }): Observable<PagedResult<CropHarvestDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<CropHarvestDto>>('/api/crops/harvests', { params });
  }

  getHarvestById(id: number): Observable<CropHarvestDto> {
    return this.http.get<CropHarvestDto>(`/api/crops/harvests/${id}`);
  }

  createHarvest(body: CreateCropHarvestDto): Observable<CropHarvestDto> {
    return this.http.post<CropHarvestDto>('/api/crops/harvests', body);
  }

  updateHarvest(id: number, body: UpdateCropHarvestDto): Observable<CropHarvestDto> {
    return this.http.put<CropHarvestDto>(`/api/crops/harvests/${id}`, body);
  }

  deleteHarvest(id: number): Observable<void> {
    return this.http.delete<void>(`/api/crops/harvests/${id}`);
  }

  sellHarvest(id: number, body: SellProductRequest): Observable<any> {
    return this.http.post<any>(`/api/crops/harvests/${id}/sell`, body);
  }
}
