import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlanningService } from '../services/planning.service';
import { ToastService } from '../../../core/services/toast.service';
import { PlanNotificationDto, NotificationStatus } from '../models/planning.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { PLANNING_SOURCE_OPTIONS } from '../../../shared/constants/finance.constants';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, PaginationComponent],
  templateUrl: './notifications-page.component.html'
})
export class NotificationsPageComponent implements OnInit {
  private planningService = inject(PlanningService);
  private toastService = inject(ToastService);

  notifications = signal<PlanNotificationDto[]>([]);
  loading = signal<boolean>(true);
  filterStatus = signal<NotificationStatus | null>(null);
  submittingId = signal<number | null>(null);

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);

  sourceOptions = PLANNING_SOURCE_OPTIONS;

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading.set(true);
    const query = {
      Status: this.filterStatus() || undefined,
      PageNumber: this.pageNumber(),
      PageSize: this.pageSize()
    };

    this.planningService.getNotifications(query).subscribe({
      next: (res) => {
        this.notifications.set(res.items || []);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        
        this.loading.set(false);
      }
    });
  }

  setFilter(status: NotificationStatus | null) {
    this.filterStatus.set(status);
    this.pageNumber.set(1);
    this.loadNotifications();
  }

  changePage(page: number) {
    this.pageNumber.set(page);
    this.loadNotifications();
  }

  markRead(note: PlanNotificationDto) {
    this.submittingId.set(note.id);
    this.planningService.markNotificationAsRead(note.id).subscribe({
      next: () => {
        this.toastService.success('Позначено як прочитане');
        this.submittingId.set(null);
        this.loadNotifications();
      },
      error: (err) => {
        
        this.submittingId.set(null);
      }
    });
  }

  getSourceLabel(val: string): string {
    const opt = this.sourceOptions.find(o => o.value === val);
    return opt ? opt.label : val;
  }
}
