import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnimalsService } from '../../services/animals.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AnimalDto, AnimalMedicalInfoDto } from '../../models/animals.models';

@Component({
  selector: 'app-medical-info-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medical-info-form.component.html'
})
export class MedicalInfoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private animalsService = inject(AnimalsService);
  private toastService = inject(ToastService);

  @Input() medicalInfoId: number | null = null;
  @Input() selectedAnimal: AnimalDto | null = null; // Context

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  medForm!: FormGroup;
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);

  allAnimals = signal<AnimalDto[]>([]);
  animalPage = 1;
  hasMoreAnimals = signal<boolean>(true);
  loadingMoreAnimals = signal<boolean>(false);

  speciesMap: Record<string, string> = {
    Cow: 'Корова', Pig: 'Свиня', Sheep: 'Вівця', Goat: 'Коза',
    Chicken: 'Курка', Duck: 'Качка', Goose: 'Гуска', Turkey: 'Індик',
    Rabbit: 'Кріль', Unknown: 'Інше'
  };

  ngOnInit() {
    this.initForm();
    if (!this.selectedAnimal) {
      this.loadAllAnimals();
    } else {
      this.medForm.patchValue({ animalId: this.selectedAnimal.id });
      if (this.medicalInfoId) {
        this.loadMedicalInfo();
      } else {
        this.loading.set(false);
      }
    }
  }

  initForm() {
    this.medForm = this.fb.group({
      animalId: [null, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      procedureDate: [new Date().toISOString().substring(0, 10), Validators.required],
      description: [''],
      createTaskAndNotification: [false]
    });
  }

  getSelectedAnimalName(): string | null {
    const id = this.medForm.get('animalId')?.value;
    if (!id) return null;
    const animal = this.allAnimals().find(a => a.id === id);
    if (!animal) return `Тварина #${id}`;
    return `${animal.name} ${animal.tagNumber ? '#' + animal.tagNumber : ''}`;
  }

  loadAllAnimals(append = false) {
    if (this.loadingMoreAnimals()) return;
    if (!append) {
      this.loading.set(true);
    }
    this.loadingMoreAnimals.set(true);

    this.animalsService.getAnimals({ PageNumber: this.animalPage, PageSize: 10 }).subscribe({
      next: (res) => {
        const newItems = res.items || [];
        this.allAnimals.set(append ? [...this.allAnimals(), ...newItems] : newItems);
        this.hasMoreAnimals.set(this.animalPage < (res.totalPages || 1) && newItems.length >= 10);
        this.loadingMoreAnimals.set(false);

        if (!append && this.medicalInfoId) {
          this.loadMedicalInfo();
        } else if (!append) {
          this.loading.set(false);
        }
      },
      error: (err) => {
        
        this.loadingMoreAnimals.set(false);
        this.loading.set(false);
        this.close.emit();
      }
    });
  }

  loadMoreAnimals() {
    this.animalPage++;
    this.loadAllAnimals(true);
  }

  loadMedicalInfo() {
    this.animalsService.getMedicalInfoById(this.medicalInfoId!).subscribe({
      next: (med) => {
        this.medForm.patchValue({
          animalId: med.animalId,
          title: med.title,
          procedureDate: med.procedureDate ? med.procedureDate.substring(0, 10) : '',
          description: med.description,
          createTaskAndNotification: med.createTaskAndNotification || false
        });
        this.ensureAnimalLoaded(med.animalId);
        this.loading.set(false);
      },
      error: (err) => {
        
        this.loading.set(false);
        this.close.emit();
      }
    });
  }

  ensureAnimalLoaded(animalId: number) {
    if (this.allAnimals().some(a => a.id === animalId)) return;

    this.animalsService.getAnimalById(animalId).subscribe({
      next: (animal) => this.allAnimals.set([animal, ...this.allAnimals()]),
      error: () => {}
    });
  }

  onSubmit() {
    if (this.medForm.invalid) return;

    this.submitting.set(true);
    const formVal = { ...this.medForm.value };
    formVal.animalId = Number(formVal.animalId);
    formVal.createTaskAndNotification = !!formVal.createTaskAndNotification;

    if (this.medicalInfoId) {
      this.animalsService.updateMedicalInfo(this.medicalInfoId, formVal).subscribe({
        next: () => {
          this.toastService.success('Медичний запис збережено');
          this.saved.emit();
          this.submitting.set(false);
        },
        error: (err) => {
          
          this.submitting.set(false);
        }
      });
    } else {
      this.animalsService.createMedicalInfo(formVal).subscribe({
        next: () => {
          this.toastService.success('Медичний запис успішно додано');
          this.saved.emit();
          this.submitting.set(false);
        },
        error: (err) => {
          
          this.submitting.set(false);
        }
      });
    }
  }

  getSpeciesLabel(val: string): string {
    return this.speciesMap[val] || val;
  }
}
