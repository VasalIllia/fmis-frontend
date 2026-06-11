import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GardensService } from '../../services/gardens.service';
import { ToastService } from '../../../../core/services/toast.service';
import { GardenDto, GardenHarvestDto, GardenType } from '../../models/gardens.models';
import { GARDEN_TYPE_OPTIONS } from '../../../../shared/constants/garden.constants';

@Component({
  selector: 'app-garden-harvest-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './garden-harvest-form.component.html'
})
export class GardenHarvestFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private gardensService = inject(GardensService);
  private toastService = inject(ToastService);

  @Input() harvestId: number | null = null;
  @Input() selectedGarden: GardenDto | null = null; // Context

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  harvestForm!: FormGroup;
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  activeGardens = signal<GardenDto[]>([]);
  gardenPage = 1;
  hasMoreGardens = signal<boolean>(true);
  loadingMoreGardens = signal<boolean>(false);

  unitOptions = [
    { value: 'Kilogram', label: 'Кілограм (кг)' },
    { value: 'Ton', label: 'Тонна (т)' },
    { value: 'Piece', label: 'Штука (шт)' },
  ];

  typeOptions = GARDEN_TYPE_OPTIONS;

  ngOnInit() {
    this.initForm();
    if (!this.selectedGarden) {
      this.loadActiveGardens();
    } else {
      this.harvestForm.patchValue({
        gardenId: this.selectedGarden.id
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
      gardenId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      usedQuantity: [{ value: 0, disabled: false }, [Validators.required, Validators.min(0)]],
      unit: ['Kilogram', Validators.required],
      harvestDate: [new Date().toISOString().substring(0, 10), Validators.required],
      description: ['']
    });
  }

  getSelectedGardenName(): string | null {
    const id = this.harvestForm.get('gardenId')?.value;
    if (!id) return null;
    const garden = this.activeGardens().find(g => g.id === id);
    if (!garden) return `Посадка #${id}`;
    return `${garden.name} · ${this.getTypeLabel(garden.type)} (${garden.plantingDate.substring(0, 4)})`;
  }

  loadActiveGardens(append = false) {
    if (this.loadingMoreGardens()) return;
    if (!append) {
      this.loading.set(true);
    }
    this.loadingMoreGardens.set(true);

    this.gardensService.getGardens({ PageNumber: this.gardenPage, PageSize: 10 }).subscribe({
      next: (res: any) => {
        const sourceItems = res.items || [];
        this.activeCrops(sourceItems, append);
        this.hasMoreGardens.set(this.gardenPage < (res.totalPages || 1) && sourceItems.length >= 10);
        this.loadingMoreGardens.set(false);
      },
      error: (err: any) => {
        
        this.loadingMoreGardens.set(false);
        this.loading.set(false);
        this.close.emit();
      }
    });
  }

  loadMoreGardens() {
    this.gardenPage++;
    this.loadActiveGardens(true);
  }

  activeCrops(items: GardenDto[], append = false) {
    const filtered = items.filter(g => g.status !== 'Failed');
    this.activeGardens.set(append ? [...this.activeGardens(), ...filtered] : filtered);
    if (!append && this.harvestId) {
      this.loadHarvest();
    } else if (!append) {
      this.loading.set(false);
    }
  }

  loadHarvest() {
    this.gardensService.getHarvestById(this.harvestId!).subscribe({
      next: (harvest: any) => {
        this.harvestForm.patchValue({
          gardenId: harvest.gardenId,
          quantity: harvest.quantity,
          usedQuantity: harvest.usedQuantity,
          unit: harvest.unit,
          harvestDate: harvest.harvestDate ? harvest.harvestDate.substring(0, 10) : '',
          description: harvest.description
        });
        this.ensureGardenLoaded(harvest.gardenId);
        this.loading.set(false);
      },
      error: (err: any) => {
        
        this.loading.set(false);
        this.close.emit();
      }
    });
  }

  ensureGardenLoaded(gardenId: number) {
    if (this.activeGardens().some(g => g.id === gardenId)) return;

    this.gardensService.getGardenById(gardenId).subscribe({
      next: (garden) => {
        if (garden.status !== 'Failed') {
          this.activeGardens.set([garden, ...this.activeGardens()]);
        }
      },
      error: () => {}
    });
  }

  onSubmit() {
    if (this.harvestForm.invalid) return;

    this.submitting.set(true);
    const formVal = { ...this.harvestForm.value };
    formVal.gardenId = Number(formVal.gardenId);
    formVal.quantity = Number(formVal.quantity);
    formVal.usedQuantity = Number(formVal.usedQuantity);

    if (this.harvestId) {
      this.gardensService.updateHarvest(this.harvestId, formVal).subscribe({
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
      this.gardensService.createHarvest(formVal).subscribe({
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

  getTypeLabel(val: GardenType): string {
    const matched = this.typeOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getUnitLabel(val: string): string {
    if (val === 'Piece') return 'шт';
    if (val === 'Ares') return 'а';
    if (val === 'Kilogram') return 'кг';
    return val;
  }
}
