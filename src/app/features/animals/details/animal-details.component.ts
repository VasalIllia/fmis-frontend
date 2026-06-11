import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnimalsService } from '../services/animals.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AnimalDto,
  FarmLocationDto,
  AnimalProductDto,
  AnimalMatingDto,
  MeasurementUnit,
  AnimalMatingStatus,
  AnimalMedicalInfoDto
} from '../models/animals.models';
import { AnimalFormComponent } from '../components/animal-form/animal-form.component';
import { MatingFormComponent } from '../components/mating-form/mating-form.component';
import { MedicalInfoFormComponent } from '../components/medical-info-form/medical-info-form.component';

import { SPECIES_OPTIONS, SEX_OPTIONS, ANIMAL_STATUS_OPTIONS, ANIMAL_PRODUCT_UNIT_OPTIONS } from '../../../shared/constants/animal.constants';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';


@Component({
  selector: 'app-animal-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, AnimalFormComponent, MatingFormComponent, MedicalInfoFormComponent, ConfirmModalComponent, EmptyStateComponent],
  templateUrl: './animal-details.component.html'
})
export class AnimalDetailsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private animalsService = inject(AnimalsService);
  private toastService = inject(ToastService);

  animalId!: number;
  animal = signal<AnimalDto | null>(null);
  birthMatingDetails = signal<AnimalMatingDto | null>(null);
  locations = signal<FarmLocationDto[]>([]);
  allAnimalsList = signal<AnimalDto[]>([]); // To display names in mating tab
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);

  activeTab = signal<'overview' | 'products' | 'matings' | 'medical'>('overview');

  // Animal Edit Drawer states
  isEditDrawerOpen = signal<boolean>(false);

  // Mating Tab states
  matings = signal<AnimalMatingDto[]>([]);
  loadingMatings = signal<boolean>(false);
  isMatingDrawerOpen = signal<boolean>(false);
  editingMatingId = signal<number | null>(null);
  isDeleteMatingConfirmOpen = signal<boolean>(false);
  matingToDelete = signal<AnimalMatingDto | null>(null);
  submittingMating = signal<boolean>(false);

  // Medical Tab states
  medicalRecords = signal<AnimalMedicalInfoDto[]>([]);
  loadingMedical = signal<boolean>(false);
  isMedicalDrawerOpen = signal<boolean>(false);
  editingMedicalId = signal<number | null>(null);
  isDeleteMedicalConfirmOpen = signal<boolean>(false);
  medicalToDelete = signal<AnimalMedicalInfoDto | null>(null);
  submittingMedical = signal<boolean>(false);

  // Products Tab states
  products = signal<AnimalProductDto[]>([]);
  loadingProducts = signal<boolean>(false);
  productFilterForm!: FormGroup;
  productForm!: FormGroup;
  isProductModalOpen = signal<boolean>(false);
  editingProduct = signal<AnimalProductDto | null>(null);
  submittingProduct = signal<boolean>(false);
  isDeleteProductConfirmOpen = signal<boolean>(false);
  productToDelete = signal<AnimalProductDto | null>(null);

  speciesOptions = SPECIES_OPTIONS;
  sexOptions = SEX_OPTIONS;
  statusOptions = ANIMAL_STATUS_OPTIONS;
  unitOptions = ANIMAL_PRODUCT_UNIT_OPTIONS;

  ngOnInit() {
    this.animalId = Number(this.route.snapshot.paramMap.get('id'));
    this.initProductFilterForm();
    this.initProductForm();
    this.loadLocations();
    this.loadAnimal();
    this.loadAllAnimalsForLookup();

    this.productFilterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadProducts();
    });
  }

  initProductFilterForm() {
    this.productFilterForm = this.fb.group({
      Search: [''],
      Unit: [null],
      Year: [null],
            IncludeAllYears: [true]
    });
  }

  initProductForm() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unit: ['Kilogram', Validators.required],
      producedAt: ['', Validators.required],
      description: ['']
    });
  }

  loadLocations() {
    this.animalsService.getAnimalLocations().subscribe({
      next: (res) => this.locations.set(res.items || []),
      error: () => {}
    });
  }

  loadAllAnimalsForLookup() {
    this.animalsService.getAnimals({ PageSize: 100 }).subscribe({
      next: (res) => this.allAnimalsList.set(res.items || [])
    });
  }

  loadAnimal() {
    this.loading.set(true);
    this.animalsService.getAnimalById(this.animalId).subscribe({
      next: (data) => {
        this.animal.set(data);
        if (data.birthMatingId) {
          this.animalsService.getAnimalMatingDirectById(data.birthMatingId).subscribe({
            next: (mating) => {
              this.birthMatingDetails.set(mating);
              this.loading.set(false);
            },
            error: () => {
              this.birthMatingDetails.set(null);
              this.loading.set(false);
            }
          });
        } else {
          this.birthMatingDetails.set(null);
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openEditDrawer() {
    this.isEditDrawerOpen.set(true);
  }

  closeEditDrawer() {
    this.isEditDrawerOpen.set(false);
  }

  onAnimalSaved() {
    this.closeEditDrawer();
    this.loadAnimal();
  }

  // --- Animal delete ---
  isDeleteConfirmOpen = signal<boolean>(false);
  confirmDelete() {
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
  }

  onDelete() {
    this.submitting.set(true);
    this.animalsService.deleteAnimal(this.animalId).subscribe({
      next: () => {
        this.toastService.success('Тварину вилучено');
        this.closeDeleteConfirm();
        this.submitting.set(false);
        this.router.navigate(['/animals']);
      },
      error: (err) => {
        
        this.submitting.set(false);
      }
    });
  }

  // --- Mating tab controls ---
  loadMatings() {
    this.loadingMatings.set(true);
    this.animalsService.getAnimalMatings(this.animalId).subscribe({
      next: (res) => {
        this.matings.set(res.items || []);
        this.loadingMatings.set(false);
      },
      error: (err) => {
        
        this.loadingMatings.set(false);
      }
    });
  }

  openMatingDrawer(matingId: number | null = null) {
    this.editingMatingId.set(matingId);
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

  confirmDeleteMating(mating: AnimalMatingDto) {
    this.matingToDelete.set(mating);
    this.isDeleteMatingConfirmOpen.set(true);
  }

  closeDeleteMatingConfirm() {
    this.isDeleteMatingConfirmOpen.set(false);
    this.matingToDelete.set(null);
  }

  onDeleteMating() {
    const mating = this.matingToDelete();
    if (!mating) return;

    this.submittingMating.set(true);
    this.animalsService.deleteAnimalMating(this.animalId, mating.id).subscribe({
      next: () => {
        this.toastService.success('Запис спарювання видалено');
        this.closeDeleteMatingConfirm();
        this.submittingMating.set(false);
        this.loadMatings();
      },
      error: (err) => {
        
        this.submittingMating.set(false);
      }
    });
  }

  // --- Products tab controls ---
  loadProducts() {
    this.loadingProducts.set(true);
    const filters = this.productFilterForm.value;
    const query = {
      Search: filters.Search,
      Unit: filters.Unit,
      Year: filters.Year ? Number(filters.Year) : undefined,
      IncludeAllYears: filters.IncludeAllYears,
      PageSize: 100
    };

    this.animalsService.getAnimalProducts(this.animalId, query).subscribe({
      next: (res) => {
        this.products.set(res.items || []);
        this.loadingProducts.set(false);
      },
      error: (err) => {
        
        this.loadingProducts.set(false);
      }
    });
  }

  openProductModal(product: AnimalProductDto | null = null) {
    this.editingProduct.set(product);
    if (product) {
      this.productForm.patchValue({
        name: product.name,
        quantity: product.quantity,
        unit: product.unit,
        producedAt: product.producedAt ? product.producedAt.substring(0, 10) : '',
        description: product.description
      });
    } else {
      this.productForm.reset({
        name: '',
        quantity: 1,
        unit: 'Kilogram',
        producedAt: new Date().toISOString().substring(0, 10),
        description: ''
      });
    }
    this.isProductModalOpen.set(true);
  }

  closeProductModal() {
    this.isProductModalOpen.set(false);
    this.editingProduct.set(null);
  }

  onSubmitProduct() {
    if (this.productForm.invalid) return;

    this.submittingProduct.set(true);
    const formVal = { ...this.productForm.value };
    formVal.quantity = Number(formVal.quantity);

    const product = this.editingProduct();
    if (product) {
      this.animalsService.updateAnimalProduct(this.animalId, product.id, formVal).subscribe({
        next: () => {
          this.toastService.success('Запис продукції оновлено');
          this.closeProductModal();
          this.submittingProduct.set(false);
          this.loadProducts();
        },
        error: (err) => {
          
          this.submittingProduct.set(false);
        }
      });
    } else {
      this.animalsService.createAnimalProduct(this.animalId, formVal).subscribe({
        next: () => {
          this.toastService.success('Запис продукції додано');
          this.closeProductModal();
          this.submittingProduct.set(false);
          this.loadProducts();
        },
        error: (err) => {
          
          this.submittingProduct.set(false);
        }
      });
    }
  }

  confirmDeleteProduct(product: AnimalProductDto) {
    this.productToDelete.set(product);
    this.isDeleteProductConfirmOpen.set(true);
  }

  closeDeleteProductConfirm() {
    this.isDeleteProductConfirmOpen.set(false);
    this.productToDelete.set(null);
  }

  onDeleteProduct() {
    const product = this.productToDelete();
    if (!product) return;

    this.submittingProduct.set(true);
    this.animalsService.deleteAnimalProduct(this.animalId, product.id).subscribe({
      next: () => {
        this.toastService.success('Запис продукції видалено');
        this.closeDeleteProductConfirm();
        this.submittingProduct.set(false);
        this.loadProducts();
      },
      error: (err) => {
        
        this.submittingProduct.set(false);
      }
    });
  }

  // --- Medical records tab controls ---
  loadMedicalRecords() {
    this.loadingMedical.set(true);
    this.animalsService.getMedicalInfos({ AnimalId: this.animalId, PageSize: 100 }).subscribe({
      next: (res) => {
        this.medicalRecords.set(res.items || []);
        this.loadingMedical.set(false);
      },
      error: (err) => {
        
        this.loadingMedical.set(false);
      }
    });
  }

  openMedicalDrawer(id: number | null = null) {
    this.editingMedicalId.set(id);
    this.isMedicalDrawerOpen.set(true);
  }

  closeMedicalDrawer() {
    this.isMedicalDrawerOpen.set(false);
    this.editingMedicalId.set(null);
  }

  onMedicalSaved() {
    this.closeMedicalDrawer();
    this.loadMedicalRecords();
  }

  confirmDeleteMedical(record: AnimalMedicalInfoDto) {
    this.medicalToDelete.set(record);
    this.isDeleteMedicalConfirmOpen.set(true);
  }

  closeDeleteMedicalConfirm() {
    this.isDeleteMedicalConfirmOpen.set(false);
    this.medicalToDelete.set(null);
  }

  onDeleteMedical() {
    const record = this.medicalToDelete();
    if (!record) return;

    this.submittingMedical.set(true);
    this.animalsService.deleteMedicalInfo(record.id).subscribe({
      next: () => {
        this.toastService.success('Медичний запис видалено');
        this.closeDeleteMedicalConfirm();
        this.submittingMedical.set(false);
        this.loadMedicalRecords();
      },
      error: (err) => {
        
        this.submittingMedical.set(false);
      }
    });
  }

  // --- Translation / badge helpers ---
  getSpeciesLabel(val: string): string {
    const matched = this.speciesOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getSexLabel(val: string): string {
    const matched = this.sexOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getStatusLabel(val: string): string {
    const matched = this.statusOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getStatusClass(val: string): string {
    switch (val) {
      case 'Active': return 'badge bg-success text-white';
      case 'Growing': return 'badge bg-info text-white';
      case 'Sick': return 'badge bg-warning text-dark';
      case 'Sold': return 'badge bg-secondary text-white';
      case 'Slaughtered': return 'badge bg-dark text-white';
      case 'Dead': return 'badge bg-danger text-white';
      default: return 'badge bg-secondary';
    }
  }

  getLocationName(id: number | null): string {
    if (!id) return '—';
    const loc = this.locations().find(l => l.id === id);
    return loc ? loc.name : `Локація #${id}`;
  }

  getUnitLabel(val: string): string {
    const matched = this.unitOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }

  getMatingStatusLabel(status: AnimalMatingStatus): string {
    switch (status) {
      case 'Planned': return 'Заплановано';
      case 'Completed': return 'Успішно злучено';
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
    const found = this.allAnimalsList().find(a => a.id === id);
    if (found) {
      return `${found.name} ${found.tagNumber ? '#' + found.tagNumber : ''}`;
    }
    return `Тварина #${id}`;
  }
}
