export interface FarmDto {
  ownerUserId: string;
  name: string;
  createdAt?: string;
}

export interface CreateFarmRequest {
  ownerUserId?: string; // Optional if backend infers from token
  name: string;
}
