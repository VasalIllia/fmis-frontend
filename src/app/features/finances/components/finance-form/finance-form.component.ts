import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinancesService } from '../../services/finances.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FinancialRecordDto, FinancialRecordKind, FinancialRecordType } from '../../models/finances.models';
import { FarmModuleType } from '../../../animals/models/animals.models';
import { FINANCE_MODULE_OPTIONS, FINANCE_TYPE_OPTIONS } from '../../../../shared/constants/finance.constants';

@Component({
  selector: 'app-finance-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './finance-form.component.html'
})
export class FinanceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private financesService = inject(FinancesService);
  private toastService = inject(ToastService);

  @Input() recordId: number | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  financeForm!: FormGroup;
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);

  allTypeOptions = FINANCE_TYPE_OPTIONS;

  moduleOptions = FINANCE_MODULE_OPTIONS;

  ngOnInit() {
    this.initForm();
    if (this.recordId) {
      this.loadRecord();
    } else {
      this.loading.set(false);
    }
  }

  initForm() {
    this.financeForm = this.fb.group({
      kind: ['Expense', Validators.required],
      type: ['OtherExpense', Validators.required],
      moduleType: ['Unknown', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      occurredAt: [new Date().toISOString().substring(0, 10), Validators.required],
      description: ['']
    });
  }

  setKind(kind: FinancialRecordKind) {
    this.financeForm.patchValue({ kind });
    // Default category based on selection
    if (kind === 'Income') {
      this.financeForm.patchValue({ type: 'ProductSale' });
    } else {
      this.financeForm.patchValue({ type: 'OtherExpense' });
    }
  }

  filteredTypeOptions() {
    const currentKind = this.financeForm.get('kind')?.value;
    return this.allTypeOptions.filter(opt => opt.kind === currentKind);
  }

  loadRecord() {
    this.financesService.getFinanceById(this.recordId!).subscribe({
      next: (rec) => {
        this.financeForm.patchValue({
          kind: rec.kind,
          type: rec.type,
          moduleType: rec.moduleType,
          amount: rec.amount,
          occurredAt: rec.occurredAt ? rec.occurredAt.substring(0, 10) : '',
          description: rec.description
        });
        this.loading.set(false);
      },
      error: (err) => {
        
        this.loading.set(false);
        this.close.emit();
      }
    });
  }

  onSubmit() {
    if (this.financeForm.invalid) return;

    this.submitting.set(true);
    const formVal = { ...this.financeForm.value };
    formVal.amount = Number(formVal.amount);

    if (this.recordId) {
      this.financesService.updateFinance(this.recordId, formVal).subscribe({
        next: () => {
          this.toastService.success('Фінансовий запис оновлено');
          this.saved.emit();
          this.submitting.set(false);
        },
        error: (err) => {
          
          this.submitting.set(false);
        }
      });
    } else {
      this.financesService.createFinance(formVal).subscribe({
        next: () => {
          this.toastService.success('Фінансову операцію зареєстровано');
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

