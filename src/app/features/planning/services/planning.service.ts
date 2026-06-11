import { buildHttpParams } from '../../../core/utils/http.utils';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from '../../animals/models/animals.models';
import {
  PlanItemDto,
  CreatePlanItemDto,
  UpdatePlanItemDto,
  PlanNotificationDto,
  PlanItemStatus,
  PlanItemPriority,
  PlanItemSourceType,
  NotificationStatus
} from '../models/planning.models';

@Injectable({
  providedIn: 'root'
})
export class PlanningService {
  private http = inject(HttpClient);

  // --- PLAN ITEMS ---
  getPlanItems(query?: {
    Search?: string;
    Status?: PlanItemStatus;
    Priority?: PlanItemPriority;
    SourceType?: PlanItemSourceType;
    SourceEntityId?: number;
    DateFrom?: string;
    DateTo?: string;
    PageNumber?: number;
    PageSize?: number;
  }): Observable<PagedResult<PlanItemDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<PlanItemDto>>('/api/plan-items', { params });
  }

  getPlanItemById(id: number): Observable<PlanItemDto> {
    return this.http.get<PlanItemDto>(`/api/plan-items/${id}`);
  }

  createPlanItem(body: CreatePlanItemDto): Observable<PlanItemDto> {
    return this.http.post<PlanItemDto>('/api/plan-items', body);
  }

  updatePlanItem(id: number, body: UpdatePlanItemDto): Observable<PlanItemDto> {
    return this.http.put<PlanItemDto>(`/api/plan-items/${id}`, body);
  }

  deletePlanItem(id: number): Observable<void> {
    return this.http.delete<void>(`/api/plan-items/${id}`);
  }

  // --- NOTIFICATIONS ---
  getNotifications(query?: {
    Status?: NotificationStatus;
    DateTo?: string;
    PageNumber?: number;
    PageSize?: number;
  }): Observable<PagedResult<PlanNotificationDto>> {
    const params = buildHttpParams(query);
    return this.http.get<PagedResult<PlanNotificationDto>>('/api/notifications', { params });
  }

  markNotificationAsDelivered(id: number): Observable<PlanNotificationDto> {
    return this.http.post<PlanNotificationDto>(`/api/notifications/${id}/delivered`, {});
  }

  markNotificationAsRead(id: number): Observable<PlanNotificationDto> {
    return this.http.post<PlanNotificationDto>(`/api/notifications/${id}/read`, {});
  }
}
