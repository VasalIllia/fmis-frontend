import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnimalsService } from '../../services/animals.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AnimalDto, FarmLocationDto, AnimalMatingDto, AnimalType, AnimalSex, AnimalStatus } from '../../models/animals.models';
import { SPECIES_OPTIONS, SEX_OPTIONS, ANIMAL_STATUS_OPTIONS } from '../../../../shared/constants/animal.constants';

@Component({
  selector: 'app-animal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './animal-form.component.html'
})
export class AnimalFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private animalsService = inject(AnimalsService);
  private toastService = inject(ToastService);

  @Input() animalId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  animalForm!: FormGroup;
  locationForm!: FormGroup;

  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  locations = signal<FarmLocationDto[]>([]);
  allAnimals = signal<AnimalDto[]>([]);
  completedMatings = signal<AnimalMatingDto[]>([]);

  isLocationModalOpen = signal<boolean>(false);
  submittingLocation = signal<boolean>(false);

  locationPage = 1;
  hasMoreLocations = signal<boolean>(true);
  loadingMoreLocations = signal<boolean>(false);

  // Dropdown list options
  speciesOptions = SPECIES_OPTIONS;

  sexOptions: { value: AnimalSex; label: string }[] = [
    { value: 'Male', label: 'Самець (Батько)' },
    { value: 'Female', label: 'Самка (Мати)' },
    { value: 'Unknown', label: 'Невідомо' }
  ];

  statusOptions = ANIMAL_STATUS_OPTIONS;

  ngOnInit() {
    this.initForm();
    this.loadLocations();
    this.loadAllAnimals();

    if (this.animalId) {
      this.loadAnimal();
    }
  }

  initForm() {
    this.animalForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      tagNumber: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      locationId: [null],
      birthDate: [''],
      species: ['Unknown'],
      sex: ['Unknown'],
      status: ['Active'],
      description: [''],
      birthMatingId: [null]
    });

    this.locationForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['']
    });
  }

  loadLocations(append = false) {
    if (this.loadingMoreLocations()) return;
    this.loadingMoreLocations.set(true);

    this.animalsService.getAnimalLocations({ PageNumber: this.locationPage, PageSize: 10 }).subscribe({
      next: (res) => {
        const newItems = res.items || [];
        if (append) {
          this.locations.set([...this.locations(), ...newItems]);
        } else {
          this.locations.set(newItems);
        }
        
        const totalPages = res.totalPages || 1;
        this.hasMoreLocations.set(this.locationPage < totalPages && newItems.length >= 10);
        this.loadingMoreLocations.set(false);
      },
      error: (err) => {
        
        this.loadingMoreLocations.set(false);
      }
    });
  }

  loadMoreLocations() {
    this.locationPage++;
    this.loadLocations(true);
  }

  loadAllAnimals() {
    this.animalsService.getAnimals({ PageSize: 100 }).subscribe({
      next: (res) => {
        this.allAnimals.set(res.items || []);
        // Load matings after animals are loaded
        this.loadMatings();
      },
      error: (err) => {
        
      }
    });
  }

  matingPage = 1;
  hasMoreMatings = signal<boolean>(true);
  loadingMoreMatings = signal<boolean>(false);

  loadMatings(append = false) {
    if (this.loadingMoreMatings()) return;
    this.loadingMoreMatings.set(true);

    this.animalsService.getAnimalMatingsDirect({
      PageNumber: this.matingPage,
      PageSize: 10
    }).subscribe({
      next: (res) => {
        const newItems = res.items || [];
        const filtered = newItems.filter(m => m.status === 'Completed' || m.status === 'BirthRecorded');
        
        if (append) {
          this.completedMatings.set([...this.completedMatings(), ...filtered]);
        } else {
          this.completedMatings.set(filtered);
        }

        const totalPages = res.totalPages || 1;
        this.hasMoreMatings.set(this.matingPage < totalPages && newItems.length >= 10);
        this.loadingMoreMatings.set(false);

        const currentAnimalMatingId = this.animalForm.get('birthMatingId')?.value;
        if (currentAnimalMatingId) {
          this.ensureBirthMatingLoaded(currentAnimalMatingId);
        }
      },
      error: (err) => {
        
        this.loadingMoreMatings.set(false);
      }
    });
  }

  loadMoreMatings() {
    this.matingPage++;
    this.loadMatings(true);
  }

  ensureBirthMatingLoaded(matingId: number) {
    const exists = this.completedMatings().some(m => m.id === matingId);
    if (exists) return;

    this.animalsService.getAnimalMatingDirectById(matingId).subscribe({
      next: (mating) => {
        if (!this.completedMatings().some(m => m.id === matingId)) {
          this.completedMatings.set([mating, ...this.completedMatings()]);
        }
      },
      error: (err) => {
        console.error('Не вдалося довантажити вибране спарювання народження:', err);
      }
    });
  }

  loadAnimal() {
    this.loading.set(true);
    this.animalsService.getAnimalById(this.animalId!).subscribe({
      next: (animal) => {
        this.animalForm.patchValue({
          name: animal.name,
          tagNumber: animal.tagNumber,
          quantity: animal.quantity,
          locationId: animal.locationId,
          birthDate: animal.birthDate ? animal.birthDate.substring(0, 10) : '',
          species: animal.species,
          sex: animal.sex,
          status: animal.status,
          description: animal.description,
          birthMatingId: animal.birthMatingId
        });
        
        if (animal.birthMatingId) {
          this.ensureBirthMatingLoaded(animal.birthMatingId);
        }

        this.loading.set(false);
      },
      error: (err) => {
        
        this.loading.set(false);
        this.close.emit();
      }
    });
  }

  onSubmit() {
    if (this.animalForm.invalid) return;

    this.submitting.set(true);
    const formVal = { ...this.animalForm.value };

    // Format birthDate to null if empty
    if (!formVal.birthDate) {
      formVal.birthDate = null;
    }

    // Convert birthMatingId & locationId to number or null
    formVal.locationId = formVal.locationId ? Number(formVal.locationId) : null;
    formVal.birthMatingId = formVal.birthMatingId ? Number(formVal.birthMatingId) : null;

    if (this.animalId) {
      this.animalsService.updateAnimal(this.animalId, formVal).subscribe({
        next: () => {
          this.toastService.success('Дані тварини оновлено');
          this.saved.emit();
          this.submitting.set(false);
        },
        error: (err) => {
          
          this.submitting.set(false);
        }
      });
    } else {
      this.animalsService.createAnimal(formVal).subscribe({
        next: () => {
          this.toastService.success('Тварину успішно додано');
          this.saved.emit();
          this.submitting.set(false);
        },
        error: (err) => {
          
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
    this.animalsService.createAnimalLocation(this.locationForm.value).subscribe({
      next: (newLoc) => {
        this.toastService.success(`Локацію "${newLoc.name}" створено`);
        this.isLocationModalOpen.set(false);
        this.submittingLocation.set(false);

        const visibleLimit = Math.max(10, this.locationPage * 10);
        this.locations.set([
          newLoc,
          ...this.locations().filter(loc => loc.id !== newLoc.id)
        ].slice(0, visibleLimit));
        this.animalForm.patchValue({ locationId: newLoc.id });
      },
      error: (err) => {
        
        this.submittingLocation.set(false);
      }
    });
  }

  getAnimalNameFromId(id: number): string {
    const found = this.allAnimals().find(a => a.id === id);
    if (found) {
      return `${found.name} ${found.tagNumber ? '#' + found.tagNumber : ''}`;
    }
    return `Тварина #${id}`;
  }
}
