export type RidePlatform = "uber" | "careem" | "bolt" | string;

export type PickupLocation = 
  | "airport_t1"
  | "airport_t2"
  | "airport_t3"
  | "dubai_mall"
  | "atlantis_the_palm"
  | "global_village"
  | "other"
  | string;

export interface Income {
  id: string;
  platform: RidePlatform;
  amount: number;
  date: string; // ISO string
  pickupLocation?: PickupLocation;
  salikFee?: number;
  airportFee?: number;
  bookingFee?: number;
  commission?: number;
  distance?: number;
  fuelCost?: number;
}

export interface AppSettings {
  monthlyGoal: number;
  boltCommission: number;
  fullName: string;
  customPlatforms: string[];
  customPickupLocations: string[];
}
