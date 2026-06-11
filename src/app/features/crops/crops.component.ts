import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, OnInit, signal, HostListener, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CropsService } from './services/crops.service';
import { ToastService } from '../../core/services/toast.service';
import { CropDto, CropStatus, CropType } from './models/crops.models';
import { FarmLocationDto } from '../animals/models/animals.models';
import { CropFormComponent } from './components/crop-form/crop-form.component';
import { CROP_TYPE_OPTIONS, CROP_STATUS_OPTIONS, CROP_UNIT_OPTIONS } from '../../shared/constants/crop.constants';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-crops',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, CropFormComponent, PageHeaderComponent, PaginationComponent, ConfirmModalComponent, EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './crops.component.html'
})
export class CropsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private cropsService = inject(CropsService);
  private toastService = inject(ToastService);

  crops = signal<CropDto[]>([]);
  locations = signal<FarmLocationDto[]>([]);
  loading = signal<boolean>(true);
  showFilters = signal<boolean>(false);
  filterForm!: FormGroup;

  currentYear = new Date().getFullYear();

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);
  locationPage = 1;
  hasMoreLocations = signal<boolean>(true);
  loadingMoreLocations = signal<boolean>(false);
  activeMobileMenuId = signal<number | null>(null);

  isFormDrawerOpen = signal<boolean>(false);
  editingCropId = signal<number | null>(null);

  isDeleteConfirmOpen = signal<boolean>(false);
  cropToDelete = signal<CropDto | null>(null);
  submittingDelete = signal<boolean>(false);

  @HostListener('document:click')
  onDocumentClick() {
    this.activeMobileMenuId.set(null);
  }

  toggleMobileMenu(id: number, event: Event) {
    event.stopPropagation();
    this.activeMobileMenuId.set(this.activeMobileMenuId() === id ? null : id);
  }

  typeOptions = CROP_TYPE_OPTIONS;
  statusOptions = CROP_STATUS_OPTIONS;
  unitOptions = CROP_UNIT_OPTIONS;

  ngOnInit() {
    this.initFilterForm();
    this.loadLocations();
    this.loadCrops();

    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.pageNumber.set(1);
      this.loadCrops();
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
      IncludeAllYears: [true],
      // Additional filter fields used in the filter drawer
      IsPlanted: [false],
      IsHarvested: [false],
      SowingDateFrom: [null]
    });
  }

  loadLocations(append = false) {
    if (this.loadingMoreLocations()) return;
    this.loadingMoreLocations.set(true);

    this.cropsService.getCropLocations({ PageNumber: this.locationPage, PageSize: 10 }).subscribe({
      next: (res) => {
        const newItems = res.items || [];
        this.locations.set(append ? [...this.locations(), ...newItems] : newItems);
        this.hasMoreLocations.set(this.locationPage < (res.totalPages || 1) && newItems.length >= 10);
        this.loadingMoreLocations.set(false);
      },
      error: () => {
        this.loadingMoreLocations.set(false);
      }
    });
  }

  loadMoreLocations() {
    this.locationPage++;
    this.loadLocations(true);
  }

  getSelectedLocationName(): string | null {
    const id = this.filterForm.get('LocationId')?.value;
    if (!id) return null;
    const loc = this.locations().find(l => l.id === Number(id));
    return loc ? loc.name : `Локація #${id}`;
  }

  loadCrops() {
    this.loading.set(true);
    const filters = this.filterForm.value;
    const query = {
      Search: filters.Search,
      LocationId: filters.LocationId || undefined,
      Type: filters.Type || undefined,
      Status: filters.Status || undefined,
      Year: (!filters.IncludeAllYears && filters.Year) ? Number(filters.Year) : undefined,
      IncludeAllYears: filters.IncludeAllYears || undefined,
      PageNumber: this.pageNumber(),
      PageSize: this.pageSize()
    };

    this.cropsService.getCrops(query).subscribe({
      next: (res) => {
        this.crops.set(res.items || []);
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
    this.editingCropId.set(null);
    this.isFormDrawerOpen.set(true);
  }

  openEditDrawer(id: number) {
    this.editingCropId.set(id);
    this.isFormDrawerOpen.set(true);
  }

  closeCreateDrawer() {
    this.isFormDrawerOpen.set(false);
    this.editingCropId.set(null);
  }

  onCropSaved() {
    this.closeCreateDrawer();
    this.loadCrops();
  }

  confirmDelete(crop: CropDto) {
    this.cropToDelete.set(crop);
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
    this.cropToDelete.set(null);
  }

  onDelete() {
    const crop = this.cropToDelete();
    if (!crop) return;

    this.submittingDelete.set(true);
    this.cropsService.deleteCrop(crop.id).subscribe({
      next: () => {
        this.toastService.success('Посів вилучено');
        this.closeDeleteConfirm();
        this.submittingDelete.set(false);
        this.loadCrops();
      },
      error: (err) => {
        
        this.submittingDelete.set(false);
      }
    });
  }

  showAllYears() {
    this.filterForm.patchValue({ IncludeAllYears: true });
  }

  hasActiveFilters(): boolean {
    const vals = this.filterForm.value;
    // IncludeAllYears=true is the DEFAULT state — not an active filter.
    // Only flag a year filter when IncludeAllYears is explicitly false.
    const hasYearFilter = !vals.IncludeAllYears && !!vals.Year;
    return !!(vals.Search || vals.LocationId || vals.Type || vals.Status || hasYearFilter);
  }

  clearFilters() {
    this.filterForm.reset({
      Search: '',
      LocationId: null,
      Type: null,
      Status: null,
      Year: this.currentYear,
      IncludeAllYears: true,
      IsPlanted: false,
      IsHarvested: false,
      SowingDateFrom: null
    });
  }

  changePage(page: number) {
    this.pageNumber.set(page);
    this.loadCrops();
  }

  getTypeLabel(val: CropType): string {
    const matched = this.typeOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getStatusLabel(val: CropStatus): string {
    const matched = this.statusOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getUnitLabel(val: string): string {
    const matched = this.unitOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getStatusClass(val: CropStatus): string {
    switch (val) {
      case 'Growing': return 'badge bg-info text-white';
      case 'Planned': return 'badge bg-secondary text-white';
      case 'Harvesting': return 'badge bg-warning text-dark';
      case 'Completed': return 'badge bg-success text-white';
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
