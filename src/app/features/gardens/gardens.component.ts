import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, OnInit, signal, HostListener, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { GardensService } from './services/gardens.service';
import { ToastService } from '../../core/services/toast.service';
import { GardenDto, GardenStatus, GardenType } from './models/gardens.models';
import { FarmLocationDto } from '../animals/models/animals.models';
import { GardenFormComponent } from './components/garden-form/garden-form.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { GARDEN_TYPE_OPTIONS, GARDEN_STATUS_OPTIONS, GARDEN_UNIT_OPTIONS } from '../../shared/constants/garden.constants';

@Component({
  selector: 'app-gardens',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, GardenFormComponent, PaginationComponent, ConfirmModalComponent, EmptyStateComponent, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './gardens.component.html'
})
export class GardensComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private gardensService = inject(GardensService);
  private toastService = inject(ToastService);

  gardens = signal<GardenDto[]>([]);
  locations = signal<FarmLocationDto[]>([]);
  loading = signal<boolean>(true);
  showFilters = signal<boolean>(false);
  filterForm!: FormGroup;

  currentYear = new Date().getFullYear();

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);
  activeMobileMenuId = signal<number | null>(null);

  isFormDrawerOpen = signal<boolean>(false);
  editingGardenId = signal<number | null>(null);

  isDeleteConfirmOpen = signal<boolean>(false);
  gardenToDelete = signal<GardenDto | null>(null);
  submittingDelete = signal<boolean>(false);

  @HostListener('document:click')
  onDocumentClick() {
    this.activeMobileMenuId.set(null);
  }

  toggleMobileMenu(id: number, event: Event) {
    event.stopPropagation();
    this.activeMobileMenuId.set(this.activeMobileMenuId() === id ? null : id);
  }

  typeOptions = GARDEN_TYPE_OPTIONS;
  statusOptions = GARDEN_STATUS_OPTIONS;
  unitOptions = GARDEN_UNIT_OPTIONS;

  ngOnInit() {
    this.initFilterForm();
    this.loadLocations();
    this.loadGardens();

    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.pageNumber.set(1);
      this.loadGardens();
    });
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  onSearchInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.filterForm.patchValue({ Search: inputElement.value });
  }

  initFilterForm() {
    this.filterForm = this.fb.group({
      Search: [''],
      LocationId: [null],
      Type: [null],
      Status: [null],
      Year: [this.currentYear],
      IncludeAllYears: [true]
    });
  }

  loadLocations() {
    this.gardensService.getGardenLocations().subscribe({
      next: (res) => this.locations.set(res.items || []),
      error: () => {}});
  }

  loadGardens() {
    this.loading.set(true);
    const filters = this.filterForm.value;
    const query = {
      Search: filters.Search,
      LocationId: filters.LocationId || undefined,
      Type: filters.Type || undefined,
      Status: filters.Status || undefined,
      Year: (!filters.IncludeAllYears && filters.Year) ? Number(filters.Year) : undefined,
      PageNumber: this.pageNumber(),
      PageSize: this.pageSize()
    };

    this.gardensService.getGardens(query).subscribe({
      next: (res) => {
        this.gardens.set(res.items || []);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        
        this.loading.set(false);
      }
    });
  }

  openCreateDrawer() {
    this.editingGardenId.set(null);
    this.isFormDrawerOpen.set(true);
  }

  openEditDrawer(id: number) {
    this.editingGardenId.set(id);
    this.isFormDrawerOpen.set(true);
  }

  closeCreateDrawer() {
    this.isFormDrawerOpen.set(false);
    this.editingGardenId.set(null);
  }

  onGardenSaved() {
    this.closeCreateDrawer();
    this.loadGardens();
  }

  confirmDelete(garden: GardenDto) {
    this.gardenToDelete.set(garden);
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
    this.gardenToDelete.set(null);
  }

  onDelete() {
    const garden = this.gardenToDelete();
    if (!garden) return;

    this.submittingDelete.set(true);
    this.gardensService.deleteGarden(garden.id).subscribe({
      next: () => {
        this.toastService.success('Посадку вилучено');
        this.closeDeleteConfirm();
        this.submittingDelete.set(false);
        this.loadGardens();
      },
      error: (err) => {
        
        this.submittingDelete.set(false);
      }
    });
  }

  hasActiveFilters(): boolean {
    const vals = this.filterForm.value;
    const hasYearFilter = !vals.IncludeAllYears && !!vals.Year;
    return !!(vals.Search || vals.LocationId || vals.Type || vals.Status || hasYearFilter);
  }

  clearFilters() {
    this.filterForm.reset({
      Search: '',
      LocationId: null,
      Type: null,
      Status: null,
      PlantingDateTo: '',
      IncludeAllYears: true
    });
  }

  changePage(page: number) {
    this.pageNumber.set(page);
    this.loadGardens();
  }

  getTypeLabel(val: GardenType): string {
    const matched = this.typeOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getStatusLabel(val: GardenStatus): string {
    const matched = this.statusOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getUnitLabel(val: string): string {
    const matched = this.unitOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getStatusClass(val: GardenStatus): string {
    switch (val) {
      case 'Growing': return 'badge bg-info text-white';
      case 'Planned': return 'badge bg-secondary text-white';
      case 'Active': return 'badge bg-success text-white';
      case 'Dormant': return 'badge bg-warning text-dark';
      case 'Failed': return 'badge bg-danger text-white';
      default: return 'badge bg-secondary';
    }
  }

  getLocationName(id: number | null): string {
    if (!id) return '—';
    const loc = this.locations().find(l => l.id === id);
    return loc ? loc.name : `Локація #${id}`;
  }
}