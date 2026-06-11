import { Component, inject, OnInit, PLATFORM_ID, signal, TemplateRef } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { FarmService } from '../../core/farm/farm.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { ChangePasswordDialogComponent } from './change-password-dialog.component';
import { FormsModule } from '@angular/forms';
import { FarmDto } from '../../core/farm/farm.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  providers: [],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private farmService = inject(FarmService);
  private router = inject(Router);
  private dialog = inject(Dialog);
  private platformId = inject(PLATFORM_ID);

  // For simple inline modals we use a visible flag + ref to close
  showChangeName = false;
  showDeleteFarm = false;

  email = signal<string>('Завантаження...');
  isEmailConfirmed = signal<boolean>(false);

  farm = signal<FarmDto | null>(null);
  newFarmName = signal<string>('');

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.authService.getInfo().subscribe({
      next: (info) => {
        this.email.set(info.email);
        this.isEmailConfirmed.set(info.isEmailConfirmed);
      }
    });

    this.farmService.getFarm().subscribe({
      next: (f) => {
        this.farm.set(f);
      }
    });
  }

  openChangePasswordDialog() {
    this.dialog.open(ChangePasswordDialogComponent, {
      panelClass: ['modal-dialog-centered', 'cdk-dialog-panel']
    });
  }

  openChangeFarmNameModal(template?: TemplateRef<any>) {
    if (this.farm()) {
      this.newFarmName.set(this.farm()!.name);
    }
    this.showChangeName = true;
  }

  closeChangeName() {
    this.showChangeName = false;
  }

  saveFarmName() {
    const f = this.farm();
    if (f && this.newFarmName().trim()) {
      this.farmService.updateFarm(this.newFarmName().trim()).subscribe({
        next: (updated) => {
          this.farm.set(updated);
          this.showChangeName = false;
        },
        error: () => {
          alert('Помилка при зміні назви ферми');
        }
      });
    }
  }

  openDeleteFarmModal(template?: TemplateRef<any>) {
    this.showDeleteFarm = true;
  }

  closeDeleteFarm() {
    this.showDeleteFarm = false;
  }

  confirmDeleteFarm() {
    const f = this.farm();
    if (f) {
      this.farmService.deleteFarm().subscribe({
        next: () => {
          this.showDeleteFarm = false;
          this.authService.updateFarmId(null);
          this.router.navigate(['/overview']);
        },
        error: () => {
          alert('Помилка при видаленні ферми');
        }
      });
    }
  }
}
