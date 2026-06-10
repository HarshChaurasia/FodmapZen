import type { FodmapGroup, RestaurantCuisine } from '../types';

export const FODMAP_GROUPS: Record<FodmapGroup, { label: string; description: string; testFood: string }> = {
  fructans: {
    label: 'Fructans',
    description: 'Found in wheat, rye, onion, garlic, and some vegetables',
    testFood: 'Wheat bread (2 slices)',
  },
  gos: {
    label: 'GOS (Galacto-oligosaccharides)',
    description: 'Found in legumes, chickpeas, lentils, and some nuts',
    testFood: 'Canned chickpeas (½ cup)',
  },
  lactose: {
    label: 'Lactose',
    description: 'Found in milk, soft cheeses, yoghurt, and ice cream',
    testFood: 'Full-cream milk (250ml)',
  },
  fructose: {
    label: 'Fructose',
    description: 'Found in honey, apples, mango, and high-fructose corn syrup',
    testFood: 'Honey (2 tbsp)',
  },
  sorbitol: {
    label: 'Sorbitol',
    description: 'Found in stone fruits (apricots, peaches), avocado, and some artificial sweeteners',
    testFood: 'Avocado (½ medium)',
  },
  mannitol: {
    label: 'Mannitol',
    description: 'Found in mushrooms, cauliflower, sweet potato, and celery',
    testFood: 'Button mushrooms (1 cup)',
  },
};

export const ELIMINATION_PHASE_DAYS = 42; // 6 weeks minimum
export const REINTRODUCTION_TEST_DAYS = 3;
export const REINTRODUCTION_REST_DAYS = 3;

export const PHASE_LABELS = {
  elimination: 'Elimination',
  reintroduction: 'Reintroduction',
  maintenance: 'Maintenance',
  unknown: 'Getting Started',
};

export const RESTAURANT_GUIDE: RestaurantCuisine[] = [
  {
    id: 'italian',
    name: 'Italian',
    emoji: '🍝',
    safeDishes: [
      'Grilled fish or chicken (plain, no garlic butter)',
      'Risotto with low-FODMAP vegetables',
      'Gluten-free pasta with olive oil and chives',
      'Caprese salad (tomato, mozzarella, basil)',
      'Minestrone — ask for no onion/garlic in broth',
    ],
    riskyDishes: [
      'Regular pasta (wheat)',
      'Pizza (wheat base + garlic)',
      'Garlic bread',
      'Dishes with onion-heavy sauces (bolognese, arrabiata)',
      'Tiramisu (contains lactose + wheat)',
    ],
    orderingTips: [
      'Ask for garlic oil on the side instead of cooked garlic',
      'Request gluten-free pasta if available',
      'Ask "does this contain onion?" for any sauce',
      'Olive oil + herbs is a safe pasta topping',
    ],
    avoidIngredients: ['garlic', 'onion', 'wheat pasta', 'cream sauce'],
  },
  {
    id: 'thai',
    name: 'Thai',
    emoji: '🍜',
    safeDishes: [
      'Pad Thai (rice noodles, ask no spring onion bulb)',
      'Green papaya salad (ask no garlic)',
      'Grilled chicken satay',
      'Tom Yum soup (ask for low-FODMAP version)',
      'Jasmine rice with stir-fried vegetables',
    ],
    riskyDishes: [
      'Dishes with shallots or garlic paste',
      'Curries with coconut cream in large amounts',
      'Spring rolls (wheat wrappers)',
      'Any dish with oyster sauce (contains wheat)',
    ],
    orderingTips: [
      'Rice noodles are generally safe',
      'Ask for "no garlic, no shallot" — Thai cooks can usually accommodate',
      'Fish sauce is low FODMAP; oyster sauce is not',
      'Coconut milk (½ cup) is safe; larger amounts may cause issues',
    ],
    avoidIngredients: ['garlic', 'shallots', 'oyster sauce', 'large amounts of coconut cream'],
  },
  {
    id: 'mexican',
    name: 'Mexican',
    emoji: '🌮',
    safeDishes: [
      'Corn tortilla tacos with grilled meat',
      'Fajitas (meat + peppers, no onion)',
      'Guacamole (small serve ≤ 2 tbsp)',
      'Plain rice',
      'Grilled chicken or fish',
    ],
    riskyDishes: [
      'Wheat flour tortillas',
      'Refried beans (high GOS)',
      'Dishes with sour cream (lactose)',
      'Salsas with onion',
      'Nachos with cheese sauce',
    ],
    orderingTips: [
      'Always request corn tortillas over flour tortillas',
      'Ask for no onion in any dish',
      'Black beans are moderate FODMAP — small amounts only',
      'Jalapeños (2–3) are low FODMAP',
    ],
    avoidIngredients: ['flour tortillas', 'refried beans', 'onion', 'garlic paste'],
  },
  {
    id: 'indian',
    name: 'Indian',
    emoji: '🍛',
    safeDishes: [
      'Plain basmati rice',
      'Chicken tikka (marinated, grilled — check marinade)',
      'Tandoori dishes (dry-spiced, ask about garlic)',
      'Aloo jeera (cumin potatoes, ask no garlic/onion)',
      'Plain naan (small amount, wheat — if tolerating)',
    ],
    riskyDishes: [
      'All curries with onion/garlic base (most curries)',
      'Dal (lentils — high GOS)',
      'Saag (spinach with garlic)',
      'Chutneys with mango or onion',
      'Lassi (lactose)',
    ],
    orderingTips: [
      'Most Indian cooking starts with onion/garlic — ask if they can use garlic-infused oil instead',
      'Cumin, coriander, turmeric are safe spices',
      'Ask for "low spice, no onion, no garlic" — restaurants often accommodate',
    ],
    avoidIngredients: ['garlic', 'onion', 'lentils', 'paneer (large amounts)'],
  },
  {
    id: 'chinese',
    name: 'Chinese',
    emoji: '🥟',
    safeDishes: [
      'Steamed or stir-fried rice',
      'Steamed fish',
      'Choy sum or bok choy stir-fry (ask no garlic)',
      'Congee (rice porridge)',
      'Grilled/baked chicken',
    ],
    riskyDishes: [
      'Dumplings (wheat wrappers + garlic/cabbage filling)',
      'Fried rice (often contains garlic/onion)',
      'Noodle dishes (wheat noodles)',
      'Spring rolls',
      'Dishes with hoisin or oyster sauce',
    ],
    orderingTips: [
      'Soy sauce is low FODMAP; oyster sauce and hoisin are not',
      'Request steamed rice instead of fried rice',
      'Ask for "no garlic, no spring onion base" in stir-fries',
      'Rice noodles (flat, wide) are a safe swap for wheat noodles',
    ],
    avoidIngredients: ['garlic', 'onion', 'oyster sauce', 'hoisin sauce', 'wheat noodles'],
  },
  {
    id: 'japanese',
    name: 'Japanese',
    emoji: '🍣',
    safeDishes: [
      'Sashimi (raw fish, no soy marinade)',
      'Nigiri sushi (small amounts of rice)',
      'Edamame (½ cup max)',
      'Miso soup (small bowl)',
      'Teriyaki chicken or salmon',
    ],
    riskyDishes: [
      'Ramen (wheat noodles + garlic/onion broth)',
      'Gyoza dumplings (wheat wrappers)',
      'Tempura (wheat batter)',
      'Katsu dishes (panko = wheat)',
      'Large portions of sushi (fructan stacking in rice)',
    ],
    orderingTips: [
      'Tamari (gluten-free soy sauce) is available at most Japanese restaurants — ask',
      'Miso is low FODMAP in small amounts',
      'Wasabi and pickled ginger (small amounts) are safe',
      'Sake (small glass) is low FODMAP',
    ],
    avoidIngredients: ['wheat noodles', 'panko breadcrumbs', 'garlic in marinades'],
  },
  {
    id: 'american',
    name: 'American / Burgers',
    emoji: '🍔',
    safeDishes: [
      'Lettuce-wrapped burger (no bun)',
      'Grilled chicken sandwich (gluten-free bun if available)',
      'Steak with baked potato',
      'Coleslaw (small serving, ask for low-sugar dressing)',
      'French fries (plain, check for wheat coating)',
    ],
    riskyDishes: [
      'Regular burger buns (wheat)',
      'BBQ sauce (often contains honey/HFCS)',
      'Onion rings',
      'Milkshakes (lactose)',
      'Ketchup in large amounts (fructose)',
    ],
    orderingTips: [
      'Ask for a lettuce wrap or gluten-free bun',
      'Mustard, plain mayo, and small amounts of ketchup are safe',
      'Request no onion on any burger or sandwich',
      'Plain seasoned fries are usually safe',
    ],
    avoidIngredients: ['wheat bun', 'onion rings', 'BBQ sauce', 'large amounts of ketchup'],
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean / Greek',
    emoji: '🫒',
    safeDishes: [
      'Grilled fish (whole or fillet, olive oil + lemon)',
      'Greek salad (tomato, cucumber, feta — small feta)',
      'Souvlaki (grilled meat skewers)',
      'Tzatziki (small serving — yoghurt is moderate)',
      'Plain rice or plain roasted potatoes',
    ],
    riskyDishes: [
      'Pita bread (wheat)',
      'Hummus (chickpeas — GOS)',
      'Large portions of tzatziki (lactose)',
      'Spanakopita (wheat pastry + spinach)',
      'Dishes with large amounts of garlic',
    ],
    orderingTips: [
      'Ask for grilled dishes instead of sauced ones',
      'Olive oil and lemon is a safe dressing',
      'Feta in small amounts (40g) is low FODMAP',
      'Fresh herbs (oregano, thyme, rosemary) are all safe',
    ],
    avoidIngredients: ['pita bread', 'hummus', 'garlic-heavy dressings'],
  },
];

export const SHOPPING_CATEGORIES = {
  produce: 'Produce & Fresh',
  'meat-fish': 'Meat & Fish',
  'dairy-alternatives': 'Dairy & Alternatives',
  pantry: 'Pantry & Dry Goods',
  frozen: 'Frozen',
  other: 'Other',
};
