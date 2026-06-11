import { buildHttpParams } from '../../../core/utils/http.utils';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AnimalDto,
  FarmLocationDto,
  AnimalProductDto,
  AnimalMatingDto,
  PagedResult,
  AnimalType,
  AnimalSex,
  AnimalStatus,
  AnimalMatingStatus,
  MeasurementUnit,
  SellProductRequest,
  AnimalMedicalInfoDto
} from '../models/animals.models';

@Injectable({
  providedIn: 'root'
})
export class AnimalsService {
  private http = inject(HttpClient);

  // Helper to create HttpParams from an object

  // --- LOCATIONS ---
  getAnimalLocations(query?: { Search?: string; PageNumber?: number; PageSize?: number }): Observable<PagedResult<FarmLocationDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<FarmLocationDto>>('/api/animals/locations', { params });
  }

  createAnimalLocation(body: { name: string; description?: string | null }): Observable<FarmLocationDto> {
    return this.http.post<FarmLocationDto>('/api/animals/locations', body);
  }

  getLocationById(id: number): Observable<FarmLocationDto> {
    return this.http.get<FarmLocationDto>(`/api/locations/${id}`);
  }

  updateLocation(id: number, body: { name: string; description?: string | null; module: 'Animals' }): Observable<FarmLocationDto> {
    return this.http.put<FarmLocationDto>(`/api/locations/${id}`, body);
  }

  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`/api/locations/${id}`);
  }

  // --- ANIMALS ---
  getAnimals(query?: {
    Search?: string;
    LocationId?: number;
    Species?: AnimalType;
    Sex?: AnimalSex;
    Status?: AnimalStatus;
    BirthDateFrom?: string;
    BirthDateTo?: string;
    PageNumber?: number;
    PageSize?: number;
  }): Observable<PagedResult<AnimalDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<AnimalDto>>('/api/animals', { params });
  }

  getAnimalById(id: number): Observable<AnimalDto> {
    return this.http.get<AnimalDto>(`/api/animals/${id}`);
  }

  createAnimal(body: Partial<AnimalDto>): Observable<AnimalDto> {
    return this.http.post<AnimalDto>('/api/animals', body);
  }

  updateAnimal(id: number, body: Partial<AnimalDto>): Observable<AnimalDto> {
    return this.http.put<AnimalDto>(`/api/animals/${id}`, body);
  }

  deleteAnimal(id: number): Observable<void> {
    return this.http.delete<void>(`/api/animals/${id}`);
  }

  // --- NESTED PRODUCTS ---
  getAnimalProducts(
    animalId: number,
    query?: {
      Search?: string;
      Unit?: MeasurementUnit;
      AnimalSpecies?: AnimalType;
      AnimalStatus?: AnimalStatus;
      DateFrom?: string;
      DateTo?: string;
      Year?: number;
      IncludeAllYears?: boolean;
      PageNumber?: number;
      PageSize?: number;
    }
  ): Observable<PagedResult<AnimalProductDto>> {
    return this.getProductsDirect({ ...query, AnimalId: animalId });
  }

  getAnimalProductById(animalId: number, id: number): Observable<AnimalProductDto> {
    return this.getProductDirectById(id);
  }

  createAnimalProduct(animalId: number, body: Partial<AnimalProductDto>): Observable<AnimalProductDto> {
    return this.createProductDirect({ ...body, animalId });
  }

  updateAnimalProduct(animalId: number, id: number, body: Partial<AnimalProductDto>): Observable<AnimalProductDto> {
    return this.updateProductDirect(id, body);
  }

  deleteAnimalProduct(animalId: number, id: number): Observable<void> {
    return this.deleteProductDirect(id);
  }

  // --- DIRECT PRODUCTS (New global endpoints) ---
  getProductsDirect(query?: {
    Search?: string;
    AnimalId?: number;
    Unit?: MeasurementUnit;
    AnimalSpecies?: AnimalType;
    AnimalStatus?: AnimalStatus;
    DateFrom?: string;
    DateTo?: string;
    Year?: number;
    IncludeAllYears?: boolean;
    PageNumber?: number;
    PageSize?: number;
  }): Observable<PagedResult<AnimalProductDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<AnimalProductDto>>('/api/animals/products', { params });
  }

  getProductDirectById(id: number): Observable<AnimalProductDto> {
    return this.http.get<AnimalProductDto>(`/api/animals/products/${id}`);
  }

  createProductDirect(body: Partial<AnimalProductDto>): Observable<AnimalProductDto> {
    return this.http.post<AnimalProductDto>('/api/animals/products', body);
  }

  updateProductDirect(id: number, body: Partial<AnimalProductDto>): Observable<AnimalProductDto> {
    return this.http.put<AnimalProductDto>(`/api/animals/products/${id}`, body);
  }

  deleteProductDirect(id: number): Observable<void> {
    return this.http.delete<void>(`/api/animals/products/${id}`);
  }

  sellProductDirect(id: number, body: SellProductRequest): Observable<any> {
    return this.http.post<any>(`/api/animals/products/${id}/sell`, body);
  }

  // --- NESTED MATINGS ---
  getAnimalMatings(
    animalId: number,
    query?: {
      FemaleAnimalId?: number;
      MaleAnimalId?: number;
      Status?: AnimalMatingStatus;
      MatingDateFrom?: string;
      MatingDateTo?: string;
      ExpectedBirthDateFrom?: string;
      ExpectedBirthDateTo?: string;
      ActualBirthDateFrom?: string;
      ActualBirthDateTo?: string;
      PageNumber?: number;
      PageSize?: number;
    }
  ): Observable<PagedResult<AnimalMatingDto>> {
    return this.getAnimalMatingsDirect({ ...query, AnimalId: animalId });
  }

  getAnimalMatingById(animalId: number, id: number): Observable<AnimalMatingDto> {
    return this.getAnimalMatingDirectById(id);
  }

  createAnimalMating(animalId: number, body: Partial<AnimalMatingDto>): Observable<AnimalMatingDto> {
    return this.createAnimalMatingDirect(body);
  }

  updateAnimalMating(animalId: number, id: number, body: Partial<AnimalMatingDto>): Observable<AnimalMatingDto> {
    return this.updateAnimalMatingDirect(id, body);
  }

  deleteAnimalMating(animalId: number, id: number): Observable<void> {
    return this.deleteAnimalMatingDirect(id);
  }

  // --- DIRECT MATINGS (New global endpoints) ---
  getAnimalMatingsDirect(query?: {
    AnimalId?: number;
    FemaleAnimalId?: number;
    MaleAnimalId?: number;
    Status?: AnimalMatingStatus;
    MatingDateFrom?: string;
    MatingDateTo?: string;
    ExpectedBirthDateFrom?: string;
    ExpectedBirthDateTo?: string;
    ActualBirthDateFrom?: string;
    ActualBirthDateTo?: string;
    PageNumber?: number;
    PageSize?: number;
  }): Observable<PagedResult<AnimalMatingDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<AnimalMatingDto>>('/api/animal-matings', { params });
  }

  getAnimalMatingDirectById(id: number): Observable<AnimalMatingDto> {
    return this.http.get<AnimalMatingDto>(`/api/animal-matings/${id}`);
  }

  createAnimalMatingDirect(body: Partial<AnimalMatingDto>): Observable<AnimalMatingDto> {
    return this.http.post<AnimalMatingDto>('/api/animal-matings', body);
  }

  updateAnimalMatingDirect(id: number, body: Partial<AnimalMatingDto>): Observable<AnimalMatingDto> {
    return this.http.put<AnimalMatingDto>(`/api/animal-matings/${id}`, body);
  }

  deleteAnimalMatingDirect(id: number): Observable<void> {
    return this.http.delete<void>(`/api/animal-matings/${id}`);
  }

  // --- MEDICAL INFO ---
  getMedicalInfos(query?: {
    Search?: string;
    AnimalId?: number;
    AnimalSpecies?: AnimalType;
    AnimalStatus?: AnimalStatus;
    ProcedureDateFrom?: string;
    ProcedureDateTo?: string;
    DateFrom?: string;
    DateTo?: string;
    Year?: number;
    IncludeAllYears?: boolean;
    PageNumber?: number;
    PageSize?: number;
  }): Observable<PagedResult<AnimalMedicalInfoDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<AnimalMedicalInfoDto>>('/api/animals/medical-info', { params });
  }

  getMedicalInfoById(id: number): Observable<AnimalMedicalInfoDto> {
    return this.http.get<AnimalMedicalInfoDto>(`/api/animals/medical-info/${id}`);
  }

  createMedicalInfo(body: Partial<AnimalMedicalInfoDto>): Observable<AnimalMedicalInfoDto> {
    return this.http.post<AnimalMedicalInfoDto>('/api/animals/medical-info', body);
  }

  updateMedicalInfo(id: number, body: Partial<AnimalMedicalInfoDto>): Observable<AnimalMedicalInfoDto> {
    return this.http.put<AnimalMedicalInfoDto>(`/api/animals/medical-info/${id}`, body);
  }

  deleteMedicalInfo(id: number): Observable<void> {
    return this.http.delete<void>(`/api/animals/medical-info/${id}`);
  }

  // Error Parser helper based on specification requirements
}
