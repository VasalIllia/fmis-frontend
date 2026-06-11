import { MeasurementUnit } from '../../animals/models/animals.models';

export type GardenStatus = 'Planned' | 'Growing' | 'Active' | 'Dormant' | 'Failed';

export type GardenType =
  | 'Apple'
  | 'Pear'
  | 'Quince'
  | 'Rowan'
  | 'Cherry'
  | 'SweetCherry'
  | 'Plum'
  | 'CherryPlum'
  | 'Apricot'
  | 'Peach'
  | 'Nectarine'
  | 'Raspberry'
  | 'Blackberry'
  | 'BlackCurrant'
  | 'RedCurrant'
  | 'WhiteCurrant'
  | 'Gooseberry'
  | 'Blueberry'
  | 'Cranberry'
  | 'Honeysuckle'
  | 'Strawberry'
  | 'Walnut'
  | 'Hazelnut'
  | 'Almond'
  | 'Peanut'
  | 'Grape'
  | 'Other';

export interface GardenDto {
  id: number;
  locationId: number | null;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  description: string | null;
  status: GardenStatus;
  type: GardenType;
  plantingDate: string; // YYYY-MM-DD
  expectedHarvestDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateGardenDto {
  locationId?: number | null;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  description?: string | null;
  status: GardenStatus;
  type: GardenType;
  plantingDate: string; // YYYY-MM-DD
  expectedHarvestDate: string; // YYYY-MM-DD
  createTaskAndNotification?: boolean | null;
}

export interface UpdateGardenDto extends Partial<CreateGardenDto> {}

export interface GardenHarvestDto {
  id: number;
  gardenId: number;
  gardenName: string | null;
  quantity: number;
  usedQuantity: number;
  unit: MeasurementUnit;
  harvestDate: string; // YYYY-MM-DD
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateGardenHarvestDto {
  gardenId: number;
  quantity: number;
  unit: MeasurementUnit;
  harvestDate: string; // YYYY-MM-DD
  description?: string | null;
}

export interface UpdateGardenHarvestDto extends Partial<Omit<CreateGardenHarvestDto, "createTaskAndNotification">>
{
  usedQuantity: number;
}
