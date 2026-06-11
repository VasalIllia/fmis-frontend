import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, OnInit, inject, signal, HostListener, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GardensService } from '../services/gardens.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { GardenHarvestFormComponent } from '../components/harvest-form/garden-harvest-form.component';
import { GARDEN_TYPE_OPTIONS } from '../../../shared/constants/garden.constants';

@Component({
  selector: 'app-garden-harvests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent, ConfirmModalComponent, EmptyStateComponent, LoadingSpinnerComponent, GardenHarvestFormComponent],
  templateUrl: './garden-harvests.component.html'
})
export class GardenHarvestsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private gardensService = inject(GardensService);
  private toastService = inject(ToastService);

  typeOptions = GARDEN_TYPE_OPTIONS;

  activeGardens = signal<any[]>([]);
  harvests = signal<any[]>([]);
  loading = signal<boolean>(true);
  filterForm!: FormGroup;

  currentYear = new Date().getFullYear();

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);
  activeMobileMenuId = signal<number | null>(null);

  isHarvestModalOpen = signal<boolean>(false);
  editingHarvestId = signal<number | null>(null);

  isSellModalOpen = signal<boolean>(false);
  sellHarvestContext = signal<any | null>(null);
  submittingSell = signal<boolean>(false);
  sellForm!: FormGroup;

  isDeleteConfirmOpen = signal<boolean>(false);
  harvestToDelete = signal<any | null>(null);
  submittingDelete = signal<boolean>(false);

  gardenPage = 1;
  hasMoreGardens = signal<boolean>(true);
  loadingMoreGardens = signal<boolean>(false);

  @HostListener('document:click')
  onDocumentClick() {
    this.activeMobileMenuId.set(null);
  }

  toggleMobileMenu(id: number, event: Event) {
    event.stopPropagation();
    this.activeMobileMenuId.set(this.activeMobileMenuId() === id ? null : id);
  }

  ngOnInit() {
    this.initFilterForm();
    this.initSellForm();
    this.loadActiveGardens();
    this.loadHarvests();

    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.pageNumber.set(1);
      this.loadHarvests();
    });
  }

  onSearchInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.filterForm.patchValue({ Search: inputElement.value });
  }


  initFilterForm() {
    this.filterForm = this.fb.group({
      Search: [''],
      GardenId: [null],
      GardenType: [null], // We use GardenType conceptually like CropType
      Year: [this.currentYear],
      IncludeAllYears: [true]
    });
  }

  initSellForm() {
    this.sellForm = this.fb.group({
      quantity: [0, [Validators.required, Validators.min(0.001)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      soldAt: [new Date().toISOString().substring(0, 10), Validators.required],
      description: ['']
    }, {
      validators: [this.sellQuantityValidator.bind(this)]
    });
  }

  sellQuantityValidator(group: FormGroup) {
    const qty = group.get('quantity')?.value;
    const harv = this.sellHarvestContext();
    if (harv && qty > harv.quantity) {
      group.get('quantity')?.setErrors({ exceeded: true });
    }
    return null;
  }

  getSelectedGardenName(): string | null {
    const id = this.filterForm.get('GardenId')?.value;
    if (!id) return null;
    const garden = this.activeGardens().find(g => g.id === id);
    if (!garden) return `Посадка #${id}`;
    return `${garden.name} · ${this.getTypeLabel(garden.type)} (${garden.plantingDate.substring(0, 4)})`;
  }

  loadActiveGardens(append = false) {
    if (this.loadingMoreGardens()) return;
    this.loadingMoreGardens.set(true);

    this.gardensService.getGardens({ PageNumber: this.gardenPage, PageSize: 10, Statuses: ['Growing', 'Harvesting'] } as any).subscribe({
      next: (res: any) => {
        const sourceItems = res.items || [];
        this.activeGardens.set(append ? [...this.activeGardens(), ...sourceItems] : sourceItems);
        this.hasMoreGardens.set(this.gardenPage < (res.totalPages || 1) && sourceItems.length >= 10);
        this.loadingMoreGardens.set(false);
      },
      error: () => this.loadingMoreGardens.set(false)
    });
  }

  loadMoreGardens() {
    this.gardenPage++;
    this.loadActiveGardens(true);
  }

  loadHarvests() {
    this.loading.set(true);
    const filters = this.filterForm.value;
    const query: any = {
      Search: filters.Search,
      GardenType: filters.GardenType || undefined,
      Year: (!filters.IncludeAllYears && filters.Year) ? Number(filters.Year) : undefined,
      IncludeAllYears: filters.IncludeAllYears || undefined,
      PageNumber: this.pageNumber(),
      PageSize: this.pageSize()
    };
    if (filters.GardenId) {
      query.GardenId = filters.GardenId;
    }

    this.gardensService.getHarvests(query).subscribe({
      next: (res: any) => {
        this.harvests.set(res.items || []);
        this.totalCount.set(res.totalCount || 0);
        this.totalPages.set(res.totalPages || 0);
        this.loading.set(false);
      },
      error: (err: any) => {
        
        this.loading.set(false);
      }
    });
  }

  openHarvestModal(harvest: any | null = null) {
    this.editingHarvestId.set(harvest ? harvest.id : null);
    this.isHarvestModalOpen.set(true);
  }

  closeHarvestModal() {
    this.isHarvestModalOpen.set(false);
    this.editingHarvestId.set(null);
  }

  onHarvestSaved() {
    this.closeHarvestModal();
    this.loadHarvests();
  }

  openSellModal(harvest: any) {
    this.sellHarvestContext.set(harvest);
    this.sellForm.reset({
      quantity: harvest.quantity,
      unitPrice: 10,
      soldAt: new Date().toISOString().substring(0, 10),
      description: ''
    });
    this.isSellModalOpen.set(true);
  }

  closeSellModal() {
    this.isSellModalOpen.set(false);
    this.sellHarvestContext.set(null);
  }

  onSubmitSell() {
    if (this.sellForm.invalid) return;

    const harv = this.sellHarvestContext();
    if (!harv) return;

    this.submittingSell.set(true);
    const formVal = { ...this.sellForm.value };
    formVal.quantity = Number(formVal.quantity);
    formVal.unitPrice = Number(formVal.unitPrice);

    this.gardensService.sellHarvest(harv.id, formVal).subscribe({
      next: () => {
        this.toastService.success('Врожай успішно продано. Створено фінансовий запис.');
        this.closeSellModal();
        this.submittingSell.set(false);
        this.loadHarvests();
      },
      error: (err: any) => {
        
        this.submittingSell.set(false);
      }
    });
  }

  confirmDelete(harvest: any) {
    this.harvestToDelete.set(harvest);
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
    this.harvestToDelete.set(null);
  }

  onDelete() {
    const harvest = this.harvestToDelete();
    if (!harvest) return;

    this.submittingDelete.set(true);
    this.gardensService.deleteHarvest(harvest.id).subscribe({
      next: () => {
        this.toastService.success('Врожай вилучено');
        this.closeDeleteConfirm();
        this.submittingDelete.set(false);
        this.loadHarvests();
      },
      error: (err: any) => {
        
        this.submittingDelete.set(false);
      }
    });
  }

  showAllYears() {
    this.filterForm.patchValue({ IncludeAllYears: true });
  }

  changePage(page: number) {
    this.pageNumber.set(page);
    this.loadHarvests();
  }

  getTypeLabel(val: string): string {
    const matched = this.typeOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getUnitLabel(val: string): string {
    if (val === 'Kilogram') return 'кг';
    if (val === 'Ton') return 'т';
    if (val === 'Piece') return 'шт';
    if (val === 'Liter') return 'л';
    return val;
  }
}