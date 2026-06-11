import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GardensService } from '../services/gardens.service';
import { ToastService } from '../../../core/services/toast.service';
import { GardenDto, GardenHarvestDto, GardenStatus, GardenType } from '../models/gardens.models';
import { FarmLocationDto, SellProductRequest } from '../../animals/models/animals.models';
import { GardenFormComponent } from '../components/garden-form/garden-form.component';
import { GardenHarvestFormComponent } from '../components/harvest-form/garden-harvest-form.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { GARDEN_TYPE_OPTIONS, GARDEN_STATUS_OPTIONS, GARDEN_UNIT_OPTIONS } from '../../../shared/constants/garden.constants';

@Component({
  selector: 'app-garden-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, GardenFormComponent, GardenHarvestFormComponent, ConfirmModalComponent, LoadingSpinnerComponent],
  templateUrl: './garden-details.component.html'
})
export class GardenDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private gardensService = inject(GardensService);
  private toastService = inject(ToastService);

  gardenId!: number;
  garden = signal<GardenDto | null>(null);
  locations = signal<FarmLocationDto[]>([]);
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);

  activeTab = signal<'overview' | 'harvests'>('overview');

  // Edit Garden Drawer state
  isEditDrawerOpen = signal<boolean>(false);

  // Harvests Tab states
  harvests = signal<GardenHarvestDto[]>([]);
  loadingHarvests = signal<boolean>(false);
  isHarvestDrawerOpen = signal<boolean>(false);
  editingHarvestId = signal<number | null>(null);
  isDeleteHarvestConfirmOpen = signal<boolean>(false);
  harvestToDelete = signal<GardenHarvestDto | null>(null);
  submittingHarvest = signal<boolean>(false);

  // Sell Harvest state
  isSellModalOpen = signal<boolean>(false);
  sellHarvestContext = signal<GardenHarvestDto | null>(null);
  submittingSell = signal<boolean>(false);
  sellForm!: FormGroup;

  isDeleteConfirmOpen = signal<boolean>(false);

  typeOptions = GARDEN_TYPE_OPTIONS;
  statusOptions = GARDEN_STATUS_OPTIONS;
  unitOptions = GARDEN_UNIT_OPTIONS;

  ngOnInit() {
    this.gardenId = Number(this.route.snapshot.paramMap.get('id'));
    this.initSellForm();
    this.loadLocations();
    this.loadGarden();
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
    this.gardensService.getGardenLocations().subscribe({
      next: (res: any) => this.locations.set(res.items || []),
      error: () => {}});
  }

  loadGarden() {
    this.loading.set(true);
    this.gardensService.getGardenById(this.gardenId).subscribe({
      next: (data) => {
        this.garden.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        
        this.loading.set(false);
      }
    });
  }

  showHarvestWarning(): boolean {
    const g = this.garden();
    if (!g) return false;
    if (g.status === 'Failed' || g.status === 'Active' || g.status === 'Dormant') return false;

    const expected = new Date(g.expectedHarvestDate);
    const today = new Date();
    expected.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    return today > expected;
  }

  // --- Garden Edit/Delete ---
  openEditDrawer() {
    this.isEditDrawerOpen.set(true);
  }

  closeEditDrawer() {
    this.isEditDrawerOpen.set(false);
  }

  onGardenSaved() {
    this.closeEditDrawer();
    this.loadGarden();
  }

  confirmDelete() {
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
  }

  onDelete() {
    this.submitting.set(true);
    this.gardensService.deleteGarden(this.gardenId).subscribe({
      next: () => {
        this.toastService.success('Посадку вилучено');
        this.closeDeleteConfirm();
        this.submitting.set(false);
        this.router.navigate(['/gardens']);
      },
      error: (err: any) => {
        
        this.submitting.set(false);
      }
    });
  }

  // --- Harvests controls ---
  loadHarvests() {
    this.loadingHarvests.set(true);
    this.gardensService.getHarvests({ GardenId: this.gardenId, PageSize: 100 }).subscribe({
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
    this.loadGarden();
  }

  confirmDeleteHarvest(harvest: GardenHarvestDto) {
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
    this.gardensService.deleteHarvest(harv.id).subscribe({
      next: () => {
        this.toastService.success('Запис врожаю видалено');
        this.closeDeleteHarvestConfirm();
        this.submittingHarvest.set(false);
        this.loadHarvests();
        this.loadGarden();
      },
      error: (err: any) => {
        
        this.submittingHarvest.set(false);
      }
    });
  }

  // --- Sell Harvest ---
  openSellModal(harvest: GardenHarvestDto) {
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

  // --- Translation Helpers ---
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
