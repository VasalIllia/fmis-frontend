export type FarmModuleType = 'Animals' | 'Crops' | 'Gardens' | 'Unknown';

export type MeasurementUnit = 'Ton' | 'Kilogram' | 'Gram' | 'Liter' | 'Milliliter' | 'Piece' | 'Ares';

export type AnimalType = 'Cow' | 'Pig' | 'Sheep' | 'Goat' | 'Chicken' | 'Duck' | 'Goose' | 'Turkey' | 'Rabbit' | 'Unknown';

export type AnimalSex = 'Male' | 'Female' | 'Unknown';

export type AnimalStatus = 'Growing' | 'Active' | 'Sick' | 'Sold' | 'Slaughtered' | 'Dead';

export type AnimalMatingStatus = 'Planned' | 'Completed' | 'Failed' | 'BirthRecorded';

export type PlanItemStatus = 'Planned' | 'InProgress' | 'Done' | 'Cancelled';

export type PlanItemPriority = 'Low' | 'Normal' | 'High';


export interface SellProductRequest {
  quantity: number;
  unitPrice: number;
  soldAt: string; // YYYY-MM-DD
  description?: string | null;
}

export interface FarmLocationDto {
  id: number;
  name: string;
  description: string | null;
  module: FarmModuleType;
  createdAt: string;
  updatedAt: string | null;
}

export interface AnimalDto {
  id: number;
  locationId: number | null;
  birthMatingId: number | null;
  name: string;
  tagNumber: string | null;
  quantity: number;
  description: string | null;
  birthDate: string | null; // YYYY-MM-DD
  species: AnimalType;
  sex: AnimalSex;
  status: AnimalStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface AnimalProductDto {
  id: number;
  animalId: number;
  animalName: string | null;
  name: string;
  quantity: number;
  usedQuantity: number;
  unit: MeasurementUnit;
  producedAt: string; // YYYY-MM-DD;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AnimalMatingDto {
  id: number;
  femaleAnimalId: number;
  maleAnimalId: number;
  matingDate: string; // YYYY-MM-DD
  expectedBirthDate: string; // YYYY-MM-DD
  actualBirthDate: string | null; // YYYY-MM-DD
  status: AnimalMatingStatus;
  numberOfOffspring: number | null;
  description: string | null;
  createTaskAndNotification?: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AnimalMedicalInfoDto {
  id: number;
  animalId: number;
  animalName: string | null;
  title: string | null;
  description: string | null;
  procedureDate: string; // YYYY-MM-DD
  createTaskAndNotification?: boolean;
  createdAt: string;
  updatedAt: string | null;
}
