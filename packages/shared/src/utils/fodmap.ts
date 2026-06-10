import type { FodmapLevel, FoodServingThreshold, SymptomSeverity, ReintroVerdict } from '../types';

/** Given serving thresholds (sorted by servingG asc), return the FODMAP level for a given serving size */
export function getFodmapLevelForServing(
  thresholds: FoodServingThreshold[],
  servingG: number
): FodmapLevel {
  if (!thresholds.length) return 'unknown';
  const sorted = [...thresholds].sort((a, b) => a.servingG - b.servingG);
  let level: FodmapLevel = sorted[0].fodmapLevel;
  for (const t of sorted) {
    if (servingG >= t.servingG) level = t.fodmapLevel;
  }
  return level;
}

/** Return a human-readable label + color token for a FODMAP level */
export function fodmapLevelMeta(level: FodmapLevel): {
  label: string;
  colorToken: string;
  icon: string;
} {
  switch (level) {
    case 'low':
      return { label: 'Safe', colorToken: 'green', icon: '✓' };
    case 'moderate':
      return { label: 'Caution', colorToken: 'amber', icon: '~' };
    case 'high':
      return { label: 'Avoid', colorToken: 'red', icon: '✗' };
    default:
      return { label: 'Not tested', colorToken: 'grey', icon: '?' };
  }
}

/** Calculate days remaining in a phase given start date and total duration */
export function phaseDaysRemaining(startDate: string, totalDays: number): number {
  const start = new Date(startDate);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, totalDays - elapsed);
}

/** Derive reintroduction verdict from 3-day reactions */
export function deriveReintroVerdict(
  day1: SymptomSeverity | undefined,
  day2: SymptomSeverity | undefined,
  day3: SymptomSeverity | undefined
): ReintroVerdict {
  const reactions = [day1, day2, day3].filter((r): r is SymptomSeverity => r !== undefined);
  if (reactions.length < 3) return 'pending';
  const maxReaction = Math.max(...reactions) as SymptomSeverity;
  if (maxReaction <= 1) return 'tolerated';
  if (maxReaction === 2) return 'sensitive';
  return 'avoid';
}

/** Convert grams to a human-readable display unit */
export function formatServing(amount: number, unit: string): string {
  if (unit === 'g' && amount >= 1000) return `${(amount / 1000).toFixed(1)}kg`;
  if (unit === 'ml' && amount >= 1000) return `${(amount / 1000).toFixed(1)}L`;
  return `${amount}${unit}`;
}

/** Scale recipe ingredients by a servings multiplier */
export function scaleAmount(amount: number, fromServings: number, toServings: number): number {
  return Math.round((amount * toServings / fromServings) * 10) / 10;
}

/** Group shopping items by their shopping category */
export function groupByShoppingCategory<T extends { shoppingCategory: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const key = item.shoppingCategory;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
