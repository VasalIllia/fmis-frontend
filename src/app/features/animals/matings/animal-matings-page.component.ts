import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, OnInit, signal, DestroyRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AnimalsService } from '../services/animals.service';
import { ToastService } from '../../../core/services/toast.service';
import { AnimalDto, AnimalMatingDto, AnimalMatingStatus } from '../models/animals.models';
import { MatingFormComponent } from '../components/mating-form/mating-form.component';
import { SPECIES_OPTIONS } from '../../../shared/constants/animal.constants';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-animal-matings-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MatingFormComponent, ConfirmModalComponent, EmptyStateComponent],
  templateUrl: './animal-matings-page.component.html'
})
export class AnimalMatingsPageComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private animalsService = inject(AnimalsService);
  private toastService = inject(ToastService);

  allAnimals = signal<AnimalDto[]>([]);
  selectedAnimalId = signal<number | null>(null);
  contextAnimal = signal<AnimalDto | null>(null);
  animalPage = 1;
  hasMoreAnimals = signal<boolean>(true);
  loadingMoreAnimals = signal<boolean>(false);

  matings = signal<AnimalMatingDto[]>([]);
  loading = signal<boolean>(false);
  filterForm!: FormGroup;

  isMatingDrawerOpen = signal<boolean>(false);
  editingMatingId = signal<number | null>(null);
  showFilters = signal<boolean>(false);

  isDeleteConfirmOpen = signal<boolean>(false);
  matingToDelete = signal<AnimalMatingDto | null>(null);
  submittingDelete = signal<boolean>(false);

  activeMobileMenuId = signal<number | null>(null);
  expandedMatingId = signal<number | null>(null);

  @HostListener('document:click')
  onDocumentClick() {
    this.activeMobileMenuId.set(null);
  }

  toggleMobileMenu(id: number, event: Event) {
    event.stopPropagation();
    this.activeMobileMenuId.set(this.activeMobileMenuId() === id ? null : id);
  }

  toggleExpandMating(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.expandedMatingId.set(this.expandedMatingId() === id ? null : id);
  }

  statusOptions = [
    { value: 'Planned', label: 'Заплановано' },
    { value: 'Completed', label: 'Успішно злучено' },
    { value: 'Failed', label: 'Неуспішно' },
    { value: 'BirthRecorded', label: 'Народилося' }
  ];

  speciesOptions = SPECIES_OPTIONS;

  ngOnInit() {
    this.initFilterForm();
    this.loadAllAnimals();
    this.loadMatings(); // Initial load for all animals

    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadMatings();
    });
  }

  initFilterForm() {
    this.filterForm = this.fb.group({
      AnimalId: [null],
      Status: [null],
      MatingDateFrom: [null],
      MatingDateTo: [null],
      ExpectedBirthDateFrom: [null],
      ExpectedBirthDateTo: [null]
    });
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
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

  getSelectedAnimalName(): string | null {
    const id = this.filterForm.get('AnimalId')?.value;
    if (!id) return null;
    const animal = this.allAnimals().find(a => a.id === id);
    if (!animal) return `Тварина #${id}`;
    return `${animal.name} ${animal.tagNumber ? '#' + animal.tagNumber : ''}`;
  }

  loadMatings() {
    this.loading.set(true);
    const filters = this.filterForm.value;
    const query: any = {
      Status: filters.Status || undefined,
      MatingDateFrom: filters.MatingDateFrom || undefined,
      MatingDateTo: filters.MatingDateTo || undefined,
      ExpectedBirthDateFrom: filters.ExpectedBirthDateFrom || undefined,
      ExpectedBirthDateTo: filters.ExpectedBirthDateTo || undefined,
      PageSize: 100
    };

    const animalId = filters.AnimalId;
    
    // Update context animal
    if (animalId) {
      const animal = this.allAnimals().find(a => a.id === Number(animalId)) || null;
      this.contextAnimal.set(animal);
    } else {
      this.contextAnimal.set(null);
    }
    if (animalId) {
      // Use nested API if specific animal is filtered
      this.animalsService.getAnimalMatings(animalId, query).subscribe({
        next: (res) => {
          this.matings.set(res.items || []);
          this.loading.set(false);
        },
        error: (err) => {
          
          this.loading.set(false);
        }
      });
    } else {
      // Use direct API for all matings
      this.animalsService.getAnimalMatingsDirect(query).subscribe({
        next: (res) => {
          this.matings.set(res.items || []);
          this.loading.set(false);
        },
        error: (err) => {
          
          this.loading.set(false);
        }
      });
    }
  }

  // --- Drawer controls ---
  openMatingDrawer(matingId: number | null = null) {
    this.editingMatingId.set(matingId);
    if (matingId) {
      // Locate the mating in our current list to set the appropriate selectedAnimal context
      const mating = this.matings().find(m => m.id === matingId);
      if (mating) {
        const animal = this.allAnimals().find(a => a.id === mating.femaleAnimalId || a.id === mating.maleAnimalId) || null;
        this.contextAnimal.set(animal);
      }
    } else {
      // If creating new, use the filtered animal as context
      const animalId = this.filterForm.value.AnimalId;
      const animal = animalId ? (this.allAnimals().find(a => a.id === Number(animalId)) || null) : null;
      this.contextAnimal.set(animal);
    }
    this.isMatingDrawerOpen.set(true);
  }

  closeMatingDrawer() {
    this.isMatingDrawerOpen.set(false);
    this.editingMatingId.set(null);
  }

  onMatingSaved() {
    this.closeMatingDrawer();
    this.loadMatings();
  }

  // --- Delete confirmation ---
  confirmDelete(mating: AnimalMatingDto) {
    this.matingToDelete.set(mating);
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
    this.matingToDelete.set(null);
  }

  onDelete() {
    const mating = this.matingToDelete();
    if (!mating) return;

    this.submittingDelete.set(true);
    // Use direct delete endpoint
    this.animalsService.deleteAnimalMatingDirect(mating.id).subscribe({
      next: () => {
        this.toastService.success('Запис спарювання видалено');
        this.closeDeleteConfirm();
        this.submittingDelete.set(false);
        this.loadMatings();
      },
      error: (err) => {
        
        this.submittingDelete.set(false);
      }
    });
  }

  // --- Helper labels & classes ---
  getSpeciesLabel(val: string): string {
    const matched = this.speciesOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getSexLabel(val: string): string {
    if (val === 'Male') return 'Самець';
    if (val === 'Female') return 'Самка';
    return 'Невідомо';
  }

  getMatingStatusLabel(status: AnimalMatingStatus): string {
    switch (status) {
      case 'Planned': return 'Заплановано';
      case 'Completed': return 'Злучено';
      case 'Failed': return 'Неуспішно';
      case 'BirthRecorded': return 'Народилося';
      default: return status;
    }
  }

  getMatingStatusClass(status: AnimalMatingStatus): string {
    switch (status) {
      case 'Planned': return 'badge bg-info-subtle text-info border border-info-subtle';
      case 'Completed': return 'badge bg-primary-subtle text-success border border-success-subtle';
      case 'Failed': return 'badge bg-danger-subtle text-danger border border-danger-subtle';
      case 'BirthRecorded': return 'badge bg-success-subtle text-success border border-success-subtle';
      default: return 'badge bg-secondary';
    }
  }

  getAnimalNameFromId(id: number): string {
    const found = this.allAnimals().find(a => a.id === id);
    if (found) {
      return `${found.name} ${found.tagNumber ? '#' + found.tagNumber : ''}`;
    }
    return `Тварина #${id}`;
  }
}