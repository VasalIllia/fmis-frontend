import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CropsService } from '../../services/crops.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CropDto, CropStatus, CropType } from '../../models/crops.models';
import { FarmLocationDto, MeasurementUnit } from '../../../animals/models/animals.models';
import { CROP_TYPE_OPTIONS, CROP_STATUS_OPTIONS, CROP_UNIT_OPTIONS } from '../../../../shared/constants/crop.constants';

@Component({
  selector: 'app-crop-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crop-form.component.html'
})
export class CropFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cropsService = inject(CropsService);
  private toastService = inject(ToastService);

  @Input() cropId: number | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  cropForm!: FormGroup;
  locationForm!: FormGroup;
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  locations = signal<FarmLocationDto[]>([]);
  isLocationModalOpen = signal<boolean>(false);
  submittingLocation = signal<boolean>(false);

  locationPage = 1;
  hasMoreLocations = signal<boolean>(true);
  loadingMoreLocations = signal<boolean>(false);

  statusOptions = CROP_STATUS_OPTIONS;
  typeOptions = CROP_TYPE_OPTIONS;
  unitOptions = CROP_UNIT_OPTIONS;

  ngOnInit() {
    this.initForm();
    this.loadLocations();
  }

  initForm() {
    this.cropForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['Wheat', Validators.required],
      status: ['Growing', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unit: ['Ares', Validators.required],
      locationId: [null],
      sowingDate: [new Date().toISOString().substring(0, 10), Validators.required],
      expectedHarvestDate: ['', Validators.required],
      isPlanted: [true],
      isHarvested: [false],
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
    const sowingVal = group.get('sowingDate')?.value;
    const expectedVal = group.get('expectedHarvestDate')?.value;

    if (sowingVal && expectedVal) {
      const sowingDate = new Date(sowingVal);
      const expectedDate = new Date(expectedVal);
      if (expectedDate < sowingDate) {
        group.get('expectedHarvestDate')?.setErrors({ invalidDate: true });
      }
    }
    return null;
  }

  loadLocations(append = false) {
    if (this.loadingMoreLocations()) return;
    this.loadingMoreLocations.set(true);

    this.cropsService.getCropLocations({ PageNumber: this.locationPage, PageSize: 10 }).subscribe({
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
          if (this.cropId) {
            this.loadCrop();
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

  loadCrop() {
    this.cropsService.getCropById(this.cropId!).subscribe({
      next: (crop) => {
        this.cropForm.patchValue({
          name: crop.name,
          type: crop.type,
          status: crop.status,
          quantity: crop.quantity,
          unit: crop.unit,
          locationId: crop.locationId,
          sowingDate: crop.sowingDate ? crop.sowingDate.substring(0, 10) : '',
          expectedHarvestDate: crop.expectedHarvestDate ? crop.expectedHarvestDate.substring(0, 10) : '',
          description: crop.description,
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
    if (this.cropForm.invalid) return;

    this.submitting.set(true);
    const formVal = { ...this.cropForm.value };
    formVal.quantity = Number(formVal.quantity);
    if (formVal.locationId) {
      formVal.locationId = Number(formVal.locationId);
    }
    formVal.createTaskAndNotification = !!formVal.createTaskAndNotification;

    if (this.cropId) {
      this.cropsService.updateCrop(this.cropId, formVal).subscribe({
        next: () => {
          this.toastService.success('Запис посіву оновлено');
          this.saved.emit();
          this.submitting.set(false);
        },
        error: (err: any) => {
          
          this.submitting.set(false);
        }
      });
    } else {
      this.cropsService.createCrop(formVal).subscribe({
        next: () => {
          this.toastService.success('Посів успішно зареєстровано');
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
    this.cropsService.createCropLocation(this.locationForm.value).subscribe({
      next: (newLoc: any) => {
        this.toastService.success(`Локацію "${newLoc.name}" створено`);
        this.isLocationModalOpen.set(false);
        this.submittingLocation.set(false);

        const visibleLimit = Math.max(10, this.locationPage * 10);
        this.locations.set([
          newLoc,
          ...this.locations().filter(loc => loc.id !== newLoc.id)
        ].slice(0, visibleLimit));
        this.cropForm.patchValue({ locationId: newLoc.id });
      },
      error: (err: any) => {
        
        this.submittingLocation.set(false);
      }
    });
  }
}
