export type PlanItemStatus = 'Planned' | 'InProgress' | 'Done' | 'Cancelled';

export type PlanItemPriority = 'Low' | 'Normal' | 'High';

export type PlanItemSourceType = 'Manual' | 'AnimalMating' | 'Crop' | 'Garden' | 'Financial' | 'AnimalMedicalRecord';

export type NotificationStatus = 'Unread' | 'Read';

export interface PlanNotificationSummaryDto {
  id: number;
  notifyAt: string; // ISO datetime
  status: NotificationStatus;
  emailSentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  deleteAfter: string | null;
}

export interface PlanItemDto {
  id: number;
  title: string | null;
  description: string | null;
  startsAt: string; // ISO datetime
  endsAt: string | null; // ISO datetime
  status: PlanItemStatus;
  priority: PlanItemPriority;
  sourceType: PlanItemSourceType;
  sourceEntityId: number | null;
  notificationsEnabled: boolean;
  notification: PlanNotificationSummaryDto | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreatePlanItemDto {
  title: string | null;
  description: string | null;
  startsAt: string; // ISO datetime
  endsAt?: string | null; // ISO datetime
  status: PlanItemStatus;
  priority: PlanItemPriority;
  notificationsEnabled: boolean;
  notifyAt?: string | null; // ISO datetime
}

export interface UpdatePlanItemDto extends Partial<CreatePlanItemDto> {}

export interface PlanNotificationDto {
  id: number;
  planItemId: number;
  planItemTitle: string | null;
  planItemDescription: string | null;
  planStartsAt: string;
  planEndsAt: string | null;
  planStatus: PlanItemStatus;
  planPriority: PlanItemPriority;
  sourceType: PlanItemSourceType;
  sourceEntityId: number | null;
  notifyAt: string;
  status: NotificationStatus;
  emailSentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  deleteAfter: string | null;
  createdAt: string;
  updatedAt: string | null;
}
