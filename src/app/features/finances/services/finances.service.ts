import { buildHttpParams } from '../../../core/utils/http.utils';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from '../../animals/models/animals.models';
import {
  FinancialRecordDto,
  CreateFinancialRecordDto,
  UpdateFinancialRecordDto,
  FinancialRecordKind,
  FinancialRecordType
} from '../models/finances.models';
import { FarmModuleType } from '../../animals/models/animals.models';

@Injectable({
  providedIn: 'root'
})
export class FinancesService {
  private http = inject(HttpClient);

  getFinances(query?: {
    Search?: string;
    Kind?: FinancialRecordKind;
    Type?: FinancialRecordType;
    ModuleType?: FarmModuleType;
    OccurredAtFrom?: string;
    OccurredAtTo?: string;
    AmountFrom?: number;
    AmountTo?: number;
    DateFrom?: string;
    DateTo?: string;
    Year?: number;
    IncludeAllYears?: boolean;
    PageNumber?: number;
    PageSize?: number;
  }): Observable<PagedResult<FinancialRecordDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<FinancialRecordDto>>('/api/finances', { params });
  }

  getFinanceById(id: number): Observable<FinancialRecordDto> {
    return this.http.get<FinancialRecordDto>(`/api/finances/${id}`);
  }

  createFinance(body: CreateFinancialRecordDto): Observable<FinancialRecordDto> {
    return this.http.post<FinancialRecordDto>('/api/finances', body);
  }

  updateFinance(id: number, body: UpdateFinancialRecordDto): Observable<FinancialRecordDto> {
    return this.http.put<FinancialRecordDto>(`/api/finances/${id}`, body);
  }

  deleteFinance(id: number): Observable<void> {
    return this.http.delete<void>(`/api/finances/${id}`);
  }
}
