import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html'
})
export class PaginationComponent {
  @Input() pageNumber = 1;
  @Input() totalPages = 0;
  @Input() totalCount = 0;
  @Output() pageChange = new EventEmitter<number>();

  get pagesArray(): (number | string)[] {
    const arr: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.pageNumber;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        arr.push(i);
      }
      return arr;
    }

    if (current <= 4) {
      arr.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      arr.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      arr.push(1, '...', current - 1, current, current + 1, '...', total);
    }

    return arr;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.pageNumber) {
      this.pageChange.emit(page);
    }
  }
}
