export type RidePlatform = "uber" | "careem" | "bolt";

export type PickupLocation = 
  | "airport_t1"
  | "airport_t2"
  | "airport_t3"
  | "dubai_mall"
  | "atlantis"
  | "global_village"
  | "bolt_online_booking"
  | "otp_booking_airport"
  | "otp_booking_global_village"
  | "other";

export interface Income {
  id: string;
  platform: RidePlatform;
  amount: number;
  date: string; // ISO string
  pickupLocation?: PickupLocation;
  salikToll?: number;
  airportFee?: number;
  bookingFee?: number;
  commission?: number;
  distance?: number;
}

export interface Goal {
  monthly: number;
}
