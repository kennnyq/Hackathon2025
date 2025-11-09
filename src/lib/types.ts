export type Car = {
  Id: number;
  Model: string;
  Price: number;
  Used: boolean;
  Location: string;
  'Fuel Type'?: string; // dataset uses this key
  FuelType?: string;     // normalized alias
  Condition: 'Excellent' | 'Good' | 'Fair' | string;
  Year: number;
  Type: 'Sedan' | 'SUV' | 'Truck' | 'Van' | 'Other' | string;
  Mileage?: number;
  Engine?: string;
  Transmission?: string;
  Drivetrain?: string;
  MPG?: string;
  ExteriorColor?: string;
  InteriorColor?: string;
  Dealer?: string;
  DistanceMiles?: number;
};

export type Preferences = {
  budget: number;
  used: 'New' | 'Used' | 'Any';
  location: string;
  fuelType: 'Hybrid' | 'EV' | 'Fuel' | 'Other' | 'Any';
  condition: 'Excellent' | 'Good' | 'Fair' | 'Any' | string;
  notes: string;
};

export type AnalyzeResponse = {
  cars: Car[];
  reasoning?: string;
  warning?: string; // set when no API key used
};
