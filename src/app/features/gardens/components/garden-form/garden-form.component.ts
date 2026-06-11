import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GardensService } from '../../services/gardens.service';
import { ToastService } from '../../../../core/services/toast.service';
import { GardenDto, GardenStatus, GardenType } from '../../models/gardens.models';
import { FarmLocationDto, MeasurementUnit } from '../../../animals/models/animals.models';
import { GARDEN_TYPE_OPTIONS, GARDEN_STATUS_OPTIONS } from '../../../../shared/constants/garden.constants';

@Component({
  selector: 'app-garden-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './garden-form.component.html'
})
export class GardenFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private gardensService = inject(GardensService);
  private toastService = inject(ToastService);

  @Input() gardenId: number | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  gardenForm!: FormGroup;
  locationForm!: FormGroup;
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  locations = signal<FarmLocationDto[]>([]);
  isLocationModalOpen = signal<boolean>(false);
  submittingLocation = signal<boolean>(false);

  locationPage = 1;
  hasMoreLocations = signal<boolean>(true);
  loadingMoreLocations = signal<boolean>(false);

  statusOptions = GARDEN_STATUS_OPTIONS;
  typeOptions = GARDEN_TYPE_OPTIONS;

  unitOptions = [
    { value: 'Piece', label: 'Штук саджанців (шт)' },
    { value: 'Ares', label: 'Площа в арах (а)' },
    { value: 'Kilogram', label: 'Кілограми (кг)' }
  ];

  ngOnInit() {
    this.initForm();
    this.loadLocations();
  }

  initForm() {
    this.gardenForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['Apple', Validators.required],
      status: ['Growing', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unit: ['Piece', Validators.required],
      locationId: [null],
      plantingDate: [new Date().toISOString().substring(0, 10), Validators.required],
      expectedHarvestDate: ['', Validators.required],
      description: [''],
      createTaskAndNotification: [false]
    }, {
      validators: [this.dateValidator]
    });

    this.locationForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['']
    });
  }

  dateValidator(group: FormGroup) {
    const plantingVal = group.get('plantingDate')?.value;
    const expectedVal = group.get('expectedHarvestDate')?.value;

    if (plantingVal && expectedVal) {
      const plantingDate = new Date(plantingVal);
      const expectedDate = new Date(expectedVal);
      if (expectedDate < plantingDate) {
        group.get('expectedHarvestDate')?.setErrors({ invalidDate: true });
      }
    }
    return null;
  }

  loadLocations(append = false) {
    if (this.loadingMoreLocations()) return;
    this.loadingMoreLocations.set(true);

    this.gardensService.getGardenLocations({ PageNumber: this.locationPage, PageSize: 10 }).subscribe({
      next: (res: any) => {
        const newItems = res.items || [];
        if (append) {
          this.locations.set([...this.locations(), ...newItems]);
        } else {
          this.locations.set(newItems);
        }
        
        const totalPages = res.totalPages || 1;
        this.hasMoreLocations.set(this.locationPage < totalPages && newItems.length >= 10);
        this.loadingMoreLocations.set(false);

        if (!append) {
          if (this.gardenId) {
            this.loadGarden();
          } else {
            this.loading.set(false);
          }
        }
      },
      error: (err: any) => {
        
        this.loadingMoreLocations.set(false);
        if (!append) {
          this.loading.set(false);
          this.close.emit();
        }
      }
    });
  }

  loadMoreLocations() {
    this.locationPage++;
    this.loadLocations(true);
  }

  loadGarden() {
    this.gardensService.getGardenById(this.gardenId!).subscribe({
      next: (garden) => {
        this.gardenForm.patchValue({
          name: garden.name,
          type: garden.type,
          status: garden.status,
          quantity: garden.quantity,
          unit: garden.unit,
          locationId: garden.locationId,
          plantingDate: garden.plantingDate ? garden.plantingDate.substring(0, 10) : '',
          expectedHarvestDate: garden.expectedHarvestDate ? garden.expectedHarvestDate.substring(0, 10) : '',
          description: garden.description,
          createTaskAndNotification: false
        });
        this.loading.set(false);
      },
      error: (err: any) => {
        
        this.loading.set(false);
        this.close.emit();
      }
    });
  }

  onSubmit() {
    if (this.gardenForm.invalid) return;

    this.submitting.set(true);
    const formVal = { ...this.gardenForm.value };
    formVal.quantity = Number(formVal.quantity);
    if (formVal.locationId) {
      formVal.locationId = Number(formVal.locationId);
    }
    formVal.createTaskAndNotification = !!formVal.createTaskAndNotification;

    if (this.gardenId) {
      this.gardensService.updateGarden(this.gardenId, formVal).subscribe({
        next: () => {
          this.toastService.success('Запис посадки оновлено');
          this.saved.emit();
          this.submitting.set(false);
        },
        error: (err: any) => {
          
          this.submitting.set(false);
        }
      });
    } else {
      this.gardensService.createGarden(formVal).subscribe({
        next: () => {
          this.toastService.success('Посадку успішно зареєстровано');
          this.saved.emit();
          this.submitting.set(false);
        },
        error: (err: any) => {
          
          this.submitting.set(false);
        }
      });
    }
  }

  // --- Nested Location creation ---
  openLocationModal() {
    this.locationForm.reset();
    this.isLocationModalOpen.set(true);
  }

  closeLocationModal() {
    this.isLocationModalOpen.set(false);
  }

  onSubmitLocation() {
    if (this.locationForm.invalid) return;

    this.submittingLocation.set(true);
    this.gardensService.createGardenLocation(this.locationForm.value).subscribe({
      next: (newLoc: any) => {
        this.toastService.success(`Локацію "${newLoc.name}" створено`);
        this.isLocationModalOpen.set(false);
        this.submittingLocation.set(false);

        const visibleLimit = Math.max(10, this.locationPage * 10);
        this.locations.set([
          newLoc,
          ...this.locations().filter(loc => loc.id !== newLoc.id)
        ].slice(0, visibleLimit));
        this.gardenForm.patchValue({ locationId: newLoc.id });
      },
      error: (err: any) => {
        
        this.submittingLocation.set(false);
      }
    });
  }
}
