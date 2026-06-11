import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AnimalsService } from '../services/animals.service';
import { ToastService } from '../../../core/services/toast.service';
import { AnimalDto, AnimalMedicalInfoDto, AnimalType, AnimalStatus } from '../models/animals.models';
import { MedicalInfoFormComponent } from '../components/medical-info-form/medical-info-form.component';
import { SPECIES_OPTIONS } from '../../../shared/constants/animal.constants';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-medical-info-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MedicalInfoFormComponent, ConfirmModalComponent, EmptyStateComponent],
  templateUrl: './medical-info-page.component.html'
})
export class MedicalInfoPageComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private animalsService = inject(AnimalsService);
  private toastService = inject(ToastService);

  allAnimals = signal<AnimalDto[]>([]);
  animalPage = 1;
  hasMoreAnimals = signal<boolean>(true);
  loadingMoreAnimals = signal<boolean>(false);

  medicalRecords = signal<AnimalMedicalInfoDto[]>([]);
  loading = signal<boolean>(true);
  filterForm!: FormGroup;

  isMedicalModalOpen = signal<boolean>(false);
  editingMedicalInfoId = signal<number | null>(null);
  showFilters = signal<boolean>(false);

  isDeleteConfirmOpen = signal<boolean>(false);
  recordToDelete = signal<AnimalMedicalInfoDto | null>(null);
  submittingDelete = signal<boolean>(false);

  speciesOptions = SPECIES_OPTIONS;

  ngOnInit() {
    this.initFilterForm();
    this.loadAllAnimals();
    this.loadMedicalRecords();

    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadMedicalRecords();
    });
  }

  initFilterForm() {
    this.filterForm = this.fb.group({
      Search: [''],
      AnimalId: [null],
      AnimalSpecies: [null],
      DateFrom: [null],
      DateTo: [null]
    });
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  onSearchInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.filterForm.patchValue({ Search: inputElement.value });
  }

  getSelectedAnimalName(): string | null {
    const id = this.filterForm.get('AnimalId')?.value;
    if (!id) return null;
    const animal = this.allAnimals().find(a => a.id === id);
    if (!animal) return `Тварина #${id}`;
    return `${animal.name} ${animal.tagNumber ? '#' + animal.tagNumber : ''}`;
  }

  loadAllAnimals(append = false) {
    if (this.loadingMoreAnimals()) return;
    this.loadingMoreAnimals.set(true);

    this.animalsService.getAnimals({ PageNumber: this.animalPage, PageSize: 10 }).subscribe({
      next: (res) => {
        const newItems = res.items || [];
        this.allAnimals.set(append ? [...this.allAnimals(), ...newItems] : newItems);
        this.hasMoreAnimals.set(this.animalPage < (res.totalPages || 1) && newItems.length >= 10);
        this.loadingMoreAnimals.set(false);
      },
      error: (err) => {
        
        this.loadingMoreAnimals.set(false);
      }
    });
  }

  loadMoreAnimals() {
    this.animalPage++;
    this.loadAllAnimals(true);
  }

  loadMedicalRecords() {
    this.loading.set(true);
    const filters = this.filterForm.value;
    const query: any = {
      Search: filters.Search || undefined,
      AnimalSpecies: filters.AnimalSpecies || undefined,
      DateFrom: filters.DateFrom || undefined,
      DateTo: filters.DateTo || undefined,
      PageSize: 100
    };

    if (filters.AnimalId) {
      query.AnimalId = Number(filters.AnimalId);
    }

    this.animalsService.getMedicalInfos(query).subscribe({
      next: (res) => {
        this.medicalRecords.set(res.items || []);
        this.loading.set(false);
      },
      error: (err) => {
        
        this.loading.set(false);
      }
    });
  }

  openMedicalModal(record: AnimalMedicalInfoDto | null = null) {
    this.editingMedicalInfoId.set(record ? record.id : null);
    this.isMedicalModalOpen.set(true);
  }

  closeMedicalModal() {
    this.isMedicalModalOpen.set(false);
    this.editingMedicalInfoId.set(null);
  }

  onMedicalSaved() {
    this.closeMedicalModal();
    this.loadMedicalRecords();
  }

  confirmDelete(record: AnimalMedicalInfoDto) {
    this.recordToDelete.set(record);
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
    this.recordToDelete.set(null);
  }

  onDelete() {
    const record = this.recordToDelete();
    if (!record) return;

    this.submittingDelete.set(true);
    this.animalsService.deleteMedicalInfo(record.id).subscribe({
      next: () => {
        this.toastService.success('Медичний запис вилучено');
        this.closeDeleteConfirm();
        this.submittingDelete.set(false);
        this.loadMedicalRecords();
      },
      error: (err) => {
        
        this.submittingDelete.set(false);
      }
    });
  }
}