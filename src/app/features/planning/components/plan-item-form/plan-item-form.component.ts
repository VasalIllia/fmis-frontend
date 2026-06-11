import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlanningService } from '../../services/planning.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PlanItemDto, PlanItemStatus, PlanItemPriority } from '../../models/planning.models';

@Component({
  selector: 'app-plan-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './plan-item-form.component.html'
})
export class PlanItemFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private planningService = inject(PlanningService);
  private toastService = inject(ToastService);

  @Input() itemId: number | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  planForm!: FormGroup;
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);

  ngOnInit() {
    this.initForm();
    if (this.itemId) {
      this.loadItem();
    } else {
      this.loading.set(false);
    }
  }

  initForm() {
    const defaultStart = new Date();
    defaultStart.setHours(defaultStart.getHours() + 1, 0, 0, 0); // 1 hour from now

    this.planForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      startsAt: [this.formatDateForInput(defaultStart), Validators.required],
      endsAt: [''],
      status: ['Planned', Validators.required],
      priority: ['Normal', Validators.required],
      notificationsEnabled: [false],
      notifyAt: ['']
    }, {
      validators: [this.dateValidator, this.notificationValidator]
    });
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  dateValidator(group: FormGroup) {
    const starts = group.get('startsAt')?.value;
    const ends = group.get('endsAt')?.value;

    if (starts && ends) {
      const startDate = new Date(starts);
      const endDate = new Date(ends);
      if (endDate < startDate) {
        group.get('endsAt')?.setErrors({ invalidEndDate: true });
      }
    }
    return null;
  }

  notificationValidator(group: FormGroup) {
    const notifyEnabled = group.get('notificationsEnabled')?.value;
    const notifyAtVal = group.get('notifyAt')?.value;
    const startsVal = group.get('startsAt')?.value;

    if (notifyEnabled) {
      if (!notifyAtVal) {
        group.get('notifyAt')?.setErrors({ required: true });
      } else if (startsVal) {
        const notifyDate = new Date(notifyAtVal);
        const startDate = new Date(startsVal);
        if (notifyDate > startDate) {
          group.get('notifyAt')?.setErrors({ invalidNotifyTime: true });
        }
      }
    }
    return null;
  }

  loadItem() {
    this.planningService.getPlanItemById(this.itemId!).subscribe({
      next: (item) => {
        this.planForm.patchValue({
          title: item.title,
          description: item.description,
          startsAt: item.startsAt ? item.startsAt.substring(0, 16) : '',
          endsAt: item.endsAt ? item.endsAt.substring(0, 16) : '',
          status: item.status,
          priority: item.priority,
          notificationsEnabled: item.notificationsEnabled,
          notifyAt: item.notification ? item.notification.notifyAt.substring(0, 16) : ''
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
    if (this.planForm.invalid) return;

    this.submitting.set(true);
    const formVal = { ...this.planForm.value };

    // Format dates to ISO
    formVal.startsAt = new Date(formVal.startsAt).toISOString();
    formVal.endsAt = formVal.endsAt ? new Date(formVal.endsAt).toISOString() : null;
    formVal.notifyAt = formVal.notificationsEnabled && formVal.notifyAt ? new Date(formVal.notifyAt).toISOString() : null;

    if (this.itemId) {
      this.planningService.updatePlanItem(this.itemId, formVal).subscribe({
        next: () => {
          this.toastService.success('Завдання успішно оновлено');
          this.saved.emit();
          this.submitting.set(false);
        },
        error: (err) => {
          
          this.submitting.set(false);
        }
      });
    } else {
      this.planningService.createPlanItem(formVal).subscribe({
        next: () => {
          this.toastService.success('Завдання успішно створено');
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
