import { MeasurementUnit } from '../../animals/models/animals.models';

export type CropStatus = 'Planted'|'Planned' | 'Growing' | 'Harvesting' | 'Completed' | 'Failed';

export type CropType =
  | 'Tomato'
  | 'Cucumber'
  | 'Potato'
  | 'Carrot'
  | 'Cabbage'
  | 'Onion'
  | 'Garlic'
  | 'Zucchini'
  | 'Eggplant'
  | 'Pepper'
  | 'Radish'
  | 'Beetroot'
  | 'Pumpkin'
  | 'Wheat'
  | 'Sunflower'
  | 'Corn'
  | 'Barley'
  | 'Rye'
  | 'Oats'
  | 'Rice'
  | 'Buckwheat'
  | 'Peas'
  | 'Beans'
  | 'Lentils'
  | 'Soybean'
  | 'Other';

export interface CropDto {
  id: number;
  locationId: number | null;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  description: string | null;
  status: CropStatus;
  type: CropType;
  sowingDate: string; // YYYY-MM-DD
  expectedHarvestDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCropDto {
  locationId?: number | null;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  description?: string | null;
  status: CropStatus;
  type: CropType;
  sowingDate: string; // YYYY-MM-DD
  expectedHarvestDate: string; // YYYY-MM-DD
  createTaskAndNotification?: boolean | null;
}

export interface UpdateCropDto extends Partial<Omit<CreateCropDto, 'createTaskAndNotification'>> {}

export interface CropHarvestDto {
  id: number;
  cropId: number;
  cropName: string | null;
  quantity: number;
  unit: MeasurementUnit;
  harvestDate: string; // YYYY-MM-DD
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCropHarvestDto {
  cropId: number;
  quantity: number;
  unit: MeasurementUnit;
  harvestDate: string; // YYYY-MM-DD
  description?: string | null;
}

export interface UpdateCropHarvestDto extends Partial<CreateCropHarvestDto> {}
