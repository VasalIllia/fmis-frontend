import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { FarmService } from '../../../core/farm/farm.service';
import { PlanningService } from '../../planning/services/planning.service';
import { StatisticsService } from '../../statistics/services/statistics.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './overview.component.html'
})
export class OverviewComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private farmService = inject(FarmService);
  private planningService = inject(PlanningService);
  private statisticsService = inject(StatisticsService);

  public farm = this.farmService.currentFarm;
  public hasFarmClaim = computed(() => !!this.authService.farmId());
  public shouldShowCreateFarm = computed(() => !this.farm() && !this.hasFarmClaim());

  farmForm = this.fb.group({
    name: ['', Validators.required]
  });

  isLoading = signal(false);
  errorMessage = signal('');
  sessionRefreshMessage = signal('');

  // Dashboard stats signals
  loadingStats = signal<boolean>(true);
  totalAnimals = signal<number | null>(null);
  totalCrops = signal<number | null>(null);
  totalGardens = signal<number | null>(null);
  totalPlanned = signal<number | null>(null);
  totalUnreadAlerts = signal<number | null>(null);
  financialBalance = signal<number | null>(null);

  ngOnInit() {
    if (this.authService.farmId()) {
      this.loadDashboardStats();
    }

    // Subscribe to farm changes
    this.farmService.getFarm().subscribe({
      next: () => {
        if (this.authService.farmId()) {
          this.loadDashboardStats();
        }
      }
    });
  }

  loadDashboardStats() {
    if (!this.authService.farmId()) {
      this.loadingStats.set(false);
      return;
    }
    this.loadingStats.set(true);

    forkJoin({
      stats: this.statisticsService.getOverview(new Date().getFullYear()).pipe(catchError(() => of(null))),
      planItems: this.planningService.getPlanItems({ PageSize: 1, Status: 'Planned' }).pipe(catchError(() => of(null))),
      notifications: this.planningService.getNotifications({ Status: 'Unread', PageSize: 1 }).pipe(catchError(() => of(null)))
    }).subscribe({
      next: (res) => {
        if (res.stats) {
          this.totalAnimals.set(res.stats.animals?.totalQuantity ?? 0);
          this.totalCrops.set(res.stats.crops?.totalRecordCount ?? 0);
          this.totalGardens.set(res.stats.gardens?.totalRecordCount ?? 0);
          this.financialBalance.set(res.stats.finances?.netAmount ?? 0);
        }
        if (res.planItems) {
          this.totalPlanned.set(res.planItems.totalCount);
        }
        if (res.notifications) {
          this.totalUnreadAlerts.set(res.notifications.totalCount);
        }
        this.loadingStats.set(false);
      }
    });
  }

  onCreateFarm() {
    if (this.farmForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.sessionRefreshMessage.set('');

    const name = this.farmForm.value.name!.trim();
    if (!name) {
      this.isLoading.set(false);
      this.errorMessage.set('Назва ферми обов\'язкова.');
      return;
    }

    this.farmService.createFarm({ name }).subscribe({
      next: () => {
        this.authService.initAuth().subscribe({
          next: (res) => {
            this.isLoading.set(false);

            if (res?.farmId) {
              this.sessionRefreshMessage.set('');
              this.loadDashboardStats();
              return;
            }

            this.sessionRefreshMessage.set(
              'Ферму створено. Щоб активувати доступ до модулів, вийдіть і увійдіть знову.'
            );
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set('Помилка виконання запиту. Див. сповіщення.');
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Помилка виконання запиту. Див. сповіщення.');
      }
    });
  }
}
