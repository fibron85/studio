export type RidePlatform = "uber" | "careem" | "bolt";

export interface Income {
  id: string;
  platform: RidePlatform;
  amount: number;
  date: string; // ISO string
  salikToll?: number;
  airportFee?: number;
  commission?: number;
}

export interface Goal {
  monthly: number;
}
