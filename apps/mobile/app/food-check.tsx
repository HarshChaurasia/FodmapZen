import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { searchFoods, type FoodRow } from '../lib/db/database';

type FodmapFilter = 'all' | 'low' | 'moderate' | 'high';

const FILTERS: { key: FodmapFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'low', label: 'Low' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'high', label: 'High' },
];

const FODMAP_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  low:      { bg: '#E8F5EE', text: '#1B5C38', dot: '#2D7A4F' },
  moderate: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  high:     { bg: '#FEE2E2', text: '#991B1B', dot: '#E05C5C' },
  unknown:  { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
};

const CATEGORY_LABELS: Record<string, string> = {
  fruit: 'Fruit',
  vegetable: 'Vegetable',
  grain: 'Grain & Bread',
  protein: 'Protein',
  dairy: 'Dairy',
  'dairy-alternative': 'Dairy Alternative',
  'nut-seed': 'Nuts & Seeds',
  condiment: 'Condiment',
  'herb-spice': 'Herb & Spice',
  sweetener: 'Sweetener',
  beverage: 'Beverage',
  snack: 'Snack',
  legume: 'Legume',
  other: 'Other',
};

export default function FoodCheckScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FodmapFilter>('all');
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q: string, f: FodmapFilter) => {
    setLoading(true);
    try {
      const results = await searchFoods(q, f, 60);
      setFoods(results);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(query, filter), query ? 200 : 0);
    return () => clearTimeout(timer);
  }, [query, filter, load]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-2 pb-3 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface border border-border"
        >
          <Text className="text-text-primary text-lg">‹</Text>
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-text-primary flex-1">
          Check a Food
        </Text>
      </View>

      {/* Search */}
      <View className="px-4 mb-3">
        <View className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center">
          <Text className="text-text-tertiary mr-2 text-base">🔍</Text>
          <TextInput
            className="flex-1 font-sans text-text-primary text-base"
            placeholder="Search 200+ foods..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text className="text-text-tertiary text-lg ml-2">×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <View className="flex-row px-4 gap-2 mb-3">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          const colors = FODMAP_COLORS[key] ?? FODMAP_COLORS.unknown;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? colors.dot : '#E5E7EB',
                backgroundColor: active ? colors.bg : '#FFFFFF',
              }}
            >
              <Text
                style={{
                  fontFamily: 'DMSans_500Medium',
                  fontSize: 13,
                  color: active ? colors.text : '#6B7280',
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Results count */}
      {!loading && (
        <Text className="px-4 mb-2 text-xs font-sans text-text-tertiary">
          {foods.length} {foods.length === 1 ? 'food' : 'foods'}{query ? ` matching "${query}"` : ''}
        </Text>
      )}

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2D7A4F" />
        </View>
      ) : (
        <FlatList
          data={foods}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-4xl mb-3">🥦</Text>
              <Text className="font-sans-bold text-text-primary text-base mb-1">
                No foods found
              </Text>
              <Text className="font-sans text-text-secondary text-sm text-center">
                Try a different search or filter
              </Text>
            </View>
          }
          renderItem={({ item }) => <FoodCard food={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function FoodCard({ food }: { food: FoodRow }) {
  const level = food.fodmap_level ?? 'unknown';
  const colors = FODMAP_COLORS[level] ?? FODMAP_COLORS.unknown;
  const categoryLabel = CATEGORY_LABELS[food.category] ?? food.category;

  const subgroups = [
    food.fructans && food.fructans !== 'low' ? `Fructans (${food.fructans})` : null,
    food.gos && food.gos !== 'low' ? `GOS (${food.gos})` : null,
    food.lactose && food.lactose !== 'low' ? `Lactose (${food.lactose})` : null,
    food.fructose && food.fructose !== 'low' ? `Fructose (${food.fructose})` : null,
    food.sorbitol && food.sorbitol !== 'low' ? `Sorbitol (${food.sorbitol})` : null,
    food.mannitol && food.mannitol !== 'low' ? `Mannitol (${food.mannitol})` : null,
  ].filter(Boolean) as string[];

  return (
    <View className="bg-surface rounded-card border border-border p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-sans-bold text-text-primary text-base leading-snug">
            {food.name}
          </Text>
          <Text className="font-sans text-text-tertiary text-xs mt-0.5">
            {categoryLabel} · {food.default_serving_g}g serving
          </Text>
        </View>
        {/* FODMAP badge */}
        <View
          style={{
            backgroundColor: colors.bg,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: colors.dot,
            }}
          />
          <Text
            style={{
              fontFamily: 'DMSans_500Medium',
              fontSize: 12,
              color: colors.text,
              textTransform: 'capitalize',
            }}
          >
            {level}
          </Text>
        </View>
      </View>

      {/* Serving note */}
      {food.serving_note && (
        <Text className="font-sans text-text-secondary text-xs mt-2 leading-relaxed">
          {food.serving_note}
        </Text>
      )}

      {/* Problem FODMAP subgroups */}
      {subgroups.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mt-2">
          {subgroups.map((sg) => (
            <View
              key={sg}
              style={{
                backgroundColor: '#FEF3C7',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#92400E' }}>
                {sg}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
