export type RidePlatform = "uber" | "careem" | "bolt";

export type PickupLocation = 
  | "airport_t1"
  | "airport_t2"
  | "airport_t3"
  | "dubai_mall"
  | "atlantis_the_palm"
  | "global_village"
  | "other";

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

export interface Goal {
  monthly: number;
}
