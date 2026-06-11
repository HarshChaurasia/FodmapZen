import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { getRecipes, getFavoriteIds, type RecipeRow } from '../../lib/db/database';

const MEAL_TYPES: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
  { label: 'Dessert', value: 'dessert' },
];

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🥨',
  dessert: '🍫',
  sauce: '🥄',
};

export default function RecipesTab() {
  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState('all');
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [savedOnly, setSavedOnly] = useState(false);

  const load = useCallback(async (mt: string) => {
    setLoading(true);
    try {
      const results = await getRecipes({ mealType: mt, limit: 100 });
      setRecipes(results);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(mealType);
  }, [mealType, load]);

  // Refresh favorites whenever the tab gains focus (e.g. after toggling on detail)
  useFocusEffect(
    useCallback(() => {
      getFavoriteIds().then(setFavIds);
    }, [])
  );

  const filtered = recipes.filter((r) => {
    if (savedOnly && !favIds.has(r.id)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-sans-bold text-text-primary mb-4">Recipes</Text>

        {/* Search */}
        <View className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center mb-4">
          <Text className="text-text-tertiary mr-2">🔍</Text>
          <TextInput
            className="flex-1 font-sans text-text-primary text-base"
            placeholder="Search recipes..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text className="text-text-tertiary text-lg ml-2">×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Meal Type Filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MEAL_TYPES}
          keyExtractor={(item) => item.value}
          ListHeaderComponent={
            <TouchableOpacity
              onPress={() => setSavedOnly((v) => !v)}
              className={`mr-2 px-4 py-2 rounded-full border flex-row items-center ${
                savedOnly ? 'bg-primary border-primary' : 'bg-surface border-border'
              }`}
            >
              <Text className={`font-sans-medium text-sm ${savedOnly ? 'text-white' : 'text-text-secondary'}`}>
                {savedOnly ? '❤️' : '🤍'} Saved
              </Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setMealType(item.value)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                mealType === item.value
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-border'
              }`}
            >
              <Text
                className={`font-sans-medium text-sm ${
                  mealType === item.value ? 'text-white' : 'text-text-secondary'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2D7A4F" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-4xl mb-3">🍽️</Text>
              <Text className="font-sans-bold text-text-primary text-base mb-1">
                No recipes found
              </Text>
              <Text className="font-sans text-text-secondary text-sm text-center">
                Try a different search or filter
              </Text>
            </View>
          }
          renderItem={({ item }) => <RecipeCard recipe={item} isFav={favIds.has(item.id)} />}
        />
      )}
    </SafeAreaView>
  );
}

function RecipeCard({ recipe, isFav }: { recipe: RecipeRow; isFav: boolean }) {
  const totalMins = recipe.prep_mins + recipe.cook_mins;
  const emoji = MEAL_EMOJI[recipe.meal_type] ?? '🍽️';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      className="bg-surface border border-border rounded-card p-4 flex-row items-center"
    >
      <View className="bg-primary-light rounded-xl w-14 h-14 items-center justify-center mr-4">
        <Text className="text-3xl">{emoji}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-sans-bold text-text-primary text-base flex-1" numberOfLines={1}>
            {recipe.title}
          </Text>
          {isFav && <Text className="text-xs">❤️</Text>}
          {recipe.dietitian_verified === 1 && (
            <View className="bg-primary-light rounded px-1.5 py-0.5">
              <Text className="text-[10px] font-sans-medium text-primary">✓ Verified</Text>
            </View>
          )}
        </View>
        {recipe.description && (
          <Text className="font-sans text-text-secondary text-xs mt-0.5" numberOfLines={2}>
            {recipe.description}
          </Text>
        )}
        <View className="flex-row items-center gap-3 mt-1.5">
          <Text className="font-sans text-text-tertiary text-xs">⏱ {totalMins} min</Text>
          <Text className="font-sans text-text-tertiary text-xs capitalize">📊 {recipe.difficulty}</Text>
          {recipe.calories != null && (
            <Text className="font-sans text-text-tertiary text-xs">🔥 {Math.round(recipe.calories)} cal</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
