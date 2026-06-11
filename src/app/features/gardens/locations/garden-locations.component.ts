import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GardensService } from '../services/gardens.service';
import { ToastService } from '../../../core/services/toast.service';
import { FarmLocationDto } from '../../animals/models/animals.models';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-garden-locations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ConfirmModalComponent, EmptyStateComponent, PaginationComponent, LoadingSpinnerComponent],
  templateUrl: './garden-locations.component.html'
})
export class GardenLocationsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private gardensService = inject(GardensService);
  private toastService = inject(ToastService);

  locations = signal<FarmLocationDto[]>([]);
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  
  // Pagination and filtering
  searchQuery = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);

  isModalOpen = signal<boolean>(false);
  editingLocationId = signal<number | null>(null);
  locationForm!: FormGroup;

  isDeleteConfirmOpen = signal<boolean>(false);
  locationToDelete = signal<FarmLocationDto | null>(null);

  ngOnInit() {
    this.initForm();
    this.loadLocations();
  }

  initForm() {
    this.locationForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['']
    });
  }

  loadLocations() {
    this.loading.set(true);
    this.gardensService.getGardenLocations({ 
      Search: this.searchQuery(),
      PageNumber: this.pageNumber(),
      PageSize: this.pageSize()
    }).subscribe({
      next: (res) => {
        this.locations.set(res.items || []);
        this.totalCount.set(res.totalCount || 0);
        this.totalPages.set(res.totalPages || 0);
        this.loading.set(false);
      },
      error: (err) => {
        
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.pageNumber.set(1);
    this.loadLocations();
  }
  
  changePage(page: number) {
    this.pageNumber.set(page);
    this.loadLocations();
  }

  openCreateModal() {
    this.editingLocationId.set(null);
    this.locationForm.reset();
    this.isModalOpen.set(true);
  }

  openEditModal(loc: FarmLocationDto) {
    this.editingLocationId.set(loc.id);
    this.locationForm.patchValue({
      name: loc.name,
      description: loc.description
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingLocationId.set(null);
  }

  onSubmit() {
    if (this.locationForm.invalid) return;

    this.submitting.set(true);
    const formVal = this.locationForm.value;

    if (this.editingLocationId()) {
      this.gardensService.updateLocation(this.editingLocationId()!, {
        name: formVal.name,
        description: formVal.description,
        module: 'Gardens'
      }).subscribe({
        next: () => {
          this.toastService.success('Локацію оновлено');
          this.closeModal();
          this.loadLocations();
          this.submitting.set(false);
        },
        error: (err) => {
          
          this.submitting.set(false);
        }
      });
    } else {
      this.gardensService.createGardenLocation({
        name: formVal.name,
        description: formVal.description
      }).subscribe({
        next: () => {
          this.toastService.success('Локацію створено');
          this.closeModal();
          this.loadLocations();
          this.submitting.set(false);
        },
        error: (err) => {
          
          this.submitting.set(false);
        }
      });
    }
  }

  confirmDelete(loc: FarmLocationDto) {
    this.locationToDelete.set(loc);
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
    this.locationToDelete.set(null);
  }

  onDelete() {
    const loc = this.locationToDelete();
    if (!loc) return;

    this.submitting.set(true);
    this.gardensService.deleteLocation(loc.id).subscribe({
      next: () => {
        this.toastService.success('Локацію видалено');
        this.closeDeleteConfirm();
        if (this.locations().length === 1 && this.pageNumber() > 1) {
          this.pageNumber.set(this.pageNumber() - 1);
        }
        this.loadLocations();
        this.submitting.set(false);
      },
      error: (err) => {
        
        this.submitting.set(false);
      }
    });
  }
}
