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
};

export type Preferences = {
  budget: number;
  used: 'New' | 'Used' | 'Any';
  location: string;
  fuelType: 'Hybrid' | 'EV' | 'Fuel' | 'Other' | 'Any';
  condition: 'Excellent' | 'Good' | 'Fair' | 'Any' | string;
  notes: string;
  apiKey?: string; // optional override if not in env
};

export type AnalyzeResponse = {
  cars: Car[];
  reasoning?: string;
  warning?: string; // set when no API key used
};