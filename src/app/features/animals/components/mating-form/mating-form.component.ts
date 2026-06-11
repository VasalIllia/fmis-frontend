import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnimalsService } from '../../services/animals.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AnimalDto, AnimalMatingDto} from '../../models/animals.models';

@Component({
  selector: 'app-mating-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mating-form.component.html'
})
export class MatingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private animalsService = inject(AnimalsService);
  private toastService = inject(ToastService);

  @Input() matingId: number | null = null;
  @Input() selectedAnimal: AnimalDto | null = null; // Context
  @Input() isDirect = false; // Flag to indicate whether to use direct endpoints

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  matingForm!: FormGroup;
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);

  allAnimals = signal<AnimalDto[]>([]);
  femaleAnimals = signal<AnimalDto[]>([]);
  maleAnimals = signal<AnimalDto[]>([]);
  femalePage = 1;
  malePage = 1;
  hasMoreFemales = signal<boolean>(true);
  hasMoreMales = signal<boolean>(true);
  loadingMoreFemales = signal<boolean>(false);
  loadingMoreMales = signal<boolean>(false);
  matingRole = signal<'mother' | 'father' | null>(null);
  private initialAnimalListsLoaded = 0;

  statusOptions = [
    { value: 'Planned', label: 'Заплановано' },
    { value: 'Completed', label: 'Успішно злучено' },
    { value: 'Failed', label: 'Неуспішно' },
    { value: 'BirthRecorded', label: 'Зареєстровано народження (Народилося)' }
  ];

  speciesMap: Record<string, string> = {
    Cow: 'Корова', Pig: 'Свиня', Sheep: 'Вівця', Goat: 'Коза',
    Chicken: 'Курка', Duck: 'Качка', Goose: 'Гуска', Turkey: 'Індик',
    Rabbit: 'Кріль', Unknown: 'Інше'
  };

  ngOnInit() {
    this.initForm();
    this.loadAllAnimals();
  }

  initForm() {
    this.matingForm = this.fb.group({
      femaleAnimalId: [null, Validators.required],
      maleAnimalId: [null, Validators.required],
      matingDate: ['', Validators.required],
      expectedBirthDate: ['', Validators.required],
      actualBirthDate: [''],
      status: ['Planned', Validators.required],
      description: [''],
      numberOfOffspring: [null, [Validators.min(0)]],
      createTaskAndNotification: [false]
    }, {
      validators: [this.dateValidator, this.sameAnimalsValidator]
    });
  }

  getSelectedFemaleAnimalName(): string | null {
    const id = this.matingForm.get('femaleAnimalId')?.value;
    if (!id) return null;
    const animal = this.femaleAnimals().find(a => a.id === id) || this.allAnimals().find(a => a.id === id);
    if (!animal) return `Самка #${id}`;
    return `${animal.name} ${animal.tagNumber ? '#' + animal.tagNumber : ''}`;
  }

  getSelectedMaleAnimalName(): string | null {
    const id = this.matingForm.get('maleAnimalId')?.value;
    if (!id) return null;
    const animal = this.maleAnimals().find(a => a.id === id) || this.allAnimals().find(a => a.id === id);
    if (!animal) return `Самець #${id}`;
    return `${animal.name} ${animal.tagNumber ? '#' + animal.tagNumber : ''}`;
  }

  femaleDisabled(id: number): boolean {
    return id === this.matingForm.get('maleAnimalId')?.value;
  }

  maleDisabled(id: number): boolean {
    return id === this.matingForm.get('femaleAnimalId')?.value;
  }

  // Validator: expectedBirthDate >= matingDate and actualBirthDate >= matingDate
  dateValidator(group: FormGroup) {
    const matingVal = group.get('matingDate')?.value;
    const expectedVal = group.get('expectedBirthDate')?.value;
    const actualVal = group.get('actualBirthDate')?.value;
    const statusVal = group.get('status')?.value;

    const matingDate = matingVal ? new Date(matingVal) : null;
    const expectedBirthDate = expectedVal ? new Date(expectedVal) : null;
    const actualBirthDate = actualVal ? new Date(actualVal) : null;

    if (matingDate) {
      if (expectedBirthDate && expectedBirthDate < matingDate) {
        group.get('expectedBirthDate')?.setErrors({ invalidDate: true });
      }
      if (actualBirthDate && actualBirthDate < matingDate) {
        group.get('actualBirthDate')?.setErrors({ invalidDate: true });
      }
    }

    if (statusVal === 'BirthRecorded' && !actualVal) {
      group.get('actualBirthDate')?.setErrors({ requiredForBirth: true });
    }

    return null;
  }

  // Validator: femaleAnimalId !== maleAnimalId
  sameAnimalsValidator(group: FormGroup) {
    const femaleId = group.get('femaleAnimalId')?.value;
    const maleId = group.get('maleAnimalId')?.value;
    if (femaleId && maleId && Number(femaleId) === Number(maleId)) {
      return { sameAnimals: true };
    }
    return null;
  }

  loadAllAnimals() {
    this.loading.set(true);
    this.initialAnimalListsLoaded = 0;
    this.loadFemaleAnimals();
    this.loadMaleAnimals();
  }

  loadFemaleAnimals(append = false) {
    if (this.loadingMoreFemales()) return;
    this.loadingMoreFemales.set(true);

    this.animalsService.getAnimals({
      PageNumber: this.femalePage,
      PageSize: 10,
      Species: this.selectedAnimal?.species
    }).subscribe({
      next: (res) => {
        const sourceItems = res.items || [];
        this.rememberAnimals(sourceItems);
        const newItems = sourceItems.filter(a => this.isMatingCandidate(a, 'female'));
        this.femaleAnimals.set(append ? this.mergeAnimals(this.femaleAnimals(), newItems) : newItems);
        this.hasMoreFemales.set(this.femalePage < (res.totalPages || 1) && sourceItems.length >= 10);
        this.loadingMoreFemales.set(false);
        if (!append) this.handleInitialAnimalListLoaded();
      },
      error: (err) => this.handleAnimalListError(err)
    });
  }

  loadMoreFemales() {
    this.femalePage++;
    this.loadFemaleAnimals(true);
  }

  loadMaleAnimals(append = false) {
    if (this.loadingMoreMales()) return;
    this.loadingMoreMales.set(true);

    this.animalsService.getAnimals({
      PageNumber: this.malePage,
      PageSize: 10,
      Species: this.selectedAnimal?.species
    }).subscribe({
      next: (res) => {
        const sourceItems = res.items || [];
        this.rememberAnimals(sourceItems);
        const newItems = sourceItems.filter(a => this.isMatingCandidate(a, 'male'));
        this.maleAnimals.set(append ? this.mergeAnimals(this.maleAnimals(), newItems) : newItems);
        this.hasMoreMales.set(this.malePage < (res.totalPages || 1) && sourceItems.length >= 10);
        this.loadingMoreMales.set(false);
        if (!append) this.handleInitialAnimalListLoaded();
      },
      error: (err) => this.handleAnimalListError(err)
    });
  }

  loadMoreMales() {
    this.malePage++;
    this.loadMaleAnimals(true);
  }

  handleInitialAnimalListLoaded() {
    this.initialAnimalListsLoaded++;
    if (this.initialAnimalListsLoaded < 2) return;

    if (this.selectedAnimal) {
      this.applyContextAnimal();
    }

    if (this.matingId) {
      this.loadMating();
    } else {
      this.loading.set(false);
    }
  }

  handleAnimalListError(err: any) {
    
    this.loadingMoreFemales.set(false);
    this.loadingMoreMales.set(false);
    this.loading.set(false);
    this.close.emit();
  }

  rememberAnimals(items: AnimalDto[]) {
    this.allAnimals.set(this.mergeAnimals(this.allAnimals(), items));
  }

  mergeAnimals(existing: AnimalDto[], incoming: AnimalDto[]): AnimalDto[] {
    const ids = new Set(existing.map(a => a.id));
    return [...existing, ...incoming.filter(a => !ids.has(a.id))];
  }

  isMatingCandidate(animal: AnimalDto, role: 'female' | 'male'): boolean {
    if (animal.status === 'Dead' || animal.status === 'Slaughtered') return false;
    if (role === 'female') {
      return animal.sex === 'Female' || animal.sex === 'Unknown';
    }
    return animal.sex === 'Male' || animal.sex === 'Unknown';
  }

  applyContextAnimal() {
    const animal = this.selectedAnimal!;
    this.rememberAnimals([animal]);

    if (animal.sex === 'Female') {
      this.matingRole.set('mother');
      this.matingForm.patchValue({ femaleAnimalId: animal.id });
      if (this.isMatingCandidate(animal, 'female')) {
        this.femaleAnimals.set(this.mergeAnimals([animal], this.femaleAnimals()));
      }
    } else if (animal.sex === 'Male') {
      this.matingRole.set('father');
      this.matingForm.patchValue({ maleAnimalId: animal.id });
      if (this.isMatingCandidate(animal, 'male')) {
        this.maleAnimals.set(this.mergeAnimals([animal], this.maleAnimals()));
      }
    } else {
      if (this.isMatingCandidate(animal, 'female')) {
        this.femaleAnimals.set(this.mergeAnimals([animal], this.femaleAnimals()));
      }
      if (this.isMatingCandidate(animal, 'male')) {
        this.maleAnimals.set(this.mergeAnimals([animal], this.maleAnimals()));
      }
    }
  }

  setMatingRole(role: 'mother' | 'father') {
    if (!this.selectedAnimal) return;
    this.matingRole.set(role);

    if (role === 'mother') {
      this.matingForm.patchValue({
        femaleAnimalId: this.selectedAnimal.id,
        maleAnimalId: null
      });
    } else {
      this.matingForm.patchValue({
        maleAnimalId: this.selectedAnimal.id,
        femaleAnimalId: null
      });
    }
  }

  loadMating() {
    if (this.isDirect) {
      // Use direct endpoint
      this.animalsService.getAnimalMatingDirectById(this.matingId!).subscribe({
        next: (mating) => this.populateForm(mating),
        error: (err) => this.handleLoadError(err)
      });
    } else if (this.selectedAnimal) {
      // Use nested endpoint
      this.animalsService.getAnimalMatingById(this.selectedAnimal.id, this.matingId!).subscribe({
        next: (mating) => this.populateForm(mating),
        error: (err) => this.handleLoadError(err)
      });
    }
  }

  populateForm(mating: AnimalMatingDto) {
    this.matingForm.patchValue({
      femaleAnimalId: mating.femaleAnimalId,
      maleAnimalId: mating.maleAnimalId,
      matingDate: mating.matingDate ? mating.matingDate.substring(0, 10) : '',
      expectedBirthDate: mating.expectedBirthDate ? mating.expectedBirthDate.substring(0, 10) : '',
      actualBirthDate: mating.actualBirthDate ? mating.actualBirthDate.substring(0, 10) : '',
      status: mating.status,
      description: mating.description,
      numberOfOffspring: mating.numberOfOffspring,
      createTaskAndNotification: mating.createTaskAndNotification || false
    });
    this.ensureMatingAnimalLoaded(mating.femaleAnimalId, 'female');
    this.ensureMatingAnimalLoaded(mating.maleAnimalId, 'male');
    this.loading.set(false);
  }

  ensureMatingAnimalLoaded(animalId: number, role: 'female' | 'male') {
    const list = role === 'female' ? this.femaleAnimals() : this.maleAnimals();
    if (list.some(a => a.id === animalId)) return;

    this.animalsService.getAnimalById(animalId).subscribe({
      next: (animal) => {
        this.rememberAnimals([animal]);
        if (!this.isMatingCandidate(animal, role)) return;

        if (role === 'female') {
          this.femaleAnimals.set([animal, ...this.femaleAnimals()]);
        } else {
          this.maleAnimals.set([animal, ...this.maleAnimals()]);
        }
      },
      error: () => {}
    });
  }

  handleLoadError(err: any) {
    
    this.loading.set(false);
    this.close.emit();
  }

  onMatingDateChange() {
    const matVal = this.matingForm.get('matingDate')?.value;
    if (matVal) {
      const matingDate = new Date(matVal);
      let gestationDays = 280; // Cow default

      if (this.selectedAnimal) {
        if (this.selectedAnimal.species === 'Pig') gestationDays = 114;
        else if (this.selectedAnimal.species === 'Sheep' || this.selectedAnimal.species === 'Goat') gestationDays = 150;
        else if (this.selectedAnimal.species === 'Rabbit') gestationDays = 31;
        else if (this.selectedAnimal.species === 'Chicken' || this.selectedAnimal.species === 'Duck' || this.selectedAnimal.species === 'Goose' || this.selectedAnimal.species === 'Turkey') gestationDays = 28;
      }

      matingDate.setDate(matingDate.getDate() + gestationDays);
      this.matingForm.patchValue({
        expectedBirthDate: matingDate.toISOString().substring(0, 10)
      });
    }
  }

  onStatusChange() {
    const status = this.matingForm.get('status')?.value;
    if (status === 'BirthRecorded') {
      const today = new Date().toISOString().substring(0, 10);
      this.matingForm.patchValue({ actualBirthDate: today });
    } else {
      this.matingForm.patchValue({ actualBirthDate: '' });
    }
  }

  onSubmit() {
    if (this.matingForm.invalid) return;

    this.submitting.set(true);
    const formVal = { ...this.matingForm.value };

    // Format IDs
    formVal.femaleAnimalId = Number(formVal.femaleAnimalId);
    formVal.maleAnimalId = Number(formVal.maleAnimalId);

    // Format dates
    if (!formVal.actualBirthDate) {
      formVal.actualBirthDate = null;
    }

    if (formVal.numberOfOffspring !== null && formVal.numberOfOffspring !== undefined && formVal.numberOfOffspring !== '') {
      formVal.numberOfOffspring = Number(formVal.numberOfOffspring);
    } else {
      formVal.numberOfOffspring = null;
    }

    formVal.createTaskAndNotification = !!formVal.createTaskAndNotification;

    if (this.isDirect) {
      // Use direct endpoints
      if (this.matingId) {
        this.animalsService.updateAnimalMatingDirect(this.matingId, formVal).subscribe({
          next: () => {
            this.toastService.success('Запис спарювання збережено');
            this.saved.emit();
            this.submitting.set(false);
          },
          error: (err) => {
            
            this.submitting.set(false);
          }
        });
      } else {
        this.animalsService.createAnimalMatingDirect(formVal).subscribe({
          next: () => {
            this.toastService.success('Спарювання успішно створено');
            this.saved.emit();
            this.submitting.set(false);
          },
          error: (err) => {
            
            this.submitting.set(false);
          }
        });
      }
    } else {
      // Use nested endpoints (Requires route animalId)
      const routeAnimalId = this.selectedAnimal ? this.selectedAnimal.id : formVal.femaleAnimalId;
      if (this.matingId) {
        this.animalsService.updateAnimalMating(routeAnimalId, this.matingId, formVal).subscribe({
          next: () => {
            this.toastService.success('Запис спарювання збережено');
            this.saved.emit();
            this.submitting.set(false);
          },
          error: (err) => {
            
            this.submitting.set(false);
          }
        });
      } else {
        this.animalsService.createAnimalMating(routeAnimalId, formVal).subscribe({
          next: () => {
            this.toastService.success('Спарювання зареєстровано');
            this.saved.emit();
            this.submitting.set(false);
          },
          error: (err) => {
            
            this.submitting.set(false);
          }
        });
      }
    }
  }

  // --- Translation Helpers ---
  getSpeciesLabel(val: string): string {
    return this.speciesMap[val] || val;
  }

  getSexLabel(val: string): string {
    if (val === 'Male') return 'Самець';
    if (val === 'Female') return 'Самка';
    return 'Невідомо';
  }

  getAnimalNameFromId(id: number): string {
    const found = this.allAnimals().find(a => a.id === id);
    if (found) {
      return `${found.name} ${found.tagNumber ? '#' + found.tagNumber : ''}`;
    }
    return `Тварина #${id}`;
  }
}
