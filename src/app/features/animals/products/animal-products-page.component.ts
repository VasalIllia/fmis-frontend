import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, OnInit, signal, HostListener, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnimalsService } from '../services/animals.service';
import { ToastService } from '../../../core/services/toast.service';
import { AnimalDto, AnimalProductDto } from '../models/animals.models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ANIMAL_PRODUCT_UNIT_OPTIONS } from '../../../shared/constants/animal.constants';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-animal-products-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PaginationComponent, ConfirmModalComponent, EmptyStateComponent],
  templateUrl: './animal-products-page.component.html'
})
export class AnimalProductsPageComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private animalsService = inject(AnimalsService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);

  allAnimals = signal<AnimalDto[]>([]);
  products = signal<AnimalProductDto[]>([]);
  loading = signal<boolean>(true);
  filterForm!: FormGroup;
  animalPage = 1;
  hasMoreAnimals = signal<boolean>(true);
  loadingMoreAnimals = signal<boolean>(false);

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);
  activeMobileMenuId = signal<number | null>(null);

  // Modals controllers
  isProductModalOpen = signal<boolean>(false);
  editingProduct = signal<AnimalProductDto | null>(null);
  submittingProduct = signal<boolean>(false);
  productForm!: FormGroup;
  showFilters = signal<boolean>(false);

  isSellModalOpen = signal<boolean>(false);
  sellProductContext = signal<AnimalProductDto | null>(null);
  submittingSell = signal<boolean>(false);
  sellForm!: FormGroup;

  isDeleteConfirmOpen = signal<boolean>(false);
  productToDelete = signal<AnimalProductDto | null>(null);
  submittingDelete = signal<boolean>(false);

  unitOptions = ANIMAL_PRODUCT_UNIT_OPTIONS;

  @HostListener('document:click')
  onDocumentClick() {
    this.activeMobileMenuId.set(null);
  }

  toggleMobileMenu(id: number, event: Event) {
    event.stopPropagation();
    this.activeMobileMenuId.set(this.activeMobileMenuId() === id ? null : id);
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  ngOnInit() {
    this.initFilterForm();
    this.initProductForm();
    this.initSellForm();
    this.applyRouteFilters();
    this.loadAllAnimals();
    this.loadProducts();

    // Subscribe to filter changes
    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.pageNumber.set(1);
      this.loadProducts();
    });
  }

  onSearchInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.filterForm.patchValue({ Search: inputElement.value });
  }

  getSelectedAnimalNameForFilter(): string | null {
    const id = this.filterForm.get('AnimalId')?.value;
    if (!id) return null;
    const animal = this.allAnimals().find(a => a.id === id);
    if (!animal) return `Тварина #${id}`;
    return `${animal.name} ${animal.tagNumber ? '#' + animal.tagNumber : ''}`;
  }

  getSelectedAnimalNameForProductForm(): string | null {
    const id = this.productForm.get('animalId')?.value;
    if (!id) return null;
    const animal = this.allAnimals().find(a => a.id === id);
    if (!animal) return `Тварина #${id}`;
    return `${animal.name} ${animal.tagNumber ? '#' + animal.tagNumber : ''}`;
  }

  initFilterForm() {
    this.filterForm = this.fb.group({
      Search: [''],
      AnimalId: [null],
      Unit: [null],
      DateFrom: [null],
      DateTo: [null]
    });
  }

  applyRouteFilters() {
    const animalId = this.route.snapshot.queryParamMap.get('AnimalId');
    if (!animalId) return;

    const parsedAnimalId = Number(animalId);
    if (!Number.isFinite(parsedAnimalId)) return;

    this.filterForm.patchValue({ AnimalId: parsedAnimalId }, { emitEvent: false });
    this.ensureAnimalLoaded(parsedAnimalId);
  }

  initProductForm() {
    this.productForm = this.fb.group({
      animalId: [null, Validators.required],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      usedQuantity: [{ value: 0, disabled: false }, [Validators.required, Validators.min(0)]],
      unit: ['Kilogram', Validators.required],
      producedAt: ['', Validators.required],
      description: ['']
    });
  }

  initSellForm() {
    this.sellForm = this.fb.group({
      quantity: [0, [Validators.required, Validators.min(0.001)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      soldAt: ['', Validators.required],
      description: ['']
    }, {
      validators: [this.sellQuantityValidator.bind(this)]
    });
  }

  // Validator: sell quantity cannot exceed product inventory
  sellQuantityValidator(group: FormGroup) {
    const qty = group.get('quantity')?.value;
    const prod = this.sellProductContext();
    if (prod && qty > prod.quantity) {
      group.get('quantity')?.setErrors({ exceeded: true });
    }
    return null;
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

  ensureAnimalLoaded(animalId: number) {
    if (this.allAnimals().some(a => a.id === animalId)) return;

    this.animalsService.getAnimalById(animalId).subscribe({
      next: (animal) => {
        if (!this.allAnimals().some(a => a.id === animalId)) {
          this.allAnimals.set([animal, ...this.allAnimals()]);
        }
      },
      error: () => {}
    });
  }

  loadProducts() {
    this.loading.set(true);
    const filters = this.filterForm.value;
    const query = {
      Search: filters.Search || undefined,
      AnimalId: filters.AnimalId ? Number(filters.AnimalId) : undefined,
      Unit: filters.Unit || undefined,
      DateFrom: filters.DateFrom || undefined,
      DateTo: filters.DateTo || undefined,
      PageNumber: this.pageNumber(),
      PageSize: this.pageSize()
    };

    this.animalsService.getProductsDirect(query).subscribe({
      next: (res) => {
        this.products.set(res.items || []);
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
    this.loadProducts();
  }

  // --- Product form modals ---
  openProductModal(product: AnimalProductDto | null = null) {
    this.editingProduct.set(product);
    if (product) {
      this.productForm.get('animalId')?.disable();
      this.productForm.patchValue({
        animalId: product.animalId,
        name: product.name,
        quantity: product.quantity,
        usedQuantity: product.usedQuantity,
        unit: product.unit,
        producedAt: product.producedAt ? product.producedAt.substring(0, 10) : '',
        description: product.description
      });
    } else {
      this.productForm.get('animalId')?.enable();
      this.productForm.reset({
        animalId: null,
        name: '',
        quantity: 1,
        usedQuantity: 0,
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
    const rawValue = this.productForm.getRawValue();
    const formVal = { ...rawValue };
    formVal.animalId = Number(formVal.animalId);
    formVal.quantity = Number(formVal.quantity);
    formVal.usedQuantity = Number(formVal.usedQuantity);

    const product = this.editingProduct();
    if (product) {
      this.animalsService.updateProductDirect(product.id, formVal).subscribe({
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
      this.animalsService.createProductDirect(formVal).subscribe({
        next: () => {
          this.toastService.success('Продукцію зареєстровано');
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

  // --- Sell modals ---
  openSellModal(product: AnimalProductDto) {
    this.sellProductContext.set(product);
    this.sellForm.reset({
      quantity: product.quantity,
      unitPrice: 10,
      soldAt: new Date().toISOString().substring(0, 10),
      description: ''
    });
    this.isSellModalOpen.set(true);
  }

  closeSellModal() {
    this.isSellModalOpen.set(false);
    this.sellProductContext.set(null);
  }

  onSubmitSell() {
    if (this.sellForm.invalid) return;

    const prod = this.sellProductContext();
    if (!prod) return;

    this.submittingSell.set(true);
    const formVal = { ...this.sellForm.value };
    formVal.quantity = Number(formVal.quantity);
    formVal.unitPrice = Number(formVal.unitPrice);

    this.animalsService.sellProductDirect(prod.id, formVal).subscribe({
      next: () => {
        this.toastService.success('Продукцію успішно продано. Створено фінансовий запис.');
        this.closeSellModal();
        this.submittingSell.set(false);
        this.loadProducts();
      },
      error: (err) => {
        
        this.submittingSell.set(false);
      }
    });
  }

  // --- Delete confirmation ---
  confirmDelete(product: AnimalProductDto) {
    this.productToDelete.set(product);
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen.set(false);
    this.productToDelete.set(null);
  }

  onDelete() {
    const product = this.productToDelete();
    if (!product) return;

    this.submittingDelete.set(true);
    this.animalsService.deleteProductDirect(product.id).subscribe({
      next: () => {
        this.toastService.success('Запис продукції видалено');
        this.closeDeleteConfirm();
        this.submittingDelete.set(false);
        this.loadProducts();
      },
      error: (err) => {
        
        this.submittingDelete.set(false);
      }
    });
  }

  // --- Translation Helpers ---
  getUnitLabel(val: string): string {
    const matched = this.unitOptions.find(o => o.value === val);
    return matched ? matched.label : val;
  }
}
