import { Component, inject, OnInit, signal, HostListener, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AnimalsService } from './services/animals.service';
import { ToastService } from '../../core/services/toast.service';
import { AnimalDto, FarmLocationDto, AnimalType, AnimalSex, AnimalStatus } from './models/animals.models';
import { AnimalFormComponent } from './components/animal-form/animal-form.component';
import { SPECIES_OPTIONS, SEX_OPTIONS, ANIMAL_STATUS_OPTIONS } from '../../shared/constants/animal.constants';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-animals',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, AnimalFormComponent, PageHeaderComponent, PaginationComponent, ConfirmModalComponent, EmptyStateComponent],
  templateUrl: './animals.component.html',
  styleUrl: './animals.component.css'
})
export class AnimalsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private animalsService = inject(AnimalsService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  animals = signal<AnimalDto[]>([]);
  locations = signal<FarmLocationDto[]>([]);
  loading = signal<boolean>(true);
  showFilters = signal<boolean>(false);
  submitting = signal<boolean>(false);

  // Pagination states
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10); // Default to 10 elements per page
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);

  locationPage = 1;
  hasMoreLocations = signal<boolean>(true);
  loadingMoreLocations = signal<boolean>(false);

  filterForm!: FormGroup;

  // Drawer & Modal control states
  isDrawerOpen = signal<boolean>(false);
  editingAnimalId = signal<number | null>(null);

  isDeleteConfirmOpen = signal<boolean>(false);
  animalToDelete = signal<AnimalDto | null>(null);

  activeMobileMenuId = signal<number | null>(null);

  speciesOptions = SPECIES_OPTIONS;
  sexOptions = SEX_OPTIONS;
  statusOptions = ANIMAL_STATUS_OPTIONS;

  @HostListener('document:click')
  onDocumentClick() {
    this.activeMobileMenuId.set(null);
  }

  ngOnInit() {
    this.initFilterForm();
    this.loadLocations();
    this.loadAnimals();

    // Subscribe to filter changes
    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.pageNumber.set(1);
      this.loadAnimals();
    });
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  onSearchInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.filterForm.patchValue({ Search: inputElement.value });
  }

  initFilterForm() {
    this.filterForm = this.fb.group({
      Search: [''],
      LocationId: [null],
      Species: [null],
      Sex: [null],
      Status: [null],
      BirthDateFrom: [''],
      BirthDateTo: ['']
    });
  }

  loadLocations(append = false) {
    if (this.loadingMoreLocations()) return;
    this.loadingMoreLocations.set(true);

    this.animalsService.getAnimalLocations({ PageNumber: this.locationPage, PageSize: 10 }).subscribe({
      next: (res) => {
        const newItems = res.items || [];
        this.locations.set(append ? [...this.locations(), ...newItems] : newItems);
        this.hasMoreLocations.set(this.locationPage < (res.totalPages || 1) && newItems.length >= 10);
        this.loadingMoreLocations.set(false);
      },
      error: () => {
        this.loadingMoreLocations.set(false);
      }
    });
  }

  loadMoreLocations() {
    this.locationPage++;
    this.loadLocations(true);
  }

  getSelectedLocationName(): string | null {
    const id = this.filterForm.get('LocationId')?.value;
    if (!id) return null;
    const loc = this.locations().find(l => l.id === Number(id));
    return loc ? loc.name : `Локація #${id}`;
  }

  loadAnimals() {
    this.loading.set(true);
    const filters = this.filterForm.value;
    const query = {
      ...filters,
      PageNumber: this.pageNumber(),
      PageSize: this.pageSize()
    };

    this.animalsService.getAnimals(query).subscribe({
      next: (res) => {
        this.animals.set(res.items || []);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        
        this.loading.set(false);
      }
    });
  }

  changePage(page: number) {
    this.pageNumber.set(page);
    this.loadAnimals();
  }

  hasActiveFilters(): boolean {
    const vals = this.filterForm.value;
    return !!(vals.Search || vals.LocationId || vals.Species || vals.Sex || vals.Status || vals.BirthDateFrom || vals.BirthDateTo);
  }

  clearFilters() {
    this.filterForm.reset({
      Search: '',
      LocationId: null,
      Species: null,
      Sex: null,
      Status: null,
      BirthDateFrom: '',
      BirthDateTo: ''
    });
  }

  toggleMobileMenu(id: number, event: Event) {
    event.stopPropagation();
    this.activeMobileMenuId.set(this.activeMobileMenuId() === id ? null : id);
  }

  // --- Drawer controls ---
  openCreateDrawer() {
    this.editingAnimalId.set(null);
    this.isDrawerOpen.set(true);
  }

  openEditDrawer(id: number) {
    this.editingAnimalId.set(id);
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
    this.editingAnimalId.set(null);
  }

  onSaved() {
    this.closeDrawer();
    this.loadAnimals();
  }

  // --- Delete confirmation ---
  confirmDelete(animal: AnimalDto) {
    this.animalToDelete.set(animal);
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
    this.animalToDelete.set(null);
  }

  onDelete() {
    const animal = this.animalToDelete();
    if (!animal) return;

    this.submitting.set(true);
    this.animalsService.deleteAnimal(animal.id).subscribe({
      next: () => {
        this.toastService.success(`Тварину "${animal.name}" вилучено`);
        this.closeDeleteConfirm();
        this.loadAnimals();
        this.submitting.set(false);
      },
      error: (err) => {
        
        this.submitting.set(false);
      }
    });
  }

  // --- Translation Helpers ---
  getSpeciesLabel(val: string): string {
    const matched = this.speciesOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getSexLabel(val: string): string {
    const matched = this.sexOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getSexClass(val: string): string {
    if (val === 'Male') return 'text-primary fw-medium';
    if (val === 'Female') return 'text-danger fw-medium';
    return 'text-muted';
  }

  getStatusLabel(val: string): string {
    const matched = this.statusOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getStatusClass(val: string): string {
    switch (val) {
      case 'Active': return 'badge bg-success-subtle text-success border border-success-subtle';
      case 'Growing': return 'badge bg-info-subtle text-info border border-info-subtle';
      case 'Sick': return 'badge bg-warning-subtle text-warning border border-warning-subtle';
      case 'Sold': return 'badge bg-secondary-subtle text-secondary border border-secondary-subtle';
      case 'Slaughtered': return 'badge bg-dark-subtle text-dark border border-dark-subtle';
      case 'Dead': return 'badge bg-danger-subtle text-danger border border-danger-subtle';
      default: return 'badge bg-secondary';
    }
  }

  getLocationName(id: number | null): string {
    if (!id) return '—';
    const loc = this.locations().find(l => l.id === id);
    return loc ? loc.name : `Локація #${id}`;
  }
}
