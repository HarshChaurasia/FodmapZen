// ─── FODMAP Levels ────────────────────────────────────────────────────────────

export type FodmapLevel = 'low' | 'moderate' | 'high' | 'unknown';

export interface FodmapSubgroups {
  fructans: FodmapLevel;
  gos: FodmapLevel;       // Galacto-oligosaccharides
  lactose: FodmapLevel;
  fructose: FodmapLevel;
  sorbitol: FodmapLevel;
  mannitol: FodmapLevel;
}

// ─── Food Database ────────────────────────────────────────────────────────────

export type FoodCategory =
  | 'fruit'
  | 'vegetable'
  | 'grain'
  | 'protein'
  | 'dairy'
  | 'dairy-alternative'
  | 'legume'
  | 'nut-seed'
  | 'condiment'
  | 'beverage'
  | 'sweetener'
  | 'herb-spice'
  | 'snack'
  | 'other';

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  defaultServingG: number;   // grams for default serving
  fodmapLevel: FodmapLevel;  // at default serving
  subgroups: Partial<FodmapSubgroups>;
  servingNote?: string;      // e.g. "Safe at 60g, high at 150g"
  tags?: string[];           // e.g. ['gluten-free', 'vegan']
  source?: string;           // 'monash' | 'fodmap-friendly' | 'community'
}

export interface FoodServingThreshold {
  foodId: string;
  servingG: number;
  fodmapLevel: FodmapLevel;
  note?: string;
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'sauce';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type RecipeTag =
  | 'gluten-free'
  | 'dairy-free'
  | 'vegan'
  | 'vegetarian'
  | 'nut-free'
  | 'egg-free'
  | 'quick'           // < 15 min total
  | 'batch-cook'
  | 'freezer-friendly'
  | 'kid-friendly'
  | 'one-pan';

export interface RecipeIngredient {
  foodId: string;
  foodName: string;          // denormalized for display
  amount: number;
  unit: string;              // 'g' | 'ml' | 'tbsp' | 'tsp' | 'cup' | 'piece' | 'bunch'
  notes?: string;            // e.g. "finely sliced"
  isOptional?: boolean;
  fodmapLevel?: FodmapLevel; // at this amount
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  imageUrl?: string;
}

export interface Nutrition {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  mealType: MealType;
  prepMins: number;
  cookMins: number;
  defaultServings: number;
  difficulty: Difficulty;
  nutrition: Nutrition;          // per default serving
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags: RecipeTag[];
  imageUrl?: string;
  isPremium: boolean;
  phaseCompatible: ('elimination' | 'reintroduction' | 'maintenance')[];
  dietitianVerified: boolean;
  createdAt: string;            // ISO date
}

// ─── User & Phase ─────────────────────────────────────────────────────────────

export type UserPhase = 'elimination' | 'reintroduction' | 'maintenance' | 'unknown';

export interface UserPreferences {
  phase: UserPhase;
  phaseStartDate?: string;       // ISO date
  dietaryRestrictions: DietaryRestriction[];
  preferredCookTime: 'quick' | 'medium' | 'any';
  householdSize: number;
}

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'egg-free';

// ─── Meal Planning ────────────────────────────────────────────────────────────

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface MealSlot {
  id: string;
  mealPlanId: string;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  recipeId: string;
  servings: number;
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStart: string;            // ISO date (Monday)
  name?: string;
  slots: MealSlot[];
  createdAt: string;
  updatedAt: string;
}

// ─── Shopping List ────────────────────────────────────────────────────────────

export type ShoppingCategory =
  | 'produce'
  | 'meat-fish'
  | 'dairy-alternatives'
  | 'pantry'
  | 'frozen'
  | 'other';

export interface ShoppingItem {
  id: string;
  foodName: string;
  amount: number;
  unit: string;
  shoppingCategory: ShoppingCategory;
  isChecked: boolean;
  isCustom?: boolean;
}

// ─── Tracking & Logs ──────────────────────────────────────────────────────────

export interface FoodLogEntry {
  id: string;
  userId: string;
  date: string;                 // ISO date
  recipeId?: string;
  customFoodName?: string;
  notes?: string;
  loggedAt: string;
}

export type SymptomSeverity = 0 | 1 | 2 | 3 | 4; // 0=none, 4=severe
export type StoolType = 1 | 2 | 3 | 4 | 5 | 6 | 7; // Bristol Stool Scale

export interface SymptomLog {
  id: string;
  userId: string;
  date: string;
  bloating: SymptomSeverity;
  gas: SymptomSeverity;
  pain: SymptomSeverity;
  stoolType?: StoolType;
  stressLevel: SymptomSeverity;
  sleepQuality: SymptomSeverity;
  notes?: string;
  loggedAt: string;
}

// ─── Reintroduction ───────────────────────────────────────────────────────────

export type FodmapGroup = 'fructans' | 'gos' | 'lactose' | 'fructose' | 'sorbitol' | 'mannitol';
export type ReintroVerdict = 'tolerated' | 'sensitive' | 'avoid' | 'pending';

export interface ReintroductionTest {
  id: string;
  userId: string;
  fodmapGroup: FodmapGroup;
  foodTested: string;
  startDate: string;
  day1Reaction?: SymptomSeverity;
  day2Reaction?: SymptomSeverity;
  day3Reaction?: SymptomSeverity;
  finalVerdict: ReintroVerdict;
  notes?: string;
  completedAt?: string;
}

// ─── Restaurant Guide ─────────────────────────────────────────────────────────

export interface RestaurantCuisine {
  id: string;
  name: string;
  emoji: string;
  safeDishes: string[];
  riskyDishes: string[];
  orderingTips: string[];
  avoidIngredients: string[];
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'ad-free' | 'premium';
