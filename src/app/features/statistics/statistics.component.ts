import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { StatisticsService } from './services/statistics.service';
import { ToastService } from '../../core/services/toast.service';
import {
  AnimalStatisticsDto,
  CropStatisticsDto,
  FinancialStatisticsDto,
  GardenStatisticsDto,
  UnitQuantityDto,
  YearlyStatisticsDto
} from './models/statistics.models';
import {
  ANIMAL_STATUS_OPTIONS,
  SEX_OPTIONS,
  SPECIES_OPTIONS
} from '../../shared/constants/animal.constants';
import { CROP_STATUS_OPTIONS, CROP_TYPE_OPTIONS } from '../../shared/constants/crop.constants';
import { GARDEN_STATUS_OPTIONS, GARDEN_TYPE_OPTIONS } from '../../shared/constants/garden.constants';
import { FINANCE_MODULE_OPTIONS, FINANCE_TYPE_OPTIONS } from '../../shared/constants/finance.constants';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink ,ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, NgChartsModule],
  templateUrl: './statistics.component.html'
})
export class StatisticsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private statisticsService = inject(StatisticsService);
  private toastService = inject(ToastService);

  filterForm!: FormGroup;
  loading = signal<boolean>(false);
  tabLoading = signal<boolean>(false);
  
  yearly = signal<YearlyStatisticsDto[]>([]);
  
  finances = signal<FinancialStatisticsDto | null>(null);
  animals = signal<AnimalStatisticsDto | null>(null);
  crops = signal<CropStatisticsDto | null>(null);
  gardens = signal<GardenStatisticsDto | null>(null);

  selectedTab = signal<string>('General');
  currentLoadedYear: number | undefined = undefined;
  
  // Charts
  pieChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { position: 'bottom' } } };
  pieChartData = signal<ChartData<'pie', number[], string | string[]>>({ labels: [], datasets: [] });
  
  barChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { position: 'bottom' } } };
  barChartData = signal<ChartData<'bar', number[], string | string[]>>({ labels: [], datasets: [] });

  // Product Charts
  productsChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } };
  animalsProductsChartData = signal<ChartData<'bar', number[], string | string[]> | null>(null);
  cropsHarvestsChartData = signal<ChartData<'bar', number[], string | string[]> | null>(null);
  gardensHarvestsChartData = signal<ChartData<'bar', number[], string | string[]> | null>(null);

  ngOnInit() {
    this.filterForm = this.fb.group({
      year: [new Date().getFullYear()]
    });

    this.loadStatistics();
  }

  loadStatistics() {
    this.loading.set(true);
    const rawYear = this.filterForm.get('year')?.value;
    const year = rawYear ? Number(rawYear) : undefined;
    
    this.currentLoadedYear = year;
    this.finances.set(null);
    this.animals.set(null);
    this.crops.set(null);
    this.gardens.set(null);

    this.statisticsService.getYearlyStatistics().subscribe({
      next: (yearly) => {
        const sortedYearly = (yearly || []).sort((a, b) => b.year - a.year);
        this.yearly.set(sortedYearly);
        this.buildYearlyCharts(sortedYearly);
        this.loading.set(false);
        this.loadTab(this.selectedTab());
      },
      error: (err) => {
        this.toastService.danger('Помилка завантаження річної статистики');
        this.loading.set(false);
      }
    });
  }

  setTab(tab: string) {
    this.selectedTab.set(tab);
    this.loadTab(tab);
  }

  loadTab(tab: string) {
    if (tab === 'General') return;
    
    const year = this.currentLoadedYear;

    if (tab === 'Finances' && !this.finances()) {
      this.tabLoading.set(true);
      this.statisticsService.getFinanceStatistics(year).subscribe({
        next: (data) => {
          this.finances.set(data);
          this.buildFinanceCharts(data);
          this.tabLoading.set(false);
        },
        error: () => this.tabLoading.set(false)
      });
    }

    if (tab === 'Animals' && !this.animals()) {
      this.tabLoading.set(true);
      this.statisticsService.getAnimalStatistics(year).subscribe({
        next: (data) => {
          this.animals.set(data);
          if (data.products?.byType) {
            this.animalsProductsChartData.set(
              this.buildUnitBarChart(data.products.byType, (t) => this.getAnimalTypeLabel(t))
            );
          }
          this.tabLoading.set(false);
        },
        error: () => this.tabLoading.set(false)
      });
    }

    if (tab === 'Crops' && !this.crops()) {
      this.tabLoading.set(true);
      this.statisticsService.getCropStatistics(year).subscribe({
        next: (data) => {
          this.crops.set(data);
          if (data.harvests?.byType) {
            this.cropsHarvestsChartData.set(
              this.buildUnitBarChart(data.harvests.byType, (t) => this.getCropTypeLabel(t))
            );
          }
          this.tabLoading.set(false);
        },
        error: () => this.tabLoading.set(false)
      });
    }

    if (tab === 'Gardens' && !this.gardens()) {
      this.tabLoading.set(true);
      this.statisticsService.getGardenStatistics(year).subscribe({
        next: (data) => {
          this.gardens.set(data);
          if (data.harvests?.byType) {
            this.gardensHarvestsChartData.set(
              this.buildUnitBarChart(data.harvests.byType, (t) => this.getGardenTypeLabel(t))
            );
          }
          this.tabLoading.set(false);
        },
        error: () => this.tabLoading.set(false)
      });
    }
  }

  getCurrentYearData(): YearlyStatisticsDto | null {
    const data = this.yearly().find(y => y.year === this.currentLoadedYear);
    return data || null;
  }

  getLabel(options: { value: string; label: string }[], value: string): string {
    return options.find(option => option.value === value)?.label || value;
  }

  getAnimalTypeLabel(value: string): string {
    return this.getLabel(SPECIES_OPTIONS, value);
  }

  getAnimalStatusLabel(value: string): string {
    return this.getLabel(ANIMAL_STATUS_OPTIONS, value);
  }

  getAnimalSexLabel(value: string): string {
    return this.getLabel(SEX_OPTIONS, value);
  }

  getCropTypeLabel(value: string): string {
    return this.getLabel(CROP_TYPE_OPTIONS, value);
  }

  getCropStatusLabel(value: string): string {
    return this.getLabel(CROP_STATUS_OPTIONS, value);
  }

  getGardenTypeLabel(value: string): string {
    return this.getLabel(GARDEN_TYPE_OPTIONS, value);
  }

  getGardenStatusLabel(value: string): string {
    return this.getLabel(GARDEN_STATUS_OPTIONS, value);
  }

  getFinanceTypeLabel(value: string): string {
    return this.getLabel(FINANCE_TYPE_OPTIONS, value);
  }

  getModuleLabel(value: string): string {
    return this.getLabel(FINANCE_MODULE_OPTIONS, value);
  }

  getFinanceKindLabel(value: string): string {
    return value === 'Income' ? 'Дохід' : 'Витрата';
  }

  getUnitLabel(value: string): string {
    const labels: Record<string, string> = {
      Ton: 'т',
      Kilogram: 'кг',
      Gram: 'г',
      Liter: 'л',
      Milliliter: 'мл',
      Piece: 'шт',
      Ares: 'а'
    };
    return labels[value] || value;
  }

  formatUnitQuantities(items: UnitQuantityDto[] | null | undefined): string {
    if (!items?.length) return '—';
    return items.map(item => `${item.quantity} ${this.getUnitLabel(item.unit)}`).join(', ');
  }

  buildYearlyCharts(yearly: YearlyStatisticsDto[]) {
    if (yearly.length > 0) {
      const reversed = [...yearly].reverse(); // oldest first for chart
      this.barChartData.set({
        labels: reversed.map(y => y.year.toString()),
        datasets: [
          { data: reversed.map(y => y.incomeAmount), label: 'Доходи', backgroundColor: '#198754' },
          { data: reversed.map(y => y.expenseAmount), label: 'Витрати', backgroundColor: '#dc3545' },
          { data: reversed.map(y => y.netAmount), label: 'Прибуток', backgroundColor: '#0d6efd' }
        ]
      });
    } else {
        this.barChartData.set({ labels: [], datasets: [] });
    }
  }

  buildFinanceCharts(finances: FinancialStatisticsDto) {
    if (finances.byType) {
      const incomes = finances.byType.filter(t => t.kind === 'Income');
      const expenses = finances.byType.filter(t => t.kind === 'Expense');
      
      this.pieChartData.set({
        labels: expenses.map(e => this.getFinanceTypeLabel(e.type)),
        datasets: [{
          data: expenses.map(e => e.amount),
          backgroundColor: ['#dc3545', '#ffc107', '#fd7e14', '#20c997', '#0dcaf0', '#6f42c1', '#d63384', '#0d6efd']
        }]
      });
      // We could add income pie chart data if needed, but keeping it simple for now or adding a separate signal for it.
    }
  }

  buildUnitBarChart(
    items: { type: string, quantitiesByUnit: UnitQuantityDto[] | null }[],
    getLabelFn: (type: string) => string
  ): ChartData<'bar', number[], string | string[]> | null {
    if (!items || items.length === 0) return null;

    // Find all unique units
    const allUnits = new Set<string>();
    items.forEach(item => {
      if (item.quantitiesByUnit) {
        item.quantitiesByUnit.forEach(q => allUnits.add(q.unit));
      }
    });

    if (allUnits.size === 0) return null;

    const unitColors: Record<string, string> = {
      'Kilogram': '#0d6efd',
      'Liter': '#198754',
      'Piece': '#fd7e14',
      'Ton': '#6f42c1',
      'Ares': '#dc3545',
      'Gram': '#0dcaf0',
      'Milliliter': '#20c997'
    };

    const labels = items.map(item => getLabelFn(item.type));
    const datasets = Array.from(allUnits).map(unit => {
      const data = items.map(item => {
        const found = item.quantitiesByUnit?.find(q => q.unit === unit);
        return found ? found.quantity : 0;
      });
      return {
        label: this.getUnitLabel(unit),
        data: data,
        backgroundColor: unitColors[unit] || '#adb5bd'
      };
    });

    return { labels, datasets };
  }
}
