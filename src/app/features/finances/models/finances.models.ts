import { FarmModuleType } from '../../animals/models/animals.models';

export type FinancialRecordKind = 'Income' | 'Expense';

export type FinancialRecordType =
  | 'ProductSale'
  | 'OtherIncome'
  | 'Feed'
  | 'Veterinary'
  | 'Seeds'
  | 'Fertilizer'
  | 'PlantProtection'
  | 'Irrigation'
  | 'Equipment'
  | 'Labor'
  | 'Maintenance'
  | 'OtherExpense';

export interface FinancialRecordDto {
  id: number;
  kind: FinancialRecordKind;
  type: FinancialRecordType;
  moduleType: FarmModuleType;
  amount: number;
  occurredAt: string; // YYYY-MM-DD
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateFinancialRecordDto {
  kind: FinancialRecordKind;
  type: FinancialRecordType;
  moduleType: FarmModuleType;
  amount: number;
  occurredAt: string; // YYYY-MM-DD
  description?: string | null;
}

export interface UpdateFinancialRecordDto extends Partial<CreateFinancialRecordDto> {}
