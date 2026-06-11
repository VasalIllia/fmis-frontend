import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, OnInit, inject, signal, HostListener, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CropsService } from '../services/crops.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { HarvestFormComponent } from '../components/harvest-form/harvest-form.component';
import { CROP_TYPE_OPTIONS, CROP_HARVEST_UNIT_OPTIONS } from '../../../shared/constants/crop.constants';

@Component({
  selector: 'app-crop-harvests',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PaginationComponent, ConfirmModalComponent, EmptyStateComponent, LoadingSpinnerComponent, HarvestFormComponent],
  templateUrl: './crop-harvests.component.html'
})
export class CropHarvestsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private cropsService = inject(CropsService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);

  typeOptions = CROP_TYPE_OPTIONS;
  unitOptions = CROP_HARVEST_UNIT_OPTIONS;

  activeCrops = signal<any[]>([]);
  harvests = signal<any[]>([]);
  loading = signal<boolean>(true);
  filterForm!: FormGroup;

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

  cropPage = 1;
  hasMoreCrops = signal<boolean>(true);
  loadingMoreCrops = signal<boolean>(false);

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
    this.applyRouteFilters();
    this.loadActiveCrops();
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
      CropId: [null],
      Unit: [null],
      HarvestDateFrom: [null],
      HarvestDateTo: [null]
    });
  }

  applyRouteFilters() {
    const cropId = this.route.snapshot.queryParamMap.get('CropId');
    if (!cropId) return;

    const parsedCropId = Number(cropId);
    if (!Number.isFinite(parsedCropId)) return;

    this.filterForm.patchValue({ CropId: parsedCropId }, { emitEvent: false });
    this.ensureCropLoaded(parsedCropId);
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

  getSelectedCropName(): string | null {
    const id = this.filterForm.get('CropId')?.value;
    if (!id) return null;
    const crop = this.activeCrops().find(c => c.id === id);
    if (!crop) return `Посів #${id}`;
    return `${crop.name} · ${this.getTypeLabel(crop.type)} (${crop.sowingDate.substring(0, 4)})`;
  }

  loadActiveCrops(append = false) {
    if (this.loadingMoreCrops()) return;
    this.loadingMoreCrops.set(true);

    this.cropsService.getCrops({ PageNumber: this.cropPage, PageSize: 10, Statuses: ['Growing', 'Harvesting'] } as any).subscribe({
      next: (res: any) => {
        const sourceItems = res.items || [];
        this.activeCrops.set(append ? [...this.activeCrops(), ...sourceItems] : sourceItems);
        this.hasMoreCrops.set(this.cropPage < (res.totalPages || 1) && sourceItems.length >= 10);
        this.loadingMoreCrops.set(false);
      },
      error: () => this.loadingMoreCrops.set(false)
    });
  }

  loadMoreCrops() {
    this.cropPage++;
    this.loadActiveCrops(true);
  }

  ensureCropLoaded(cropId: number) {
    if (this.activeCrops().some(c => c.id === cropId)) return;

    this.cropsService.getCropById(cropId).subscribe({
      next: (crop) => {
        if (!this.activeCrops().some(c => c.id === cropId)) {
          this.activeCrops.set([crop, ...this.activeCrops()]);
        }
      },
      error: () => {}
    });
  }

  loadHarvests() {
    this.loading.set(true);
    const filters = this.filterForm.value;
    const query: any = {
      Search: filters.Search || undefined,
      CropId: filters.CropId || undefined,
      Unit: filters.Unit || undefined,
      HarvestDateFrom: filters.HarvestDateFrom || undefined,
      HarvestDateTo: filters.HarvestDateTo || undefined,
      PageNumber: this.pageNumber(),
      PageSize: this.pageSize()
    };

    this.cropsService.getHarvests(query).subscribe({
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

    this.cropsService.sellHarvest(harv.id, formVal).subscribe({
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
    this.cropsService.deleteHarvest(harvest.id).subscribe({
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
