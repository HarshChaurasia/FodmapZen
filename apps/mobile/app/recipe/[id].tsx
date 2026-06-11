import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getRecipeById, isFavorite, toggleFavorite, type RecipeDetail } from '../../lib/db/database';

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🥨',
  dessert: '🍫',
  sauce: '🥄',
};

function formatAmount(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const fractions: Record<string, string> = {
    '0.25': '¼', '0.5': '½', '0.75': '¾', '0.33': '⅓', '0.67': '⅔',
  };
  const whole = Math.floor(n);
  const frac = +(n - whole).toFixed(2);
  const fracStr = fractions[String(frac)];
  if (fracStr) return whole > 0 ? `${whole} ${fracStr}` : fracStr;
  return String(n);
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(2);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRecipeById(id)
      .then((result) => {
        setData(result);
        if (result.recipe) setServings(result.recipe.default_servings);
      })
      .finally(() => setLoading(false));
    isFavorite(id).then(setFav);
  }, [id]);

  const onToggleFav = async () => {
    if (!id) return;
    setFav((f) => !f); // optimistic
    try {
      const next = await toggleFavorite(id);
      setFav(next);
    } catch {
      setFav((f) => !f); // revert on error
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#2D7A4F" />
      </SafeAreaView>
    );
  }

  if (!data?.recipe) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-4xl mb-3">🤔</Text>
        <Text className="font-sans-bold text-text-primary text-base mb-4">Recipe not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-primary rounded-xl px-6 py-3">
          <Text className="text-white font-sans-medium">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { recipe, ingredients, steps, tags } = data;
  const baseServings = recipe.default_servings || 1;
  const scale = servings / baseServings;
  const totalMins = recipe.prep_mins + recipe.cook_mins;
  const emoji = MEAL_EMOJI[recipe.meal_type] ?? '🍽️';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header bar */}
      <View className="px-4 pt-2 pb-3 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface border border-border"
        >
          <Text className="text-text-primary text-lg">‹</Text>
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-text-primary flex-1" numberOfLines={1}>
          Recipe
        </Text>
        <TouchableOpacity
          onPress={onToggleFav}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface border border-border"
        >
          <Text className="text-lg">{fav ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero */}
        <View className="bg-primary-light rounded-card items-center justify-center py-10 mb-4">
          <Text className="text-6xl">{emoji}</Text>
        </View>

        {/* Title + meta */}
        <Text className="text-2xl font-sans-bold text-text-primary">{recipe.title}</Text>
        {recipe.dietitian_verified === 1 && (
          <View className="bg-primary-light rounded px-2 py-0.5 self-start mt-2">
            <Text className="text-xs font-sans-medium text-primary">✓ Dietitian verified</Text>
          </View>
        )}
        {recipe.description && (
          <Text className="font-sans text-text-secondary text-sm mt-2 leading-relaxed">
            {recipe.description}
          </Text>
        )}

        {/* Stat row */}
        <View className="flex-row gap-2 mt-4">
          <StatPill icon="⏱" label="Total" value={`${totalMins} min`} />
          <StatPill icon="📊" label="Difficulty" value={recipe.difficulty} />
          {recipe.calories != null && (
            <StatPill icon="🔥" label="Per serve" value={`${Math.round(recipe.calories)} cal`} />
          )}
        </View>

        {/* Tags */}
        {tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-4">
            {tags.map((tag) => (
              <View key={tag} className="bg-surface border border-border rounded-full px-3 py-1">
                <Text className="font-sans text-text-secondary text-xs capitalize">{tag.replace(/-/g, ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Servings stepper */}
        <View className="flex-row items-center justify-between bg-surface border border-border rounded-card p-4 mt-6">
          <Text className="font-sans-bold text-text-primary text-base">Servings</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => setServings((s) => Math.max(1, s - 1))}
              className="w-9 h-9 items-center justify-center rounded-full bg-background border border-border"
            >
              <Text className="text-text-primary text-lg">−</Text>
            </TouchableOpacity>
            <Text className="font-sans-bold text-text-primary text-lg w-6 text-center">{servings}</Text>
            <TouchableOpacity
              onPress={() => setServings((s) => Math.min(12, s + 1))}
              className="w-9 h-9 items-center justify-center rounded-full bg-background border border-border"
            >
              <Text className="text-text-primary text-lg">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ingredients */}
        <Text className="text-lg font-sans-bold text-text-primary mt-6 mb-3">Ingredients</Text>
        <View className="bg-surface border border-border rounded-card p-4 gap-3">
          {ingredients.map((ing) => {
            const scaled = ing.amount * scale;
            return (
              <View key={ing.id} className="flex-row items-start gap-3">
                <View className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <Text className="font-sans text-text-primary text-sm flex-1 leading-relaxed">
                  <Text className="font-sans-medium">{formatAmount(+scaled.toFixed(2))} {ing.unit}</Text>
                  {' '}{ing.food_name}
                  {ing.notes ? <Text className="text-text-tertiary"> · {ing.notes}</Text> : null}
                  {ing.is_optional === 1 ? <Text className="text-text-tertiary"> (optional)</Text> : null}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Method */}
        <Text className="text-lg font-sans-bold text-text-primary mt-6 mb-3">Method</Text>
        <View className="gap-3">
          {steps.map((step) => (
            <View key={step.id} className="flex-row items-start gap-3">
              <View className="bg-primary rounded-full w-7 h-7 items-center justify-center">
                <Text className="text-white font-sans-bold text-xs">{step.step_number}</Text>
              </View>
              <Text className="font-sans text-text-primary text-sm flex-1 leading-relaxed pt-0.5">
                {step.instruction}
              </Text>
            </View>
          ))}
        </View>

        {/* FODMAP note */}
        <View className="bg-primary-light rounded-card p-4 mt-6 flex-row gap-3">
          <Text className="text-lg">🌿</Text>
          <Text className="font-sans text-primary text-xs flex-1 leading-relaxed">
            All quantities follow low-FODMAP serving thresholds. Onion and garlic are replaced with
            garlic-infused oil and the green tops of spring onion. Stay within the listed amounts to keep this meal low-FODMAP.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-1 bg-surface border border-border rounded-xl p-3 items-center">
      <Text className="text-base">{icon}</Text>
      <Text className="font-sans-bold text-text-primary text-sm mt-1 capitalize">{value}</Text>
      <Text className="font-sans text-text-tertiary text-[10px] mt-0.5">{label}</Text>
    </View>
  );
}
