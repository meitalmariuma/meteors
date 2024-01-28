export interface MeteorType {
  id: number;
  name: string;
  mass: number;
  year: number;
  reclat?: number;
  reclong?: number;
  recclass?: string;
}

export interface YearType {
  label: number;
  value: number;
  maxMass: number;
}
