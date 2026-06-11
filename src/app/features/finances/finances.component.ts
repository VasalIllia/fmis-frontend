import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, OnInit, signal, HostListener, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FinancesService } from './services/finances.service';
import { StatisticsService } from '../statistics/services/statistics.service';
import { ToastService } from '../../core/services/toast.service';
import { FinancialRecordDto, FinancialRecordKind, FinancialRecordType } from './models/finances.models';
import { FarmModuleType } from '../animals/models/animals.models';
import { FinanceFormComponent } from './components/finance-form/finance-form.component';
import { FINANCE_MODULE_OPTIONS, FINANCE_TYPE_OPTIONS } from '../../shared/constants/finance.constants';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FinanceFormComponent, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, PaginationComponent, ConfirmModalComponent],
  templateUrl: './finances.component.html'
})
export class FinancesComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private financesService = inject(FinancesService);
  private statisticsService = inject(StatisticsService);
  private toastService = inject(ToastService);

  records = signal<FinancialRecordDto[]>([]);
  loading = signal<boolean>(true);
  showFilters = signal<boolean>(false);
  filterForm!: FormGroup;

  currentYear = 2026;

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);
  activeMobileMenuId = signal<number | null>(null);
  expandedRecordId = signal<number | null>(null);

  totalIncome = signal<number>(0);
  totalExpenses = signal<number>(0);
  netBalance = signal<number>(0);

  isFormDrawerOpen = signal<boolean>(false);
  editingRecordId = signal<number | null>(null);

  isDeleteConfirmOpen = signal<boolean>(false);
  recordToDelete = signal<FinancialRecordDto | null>(null);
  submittingDelete = signal<boolean>(false);

  moduleOptions = FINANCE_MODULE_OPTIONS;
  typeOptions = FINANCE_TYPE_OPTIONS;

  @HostListener('document:click')
  onDocumentClick() {
    this.activeMobileMenuId.set(null);
  }

  toggleMobileMenu(id: number, event: Event) {
    event.stopPropagation();
    this.activeMobileMenuId.set(this.activeMobileMenuId() === id ? null : id);
  }

  toggleExpandRecord(id: number, event: Event) {
    event.stopPropagation();
    this.expandedRecordId.set(this.expandedRecordId() === id ? null : id);
  }

  ngOnInit() {
    this.initFilterForm();
    this.loadFinances();

    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.pageNumber.set(1);
      this.loadFinances();
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
      Kind: [null],
      ModuleType: [null],
      Year: [this.currentYear],
      IncludeAllYears: [true]
    });
  }

  loadFinances() {
    this.loading.set(true);
    const filters = this.filterForm.value;

    const tableQuery = {
      Search: filters.Search,
      Kind: filters.Kind || undefined,
      ModuleType: filters.ModuleType || undefined,
      Year: (!filters.IncludeAllYears && filters.Year) ? Number(filters.Year) : undefined,
      IncludeAllYears: filters.IncludeAllYears || undefined,
      PageNumber: this.pageNumber(),
      PageSize: this.pageSize()
    };

    // For stats: always pass a year — server requires it.
    // When "all time" is selected, use the current year as default so the server doesn't error.
    const statsYear = (!filters.IncludeAllYears && filters.Year)
      ? Number(filters.Year)
      : this.currentYear;

    forkJoin({
      table: this.financesService.getFinances(tableQuery),
      stats: this.statisticsService.getFinanceStatistics(statsYear)
    }).subscribe({
      next: ({ table, stats }) => {
        this.records.set(table.items || []);
        this.totalCount.set(table.totalCount || 0);
        this.totalPages.set(table.totalPages || 0);

        // Totals from the statistics endpoint — accurate across ALL records, not just the current page
        this.totalIncome.set(stats.incomeAmount ?? 0);
        this.totalExpenses.set(stats.expenseAmount ?? 0);
        this.netBalance.set(stats.netAmount ?? 0);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openCreateDrawer() {
    this.editingRecordId.set(null);
    this.isFormDrawerOpen.set(true);
  }

  openEditDrawer(id: number) {
    this.editingRecordId.set(id);
    this.isFormDrawerOpen.set(true);
  }

  closeCreateDrawer() {
    this.isFormDrawerOpen.set(false);
    this.editingRecordId.set(null);
  }

  onRecordSaved() {
    this.closeCreateDrawer();
    this.loadFinances();
  }

  confirmDelete(record: FinancialRecordDto) {
    this.recordToDelete.set(record);
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
    this.recordToDelete.set(null);
  }

  onDelete() {
    const rec = this.recordToDelete();
    if (!rec) return;

    this.submittingDelete.set(true);
    this.financesService.deleteFinance(rec.id).subscribe({
      next: () => {
        this.toastService.success('Запис вилучено');
        this.closeDeleteConfirm();
        this.submittingDelete.set(false);
        this.loadFinances();
      },
      error: () => {
        this.submittingDelete.set(false);
      }
    });
  }

  showAllYears() {
    this.filterForm.patchValue({ IncludeAllYears: true });
  }

  hasActiveFilters(): boolean {
    const vals = this.filterForm.value;
    return !!(vals.Search || vals.Kind || vals.ModuleType || (!vals.IncludeAllYears && vals.Year));
  }

  clearFilters() {
    this.filterForm.reset({
      Search: '',
      Kind: null,
      ModuleType: null,
      Year: this.currentYear,
      IncludeAllYears: true
    });
  }

  changePage(page: number) {
    this.pageNumber.set(page);
    this.loadFinances();
  }

  getTypeLabel(val: FinancialRecordType): string {
    const matched = this.typeOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getModuleLabel(val: FarmModuleType): string {
    const matched = this.moduleOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }
}