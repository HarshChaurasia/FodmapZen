import Anthropic from '@anthropic-ai/sdk';
import type { NextRequest } from 'next/server';
import { corsJson, corsPreflight } from '../../../../lib/cors';

export const runtime = 'nodejs';

type ParseKind = 'food' | 'recipe' | 'restaurant';

const LEVEL = { type: 'string', enum: ['low', 'moderate', 'high', 'unknown'] } as const;

const FOOD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'category', 'default_serving_g', 'fodmap_level'],
  properties: {
    name: { type: 'string' },
    category: {
      type: 'string',
      enum: [
        'fruit', 'vegetable', 'grain', 'protein', 'dairy', 'dairy-alternative',
        'legume', 'nut-seed', 'condiment', 'beverage', 'sweetener', 'herb-spice',
        'snack', 'other',
      ],
    },
    default_serving_g: { type: 'number' },
    fodmap_level: LEVEL,
    fructans: LEVEL,
    gos: LEVEL,
    lactose: LEVEL,
    fructose: LEVEL,
    sorbitol: LEVEL,
    mannitol: LEVEL,
    serving_note: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
  },
} as const;

const RECIPE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description', 'meal_type', 'prep_mins', 'cook_mins', 'default_servings', 'difficulty', 'ingredients', 'steps'],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    meal_type: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'sauce'] },
    prep_mins: { type: 'integer' },
    cook_mins: { type: 'integer' },
    default_servings: { type: 'integer' },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    calories: { type: 'integer' },
    protein_g: { type: 'number' },
    carbs_g: { type: 'number' },
    fat_g: { type: 'number' },
    tags: { type: 'array', items: { type: 'string' } },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['food_name', 'amount', 'unit'],
        properties: {
          food_name: { type: 'string' },
          amount: { type: 'number' },
          unit: { type: 'string' },
          notes: { type: 'string' },
          is_optional: { type: 'boolean' },
          fodmap_level: LEVEL,
        },
      },
    },
    steps: { type: 'array', items: { type: 'string' } },
  },
} as const;

const RESTAURANT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'emoji', 'safe_dishes', 'risky_dishes', 'ordering_tips', 'avoid_ingredients'],
  properties: {
    name: { type: 'string' },
    emoji: { type: 'string' },
    safe_dishes: { type: 'array', items: { type: 'string' } },
    risky_dishes: { type: 'array', items: { type: 'string' } },
    ordering_tips: { type: 'array', items: { type: 'string' } },
    avoid_ingredients: { type: 'array', items: { type: 'string' } },
  },
} as const;

const SCHEMAS: Record<ParseKind, Record<string, unknown>> = {
  food: FOOD_SCHEMA as unknown as Record<string, unknown>,
  recipe: RECIPE_SCHEMA as unknown as Record<string, unknown>,
  restaurant: RESTAURANT_SCHEMA as unknown as Record<string, unknown>,
};

const PROMPTS: Record<ParseKind, string> = {
  food: 'Extract a structured low-FODMAP food database entry from the text. Rate the overall FODMAP level at a typical serving and rate each subgroup you can infer. Use qualitative general knowledge, never copied proprietary threshold tables.',
  recipe: 'Extract a structured recipe from the text. Rewrite instructions in your own concise words (never copy prose verbatim). Flag any high-FODMAP ingredients via fodmap_level and suggest the low-FODMAP form in notes (e.g. "use garlic-infused oil instead").',
  restaurant: 'Extract a structured low-FODMAP restaurant cuisine guide entry from the text: safe dishes, risky dishes, ordering tips, and ingredients to avoid.',
};

const MOCKS: Record<ParseKind, object> = {
  food: {
    name: 'Example Banana (unripe)', category: 'fruit', default_serving_g: 100,
    fodmap_level: 'low', fructans: 'low', fructose: 'low',
    serving_note: 'Firm/unripe is low-FODMAP; ripe bananas become moderate (fructans).',
    tags: ['gluten-free', 'vegan'],
  },
  recipe: {
    title: 'Example Lemon Herb Chicken', description: 'Quick weeknight low-FODMAP chicken.',
    meal_type: 'dinner', prep_mins: 10, cook_mins: 20, default_servings: 2, difficulty: 'easy',
    calories: 420, protein_g: 38, carbs_g: 5, fat_g: 22, tags: ['gluten-free', 'quick'],
    ingredients: [
      { food_name: 'Chicken breast', amount: 300, unit: 'g' },
      { food_name: 'Garlic-infused olive oil', amount: 2, unit: 'tbsp', notes: 'low-FODMAP garlic flavour' },
    ],
    steps: ['Season the chicken.', 'Pan-fry 6–8 min per side.', 'Rest and serve with lemon.'],
  },
  restaurant: {
    name: 'Example Japanese', emoji: '🍣',
    safe_dishes: ['Sashimi', 'Plain rice', 'Grilled salmon (shioyaki)'],
    risky_dishes: ['Gyoza (garlic, wheat)', 'Miso ramen (wheat noodles, garlic)'],
    ordering_tips: ['Ask for tamari instead of soy sauce', 'Skip sauces with garlic/onion'],
    avoid_ingredients: ['garlic', 'onion', 'wheat noodles'],
  },
};

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: NextRequest) {
  let body: { kind?: ParseKind; text?: string };
  try {
    body = await req.json();
  } catch {
    return corsJson({ error: 'Invalid JSON body' }, 400);
  }

  const kind = body.kind;
  const text = (body.text ?? '').trim();
  if (!kind || !(kind in SCHEMAS)) {
    return corsJson({ error: "kind must be 'food' | 'recipe' | 'restaurant'" }, 400);
  }
  if (!text) {
    return corsJson({ error: 'text is required' }, 400);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return corsJson({ data: MOCKS[kind], mock: true });
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system:
        'You convert raw text into structured content for a low-FODMAP app. Produce original phrasing (content will be reviewed by a dietitian before publishing). Never reproduce copyrighted recipe prose or proprietary tested-threshold tables verbatim.',
      messages: [{ role: 'user', content: `${PROMPTS[kind]}\n\n<raw_text>\n${text.slice(0, 20000)}\n</raw_text>` }],
      output_config: {
        format: { type: 'json_schema', schema: SCHEMAS[kind] },
      },
    });

    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return corsJson({ data: JSON.parse(raw), mock: false });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`AI parse error ${error.status}:`, error.message);
      return corsJson({ error: 'AI service error, please try again' }, 502);
    }
    console.error('AI parse unexpected error:', error);
    return corsJson({ error: 'Unexpected server error' }, 500);
  }
}
