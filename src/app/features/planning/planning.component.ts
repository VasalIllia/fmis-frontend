import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, OnInit, signal, HostListener, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PlanningService } from './services/planning.service';
import { ToastService } from '../../core/services/toast.service';
import { PlanItemDto, PlanItemStatus, PlanItemPriority, PlanItemSourceType } from './models/planning.models';
import { PlanItemFormComponent } from './components/plan-item-form/plan-item-form.component';
import { PLANNING_SOURCE_OPTIONS } from '../../shared/constants/finance.constants';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PlanItemFormComponent, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, PaginationComponent, ConfirmModalComponent],
  templateUrl: './planning.component.html'
})
export class PlanningComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private planningService = inject(PlanningService);
  private toastService = inject(ToastService);

  items = signal<PlanItemDto[]>([]);
  loading = signal<boolean>(true);
  showFilters = signal<boolean>(false);
  filterForm!: FormGroup;

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);
  activeMobileMenuId = signal<number | null>(null);
  expandedItemId = signal<number | null>(null);

  isFormDrawerOpen = signal<boolean>(false);
  editingItemId = signal<number | null>(null);

  isDeleteConfirmOpen = signal<boolean>(false);
  itemToDelete = signal<PlanItemDto | null>(null);
  submittingDelete = signal<boolean>(false);

  sourceOptions = PLANNING_SOURCE_OPTIONS;

  @HostListener('document:click')
  onDocumentClick() {
    this.activeMobileMenuId.set(null);
  }

  toggleMobileMenu(id: number, event: Event) {
    event.stopPropagation();
    this.activeMobileMenuId.set(this.activeMobileMenuId() === id ? null : id);
  }

  toggleExpandItem(id: number, event: Event) {
    event.stopPropagation();
    this.expandedItemId.set(this.expandedItemId() === id ? null : id);
  }

  ngOnInit() {
    this.initFilterForm();
    this.loadPlanItems();

    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.pageNumber.set(1);
      this.loadPlanItems();
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
      Status: [null],
      Priority: [null],
      SourceType: [null],
      DateFrom: [null],
      DateTo: [null]
    });
  }

  loadPlanItems() {
    this.loading.set(true);
    const filters = this.filterForm.value;
    const query = {
      Search: filters.Search || undefined,
      Status: filters.Status || undefined,
      Priority: filters.Priority || undefined,
      SourceType: filters.SourceType || undefined,
      DateFrom: filters.DateFrom || undefined,
      DateTo: filters.DateTo || undefined,
      PageNumber: this.pageNumber(),
      PageSize: this.pageSize()
    };

    this.planningService.getPlanItems(query).subscribe({
      next: (res) => {
        this.items.set(res.items || []);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        
        this.loading.set(false);
      }
    });
  }

  changePage(page: number) {
    this.pageNumber.set(page);
    this.loadPlanItems();
  }

  openCreateDrawer() {
    this.editingItemId.set(null);
    this.isFormDrawerOpen.set(true);
  }

  openEditDrawer(id: number) {
    this.editingItemId.set(id);
    this.isFormDrawerOpen.set(true);
  }

  closeCreateDrawer() {
    this.isFormDrawerOpen.set(false);
    this.editingItemId.set(null);
  }

  onItemSaved() {
    this.closeCreateDrawer();
    this.loadPlanItems();
  }

  onStatusChange(item: PlanItemDto, event: Event) {
    const target = event.target as HTMLSelectElement;
    const newStatus = target.value as PlanItemStatus;

    this.planningService.updatePlanItem(item.id, { status: newStatus }).subscribe({
      next: () => {
        this.toastService.success('Статус завдання успішно оновлено');
        this.loadPlanItems();
      },
      error: (err) => {
        
        this.toastService.danger(err);

        target.value = item.status;
      }
    });
  }

  confirmDelete(item: PlanItemDto) {
    this.itemToDelete.set(item);
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
    this.itemToDelete.set(null);
  }

  onDelete() {
    const item = this.itemToDelete();
    if (!item) return;

    this.submittingDelete.set(true);
    this.planningService.deletePlanItem(item.id).subscribe({
      next: () => {
        this.toastService.success('Завдання вилучено');
        this.closeDeleteConfirm();
        this.submittingDelete.set(false);
        this.loadPlanItems();
      },
      error: (err) => {
        
        this.submittingDelete.set(false);
      }
    });
  }

  hasActiveFilters(): boolean {
    const vals = this.filterForm.value;
    return !!(vals.Search || vals.Status || vals.Priority || vals.SourceType ||
              vals.DateFrom || vals.DateTo);
  }

  clearFilters() {
    this.filterForm.reset({
      Search: '',
      Status: null,
      Priority: null,
      SourceType: null,
      DateFrom: null,
      DateTo: null
    });
  }

  getPriorityLabel(val: PlanItemPriority): string {
    if (val === 'Low') return 'Низький';
    if (val === 'High') return 'Високий';
    return 'Звичайний';
  }

  getPriorityClass(val: PlanItemPriority): string {
    if (val === 'Low') return 'badge bg-secondary text-white';
    if (val === 'High') return 'badge bg-danger text-white';
    return 'badge bg-warning text-dark';
  }

  getSourceLabel(val: PlanItemSourceType): string {
    const opt = this.sourceOptions.find(o => o.value === val);
    return opt ? opt.label : val;
  }

  getStatusSelectClass(val: PlanItemStatus): string {
    switch (val) {
      case 'Done': return 'bg-success-subtle text-success border-success-subtle';
      case 'InProgress': return 'bg-info-subtle text-info border-info-subtle';
      case 'Cancelled': return 'bg-danger-subtle text-danger border-danger-subtle';
      default: return 'bg-light text-dark border-secondary-subtle';
    }
  }
}