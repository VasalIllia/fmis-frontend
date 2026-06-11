import { Component, inject, OnInit, PLATFORM_ID, signal, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FarmService } from '../../core/farm/farm.service';
import { PlanningService } from '../../features/planning/services/planning.service';
import { PlanNotificationDto } from '../../features/planning/models/planning.models';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastContainerComponent } from '../toast-container/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent implements OnInit {
  public authService = inject(AuthService);
  private farmService = inject(FarmService);
  private planningService = inject(PlanningService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  public farm = this.farmService.currentFarm;
  public loadingFarm = signal<boolean>(true);
  public isMobileMenuOpen = signal<boolean>(false);

  // Notifications bell popover states
  public unreadNotifications = signal<PlanNotificationDto[]>([]);
  public unreadCount = signal<number>(0);
  public showNotificationsPopover = signal<boolean>(false);

  @HostListener('document:click')
  onDocumentClick() {
    this.showNotificationsPopover.set(false);
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      this.loadingFarm.set(false);
      return;
    }

    this.loadFarm();
  }

  loadFarm() {
    this.farmService.getFarm().subscribe({
      next: () => {
        this.loadingFarm.set(false);
        this.loadUnreadNotifications();
      },
      error: (err: HttpErrorResponse) => {
        this.loadingFarm.set(false);

        if (err.status === 404) {
          this.authService.updateFarmId(null);
          this.farmService.currentFarm.set(null);
          if (this.router.url !== '/overview') {
            this.router.navigate(['/overview']);
          }
          return;
        }

        if (err.status === 401) {
          this.authService.logout();
        }
      }
    });
  }

  loadUnreadNotifications() {
    if (!this.authService.farmId()) return;
    this.planningService.getNotifications({ Status: 'Unread', PageSize: 5 }).subscribe({
      next: (res) => {
        this.unreadNotifications.set(res.items || []);
        this.unreadCount.set(res.totalCount || 0);
      }
    });
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotificationsPopover.set(!this.showNotificationsPopover());
    if (this.showNotificationsPopover()) {
      this.loadUnreadNotifications();
    }
  }

  markAsRead(notification: PlanNotificationDto, event: Event) {
    event.stopPropagation();
    this.planningService.markNotificationAsRead(notification.id).subscribe({
      next: () => {
        this.loadUnreadNotifications();
      }
    });
  }

  openMobileMenu() {
    this.isMobileMenuOpen.set(true);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  moduleLink(path: string): string {
    return this.authService.farmId() ? path : '/overview';
  }

  logout() {
    this.closeMobileMenu();
    this.authService.logout();
  }
}
