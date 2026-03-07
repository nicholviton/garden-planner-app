export interface PlantType {
  id: string;
  plantName: string;
  genus: string;
  species: string;
  width: number;
  color: string;
  year: number;
  createdAt: string;
}

export type PlantTypeFormData = Omit<PlantType, 'id' | 'createdAt'>;
