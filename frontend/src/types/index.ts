export type Role = 'BREWER' | 'ROASTER' | 'ADMIN';

export type RoastLevel = 'LIGHT' | 'LIGHT_MEDIUM' | 'MEDIUM' | 'DARK';

export type ProcessMethod =
  | 'WASHED'
  | 'NATURAL'
  | 'HONEY'
  | 'ANAEROBIC'
  | 'EXPERIMENTAL';

export type BrewMethod =
  | 'V60'
  | 'AEROPRESS'
  | 'KALITA_WAVE'
  | 'FRENCH_PRESS'
  | 'COLD_BREW'
  | 'ESPRESSO'
  | 'CAFE_LATTE'
  | 'CAPPUCCINO'
  | 'FLAT_WHITE'
  | 'AMERICANO'
  | 'GULA_AREN_LATTE'
  | 'MONT_BLANC'
  | 'ESPRESSO_TONIC'
  | 'DIRTY_LATTE'
  | 'SPANISH_LATTE'
  | 'EINSPANNER'
  | 'ORANGE_ESPRESSO'
  | 'JAPANESE_ICED_V60'
  | 'V60_SWITCH'
  | 'ORIGAMI_DRIPPER';

export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
}

export interface CoffeeBean {
  id: string;
  roasterId: string;
  roaster?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  name: string;
  origin: string;
  farmOrStation?: string;
  varietal: string;
  process: ProcessMethod;
  roastLevel: RoastLevel;
  altitudeMasl?: number;
  stockGrams: number;
  minStockThreshold: number;
  price: number;
  bagSizeGrams: number;
  imageUrl?: string;
  tastingWheelUrl?: string;
  description?: string;
  tastingNotes: string;
  createdAt: string;
  _count?: {
    recipes: number;
  };
}

export interface PourStep {
  id?: string;
  stepOrder: number;
  startTimeSeconds: number;
  waterAmountMl: number;
  instruction: string;
}

export interface Review {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  recipeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface BrewRecipe {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  coffeeBeanId?: string;
  coffeeBean?: {
    id: string;
    name: string;
    origin: string;
    roastLevel: RoastLevel;
    imageUrl?: string;
  };
  title: string;
  method: BrewMethod;
  grindSize: string;
  coffeeDoseGrams: number;
  targetRatio: number;
  totalWaterMl: number;
  waterTempCelsius: number;
  totalBrewTimeSeconds: number;
  difficulty: Difficulty;
  description?: string;
  isPublic: boolean;
  pourSteps: PourStep[];
  reviews?: Review[];
  averageRating?: number | null;
  _count?: {
    pourSteps: number;
    reviews: number;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateBeanInput {
  name: string;
  origin: string;
  farmOrStation?: string;
  varietal: string;
  process: ProcessMethod;
  roastLevel: RoastLevel;
  altitudeMasl?: number;
  stockGrams: number;
  minStockThreshold?: number;
  price: number;
  bagSizeGrams?: number;
  imageUrl?: string;
  tastingWheelUrl?: string;
  description?: string;
  tastingNotes: string;
}

export interface CreateRecipeInput {
  coffeeBeanId?: string;
  title: string;
  method: BrewMethod;
  grindSize: string;
  coffeeDoseGrams: number;
  targetRatio: number;
  totalWaterMl: number;
  waterTempCelsius: number;
  totalBrewTimeSeconds: number;
  difficulty?: Difficulty;
  description?: string;
  isPublic?: boolean;
  pourSteps: Omit<PourStep, 'id'>[];
}

export interface RatioCalculationResult {
  coffeeDoseGrams: number;
  targetRatio: number;
  totalWaterMl: number;
  recommendedWaterTemp: number;
  estimatedBrewTimeSeconds: number;
  method: BrewMethod;
  generatedPourSteps: PourStep[];
}
