import {
  AnimalSex,
  AnimalStatus,
  AnimalType,
  FarmModuleType,
  MeasurementUnit
} from '../../animals/models/animals.models';
import { CropStatus, CropType } from '../../crops/models/crops.models';
import { GardenStatus, GardenType } from '../../gardens/models/gardens.models';
import { FinancialRecordKind, FinancialRecordType } from '../../finances/models/finances.models';

export interface UnitQuantityDto {
  unit: MeasurementUnit;
  quantity: number;
}

export interface FinancialKindStatisticsDto {
  kind: FinancialRecordKind;
  recordCount: number;
  amount: number;
}

export interface FinancialTypeStatisticsDto {
  kind: FinancialRecordKind;
  type: FinancialRecordType;
  recordCount: number;
  amount: number;
}

export interface ModuleFinancialStatisticsDto {
  moduleType: FarmModuleType;
  recordCount: number;
  incomeAmount: number;
  expenseAmount: number;
  netAmount: number;
}

export interface FinancialStatisticsDto {
  year: number;
  totalRecordCount: number;
  incomeAmount: number;
  expenseAmount: number;
  netAmount: number;
  byKind: FinancialKindStatisticsDto[] | null;
  byType: FinancialTypeStatisticsDto[] | null;
  byModule: ModuleFinancialStatisticsDto[] | null;
}

export interface AnimalTypeStatisticsDto {
  type: AnimalType;
  recordCount: number;
  quantity: number;
}

export interface AnimalStatusStatisticsDto {
  status: AnimalStatus;
  recordCount: number;
  quantity: number;
}

export interface AnimalSexStatisticsDto {
  sex: AnimalSex;
  recordCount: number;
  quantity: number;
}

export interface AnimalProductTypeStatisticsDto {
  type: AnimalType;
  recordCount: number;
  quantitiesByUnit: UnitQuantityDto[] | null;
}

export interface AnimalProductStatisticsDto {
  totalRecordCount: number;
  totalQuantityByUnit: UnitQuantityDto[] | null;
  byType: AnimalProductTypeStatisticsDto[] | null;
}

export interface AnimalStatisticsDto {
  year: number;
  totalRecordCount: number;
  totalQuantity: number;
  bornInYearRecordCount: number;
  bornInYearQuantity: number;
  addedInYearRecordCount: number;
  addedInYearQuantity: number;
  byType: AnimalTypeStatisticsDto[] | null;
  byStatus: AnimalStatusStatisticsDto[] | null;
  bySex: AnimalSexStatisticsDto[] | null;
  products: AnimalProductStatisticsDto | null;
}

export interface CropTypeStatisticsDto {
  type: CropType;
  recordCount: number;
  quantitiesByUnit: UnitQuantityDto[] | null;
}

export interface CropStatusStatisticsDto {
  status: CropStatus;
  recordCount: number;
  quantitiesByUnit: UnitQuantityDto[] | null;
}

export interface CropHarvestTypeStatisticsDto {
  type: CropType;
  recordCount: number;
  quantitiesByUnit: UnitQuantityDto[] | null;
}

export interface CropHarvestStatisticsDto {
  totalRecordCount: number;
  totalQuantityByUnit: UnitQuantityDto[] | null;
  byType: CropHarvestTypeStatisticsDto[] | null;
}

export interface CropStatisticsDto {
  year: number;
  totalRecordCount: number;
  plantedRecordCount: number;
  harvestedRecordCount: number;
  totalQuantityByUnit: UnitQuantityDto[] | null;
  byType: CropTypeStatisticsDto[] | null;
  byStatus: CropStatusStatisticsDto[] | null;
  harvests: CropHarvestStatisticsDto | null;
}

export interface GardenTypeStatisticsDto {
  type: GardenType;
  recordCount: number;
  quantitiesByUnit: UnitQuantityDto[] | null;
}

export interface GardenStatusStatisticsDto {
  status: GardenStatus;
  recordCount: number;
  quantitiesByUnit: UnitQuantityDto[] | null;
}

export interface GardenHarvestTypeStatisticsDto {
  type: GardenType;
  recordCount: number;
  quantitiesByUnit: UnitQuantityDto[] | null;
}

export interface GardenHarvestStatisticsDto {
  totalRecordCount: number;
  totalQuantityByUnit: UnitQuantityDto[] | null;
  byType: GardenHarvestTypeStatisticsDto[] | null;
}

export interface GardenStatisticsDto {
  year: number;
  totalRecordCount: number;
  totalQuantityByUnit: UnitQuantityDto[] | null;
  byType: GardenTypeStatisticsDto[] | null;
  byStatus: GardenStatusStatisticsDto[] | null;
  harvests: GardenHarvestStatisticsDto | null;
}

export interface StatisticsOverviewDto {
  year: number;
  finances: FinancialStatisticsDto | null;
  animals: AnimalStatisticsDto | null;
  crops: CropStatisticsDto | null;
  gardens: GardenStatisticsDto | null;
}

export interface YearlyStatisticsDto {
  year: number;
  incomeAmount: number;
  expenseAmount: number;
  netAmount: number;
  animalRecordCount: number;
  animalQuantity: number;
  bornAnimalRecordCount: number;
  bornAnimalQuantity: number;
  cropRecordCount: number;
  gardenRecordCount: number;
  cropHarvestsByUnit: UnitQuantityDto[] | null;
  gardenHarvestsByUnit: UnitQuantityDto[] | null;
  animalProductsByUnit: UnitQuantityDto[] | null;
}
