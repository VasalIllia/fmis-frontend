import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CropsService } from '../services/crops.service';
import { ToastService } from '../../../core/services/toast.service';
import { CropDto, CropHarvestDto, CropStatus, CropType } from '../models/crops.models';
import { FarmLocationDto, SellProductRequest, MeasurementUnit } from '../../animals/models/animals.models';
import { CropFormComponent } from '../components/crop-form/crop-form.component';
import { HarvestFormComponent } from '../components/harvest-form/harvest-form.component';
import { CROP_TYPE_OPTIONS, CROP_STATUS_OPTIONS, CROP_UNIT_OPTIONS } from '../../../shared/constants/crop.constants';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-crop-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, CropFormComponent, HarvestFormComponent, ConfirmModalComponent, EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './crop-details.component.html'
})
export class CropDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cropsService = inject(CropsService);
  private toastService = inject(ToastService);

  cropId!: number;
  crop = signal<CropDto | null>(null);
  locations = signal<FarmLocationDto[]>([]);
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);

  activeTab = signal<'overview' | 'harvests'>('overview');

  // Edit Crop Drawer state
  isEditDrawerOpen = signal<boolean>(false);

  // Harvests Tab states
  harvests = signal<CropHarvestDto[]>([]);
  loadingHarvests = signal<boolean>(false);
  isHarvestDrawerOpen = signal<boolean>(false);
  editingHarvestId = signal<number | null>(null);
  isDeleteHarvestConfirmOpen = signal<boolean>(false);
  harvestToDelete = signal<CropHarvestDto | null>(null);
  submittingHarvest = signal<boolean>(false);

  // Sell Harvest state
  isSellModalOpen = signal<boolean>(false);
  sellHarvestContext = signal<CropHarvestDto | null>(null);
  submittingSell = signal<boolean>(false);
  sellForm!: FormGroup;

  isDeleteConfirmOpen = signal<boolean>(false);

  typeOptions = CROP_TYPE_OPTIONS;
  statusOptions = CROP_STATUS_OPTIONS;
  unitOptions = CROP_UNIT_OPTIONS;

  ngOnInit() {
    this.cropId = Number(this.route.snapshot.paramMap.get('id'));
    this.initSellForm();
    this.loadLocations();
    this.loadCrop();
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

  loadLocations() {
    this.cropsService.getCropLocations().subscribe({
      next: (res: any) => this.locations.set(res.items || []),
      error: () => {}});
  }

  loadCrop() {
    this.loading.set(true);
    this.cropsService.getCropById(this.cropId).subscribe({
      next: (data) => {
        this.crop.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        
        this.loading.set(false);
      }
    });
  }

  showHarvestWarning(): boolean {
    const c = this.crop();
    if (!c) return false;
    if (c.status === 'Completed' || c.status === 'Failed') return false;

    const expected = new Date(c.expectedHarvestDate);
    const today = new Date();
    // Compare date parts only
    expected.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    return today > expected;
  }

  // --- Crop Edit/Delete ---
  openEditDrawer() {
    this.isEditDrawerOpen.set(true);
  }

  closeEditDrawer() {
    this.isEditDrawerOpen.set(false);
  }

  onCropSaved() {
    this.closeEditDrawer();
    this.loadCrop();
  }

  confirmDelete() {
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
  }

  onDelete() {
    this.submitting.set(true);
    this.cropsService.deleteCrop(this.cropId).subscribe({
      next: () => {
        this.toastService.success('Посів вилучено');
        this.closeDeleteConfirm();
        this.submitting.set(false);
        this.router.navigate(['/crops']);
      },
      error: (err: any) => {
        
        this.submitting.set(false);
      }
    });
  }

  // --- Harvests controls ---
  loadHarvests() {
    this.loadingHarvests.set(true);
    this.cropsService.getHarvests({ CropId: this.cropId, PageSize: 100 }).subscribe({
      next: (res: any) => {
        this.harvests.set(res.items || []);
        this.loadingHarvests.set(false);
      },
      error: (err: any) => {
        
        this.loadingHarvests.set(false);
      }
    });
  }

  openHarvestDrawer(harvestId: number | null = null) {
    this.editingHarvestId.set(harvestId);
    this.isHarvestDrawerOpen.set(true);
  }

  closeHarvestDrawer() {
    this.isHarvestDrawerOpen.set(false);
    this.editingHarvestId.set(null);
  }

  onHarvestSaved() {
    this.closeHarvestDrawer();
    this.loadHarvests();
    this.loadCrop(); // Refresh crop status/flags (like isHarvested)
  }

  confirmDeleteHarvest(harvest: CropHarvestDto) {
    this.harvestToDelete.set(harvest);
    this.isDeleteHarvestConfirmOpen.set(true);
  }

  closeDeleteHarvestConfirm() {
    this.isDeleteHarvestConfirmOpen.set(false);
    this.harvestToDelete.set(null);
  }

  onDeleteHarvest() {
    const harv = this.harvestToDelete();
    if (!harv) return;

    this.submittingHarvest.set(true);
    this.cropsService.deleteHarvest(harv.id).subscribe({
      next: () => {
        this.toastService.success('Запис врожаю видалено');
        this.closeDeleteHarvestConfirm();
        this.submittingHarvest.set(false);
        this.loadHarvests();
        this.loadCrop();
      },
      error: (err: any) => {
        
        this.submittingHarvest.set(false);
      }
    });
  }

  // --- Sell Harvest ---
  openSellModal(harvest: CropHarvestDto) {
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

  // --- Translation Helpers ---
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
