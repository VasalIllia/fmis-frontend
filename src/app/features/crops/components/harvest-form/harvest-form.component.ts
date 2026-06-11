import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CropsService } from '../../services/crops.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CropDto, CropHarvestDto, CropType } from '../../models/crops.models';
import { CROP_TYPE_OPTIONS, CROP_HARVEST_UNIT_OPTIONS } from '../../../../shared/constants/crop.constants';

@Component({
  selector: 'app-harvest-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './harvest-form.component.html'
})
export class HarvestFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cropsService = inject(CropsService);
  private toastService = inject(ToastService);

  @Input() harvestId: number | null = null;
  @Input() selectedCrop: CropDto | null = null; // Context

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  harvestForm!: FormGroup;
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  activeCrops = signal<CropDto[]>([]);
  cropPage = 1;
  hasMoreCrops = signal<boolean>(true);
  loadingMoreCrops = signal<boolean>(false);

  unitOptions = CROP_HARVEST_UNIT_OPTIONS;
  typeOptions = CROP_TYPE_OPTIONS;

  ngOnInit() {
    this.initForm();
    if (!this.selectedCrop) {
      this.loadActiveCrops();
    } else {
      this.harvestForm.patchValue({
        cropId: this.selectedCrop.id,
        // Match unit default to sowing unit if available in options, otherwise Kilogram
        unit: this.unitOptions.some(o => o.value === this.selectedCrop?.unit) ? this.selectedCrop.unit : 'Kilogram'
      });
      if (this.harvestId) {
        this.loadHarvest();
      } else {
        this.loading.set(false);
      }
    }
  }

  initForm() {
    this.harvestForm = this.fb.group({
      cropId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      usedQuantity: [{ value: 0, disabled: false }, [Validators.required, Validators.min(0)]],
      unit: ['Kilogram', Validators.required],
      harvestDate: [new Date().toISOString().substring(0, 10), Validators.required],
      description: ['']
    });
  }

  getSelectedCropName(): string | null {
    const id = this.harvestForm.get('cropId')?.value;
    if (!id) return null;
    const crop = this.activeCrops().find(c => c.id === id);
    if (!crop) return `Посів #${id}`;
    return `${crop.name} · ${this.getTypeLabel(crop.type)} (${crop.sowingDate.substring(0, 4)})`;
  }

  loadActiveCrops(append = false) {
    if (this.loadingMoreCrops()) return;
    if (!append) {
      this.loading.set(true);
    }
    this.loadingMoreCrops.set(true);

    this.cropsService.getCrops({ PageNumber: this.cropPage, PageSize: 10 }).subscribe({
      next: (res: any) => {
        // Filter active crops (Planned, Growing, Harvesting)
        const sourceItems = res.items || [];
        const newItems = sourceItems.filter((c: any) => c.status !== 'Completed' && c.status !== 'Failed');
        this.activeCrops.set(append ? [...this.activeCrops(), ...newItems] : newItems);
        this.hasMoreCrops.set(this.cropPage < (res.totalPages || 1) && sourceItems.length >= 10);
        this.loadingMoreCrops.set(false);

        if (!append && this.harvestId) {
          this.loadHarvest();
        } else if (!append) {
          this.loading.set(false);
        }
      },
      error: (err: any) => {
        
        this.loadingMoreCrops.set(false);
        this.loading.set(false);
        this.close.emit();
      }
    });
  }

  loadMoreCrops() {
    this.cropPage++;
    this.loadActiveCrops(true);
  }

  loadHarvest() {
    this.cropsService.getHarvestById(this.harvestId!).subscribe({
      next: (harvest: any) => {
        this.harvestForm.patchValue({
          cropId: harvest.cropId,
          quantity: harvest.quantity,
          usedQuantity: harvest.usedQuantity,
          unit: harvest.unit,
          harvestDate: harvest.harvestDate ? harvest.harvestDate.substring(0, 10) : '',
          description: harvest.description
        });
        this.ensureCropLoaded(harvest.cropId);
        this.loading.set(false);
      },
      error: (err: any) => {
        
        this.loading.set(false);
        this.close.emit();
      }
    });
  }

  ensureCropLoaded(cropId: number) {
    if (this.activeCrops().some(c => c.id === cropId)) return;

    this.cropsService.getCropById(cropId).subscribe({
      next: (crop) => {
        if (crop.status !== 'Completed' && crop.status !== 'Failed') {
          this.activeCrops.set([crop, ...this.activeCrops()]);
        }
      },
      error: () => {}
    });
  }

  onSubmit() {
    if (this.harvestForm.invalid) return;

    this.submitting.set(true);
    const formVal = { ...this.harvestForm.value };
    formVal.cropId = Number(formVal.cropId);
    formVal.quantity = Number(formVal.quantity);
    formVal.usedQuantity = Number(formVal.usedQuantity);

    if (this.harvestId) {
      this.cropsService.updateHarvest(this.harvestId, formVal).subscribe({
        next: () => {
          this.toastService.success('Запис врожаю оновлено');
          this.saved.emit();
          this.submitting.set(false);
        },
        error: (err: any) => {
          
          this.submitting.set(false);
        }
      });
    } else {
      this.cropsService.createHarvest(formVal).subscribe({
        next: () => {
          this.toastService.success('Врожай успішно зареєстровано');
          this.saved.emit();
          this.submitting.set(false);
        },
        error: (err: any) => {
          
          this.submitting.set(false);
        }
      });
    }
  }

  getTypeLabel(val: CropType): string {
    const matched = this.typeOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getUnitLabel(val: string): string {
    if (val === 'Ares') return 'ар';
    if (val === 'Piece') return 'шт';
    if (val === 'Kilogram') return 'кг';
    if (val === 'Ton') return 'т';
    if (val === 'Liter') return 'л';
    return val;
  }
}
