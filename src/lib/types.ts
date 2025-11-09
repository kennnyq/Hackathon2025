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
  DealerWebsite?: string;
  DealerCity?: string;
  DealerState?: string;
  DealerZip?: string;
  DistanceLabel?: string;
  DistanceMiles?: number;
  UserZip?: string;
  FitDescription?: string;
  ImageUrl?: string;
  ModelUrl?: string;
  Seating?: number;
  VehicleCategory?: 'Cars' | 'SUVs' | 'Trucks' | 'Minivan' | 'Crossovers' | 'Other' | string;
  Doors?: number;
  Score?: number;
  GeneratedDescription?: string;
};

export type FuelPreference = 'Gas' | 'Hybrid' | 'Electric';
export type BodyStylePreference =
  | 'Sedan'
  | 'SUV'
  | 'Truck'
  | 'Crossover'
  | 'Minivan'
  | 'Hatchback'
  | 'Wagon'
  | 'Coupe'
  | 'Convertible';

export type Preferences = {
  zipCode?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  used: 'New' | 'Used' | 'Any';
  bodyTypes: BodyStylePreference[];
  yearMin?: number | null;
  yearMax?: number | null;
  mileageMin?: number | null;
  mileageMax?: number | null;
  seatsMin?: number | null;
  seatsMax?: number | null;
  fuelTypes: FuelPreference[];
  mpgMin?: number | null;
  mpgMax?: number | null;
  notes: string;
};

export type AnalyzeResponse = {
  cars: Car[];
  reasoning?: string;
  warning?: string; // set when no API key used
};

export type StringOrStringArray = string | string[] | null | undefined;

export type UserFilter = {
  budget?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  mileage_min?: number | null;
  mileage_max?: number | null;
  year_min?: number | null;
  year_max?: number | null;
  model?: StringOrStringArray;
  model_keywords?: string[];
  vehicle_category?: StringOrStringArray;
  drivetrain?: StringOrStringArray;
  fuel_type?: StringOrStringArray;
  transmission?: StringOrStringArray;
  available_seating?: number | null;
  doors?: number | null;
  exterior_color?: StringOrStringArray;
  interior_color?: StringOrStringArray;
  condition?: StringOrStringArray;
  notes?: string | null;
};

export type AttributeCounter = Record<string, number>;
export type NumericCounter = Record<number, number>;

export interface UserProfile {
  likedCountByModel: AttributeCounter;
  likedCountByCategory: AttributeCounter;
  likedCountByDrivetrain: AttributeCounter;
  likedCountByFuelType: AttributeCounter;
  likedCountByExteriorColor: AttributeCounter;
  likedCountByInteriorColor: AttributeCounter;
  likedCountByDoors: NumericCounter;
  likedCountBySeating: NumericCounter;
  rejectedCountByModel: AttributeCounter;
  rejectedCountByCategory: AttributeCounter;
  rejectedCountByDrivetrain: AttributeCounter;
  rejectedCountByFuelType: AttributeCounter;
  rejectedCountByExteriorColor: AttributeCounter;
  rejectedCountByInteriorColor: AttributeCounter;
  rejectedCountByDoors: NumericCounter;
  rejectedCountBySeating: NumericCounter;
  totalLikes: number;
  totalRejects: number;
  budgetMean: number | null;
  budgetStdDev: number | null;
  budgetSampleCount: number;
  budgetM2: number;
  lastUpdated: number;
}

export type RecommendationResult = Car & {
  score: number;
  generated_description: string;
};

export type RecommendationResponse = {
  sessionId: string;
  results: RecommendationResult[];
};
