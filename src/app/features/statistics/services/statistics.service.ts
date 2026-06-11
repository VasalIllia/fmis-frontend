import { buildHttpParams } from '../../../core/utils/http.utils';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AnimalStatisticsDto,
  CropStatisticsDto,
  FinancialStatisticsDto,
  GardenStatisticsDto,
  StatisticsOverviewDto,
  YearlyStatisticsDto
} from '../models/statistics.models';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private http = inject(HttpClient);

  getOverview(year?: number): Observable<StatisticsOverviewDto> {
    return this.http.get<StatisticsOverviewDto>('/api/statistics/overview', {
      params: buildHttpParams({ year })
    });
  }

  getAnimalStatistics(year?: number): Observable<AnimalStatisticsDto> {
    return this.http.get<AnimalStatisticsDto>('/api/statistics/animals', {
      params: buildHttpParams({ year })
    });
  }

  getCropStatistics(year?: number): Observable<CropStatisticsDto> {
    return this.http.get<CropStatisticsDto>('/api/statistics/crops', {
      params: buildHttpParams({ year })
    });
  }

  getGardenStatistics(year?: number): Observable<GardenStatisticsDto> {
    return this.http.get<GardenStatisticsDto>('/api/statistics/gardens', {
      params: buildHttpParams({ year })
    });
  }

  getFinanceStatistics(year?: number): Observable<FinancialStatisticsDto> {
    return this.http.get<FinancialStatisticsDto>('/api/statistics/finances', {
      params: buildHttpParams({ year })
    });
  }

  getYearlyStatistics(): Observable<YearlyStatisticsDto[]> {
    return this.http.get<YearlyStatisticsDto[]>('/api/statistics/yearly');
  }
}
