import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  addFoodLog, getFoodLogsByDate, deleteFoodLog, getRecipes,
  type FoodLogRow, type RecipeRow,
} from '../lib/db/database';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function prettyDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function FoodLogScreen() {
  const date = todayISO();
  const [logs, setLogs] = useState<FoodLogRow[]>([]);
  const [custom, setCustom] = useState('');
  const [recipeQuery, setRecipeQuery] = useState('');
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);

  const refresh = useCallback(async () => {
    setLogs(await getFoodLogsByDate(date));
  }, [date]);

  useEffect(() => {
    refresh();
    getRecipes({ limit: 100 }).then(setRecipes);
  }, [refresh]);

  const logCustom = async () => {
    const text = custom.trim();
    if (!text) return;
    await addFoodLog({ date, customFood: text });
    setCustom('');
    refresh();
  };

  const logRecipe = async (r: RecipeRow) => {
    await addFoodLog({ date, recipeId: r.id });
    setRecipeQuery('');
    refresh();
  };

  const remove = (id: string) => {
    Alert.alert('Remove entry?', 'This will delete the log entry.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteFoodLog(id); refresh(); },
      },
    ]);
  };

  const filteredRecipes = recipeQuery.trim()
    ? recipes.filter((r) => r.title.toLowerCase().includes(recipeQuery.trim().toLowerCase())).slice(0, 6)
    : [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-2 pb-3 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface border border-border"
        >
          <Text className="text-text-primary text-lg">‹</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-sans-bold text-text-primary">Food Log</Text>
          <Text className="font-sans text-text-tertiary text-xs">{prettyDate(date)}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Quick add custom */}
        <Text className="font-sans-bold text-text-primary text-base mb-2 mt-1">Log a meal or food</Text>
        <View className="bg-surface border border-border rounded-xl px-4 py-2 flex-row items-center mb-2">
          <TextInput
            className="flex-1 font-sans text-text-primary text-base py-1.5"
            placeholder="e.g. Scrambled eggs on sourdough"
            placeholderTextColor="#9CA3AF"
            value={custom}
            onChangeText={setCustom}
            returnKeyType="done"
            onSubmitEditing={logCustom}
          />
          <TouchableOpacity
            onPress={logCustom}
            disabled={!custom.trim()}
            className="bg-primary rounded-lg px-3 py-2 ml-2"
            style={{ opacity: custom.trim() ? 1 : 0.4 }}
          >
            <Text className="text-white font-sans-medium text-sm">Add</Text>
          </TouchableOpacity>
        </View>

        {/* Log from recipe */}
        <Text className="font-sans-bold text-text-primary text-base mb-2 mt-4">Or log a recipe</Text>
        <View className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center">
          <Text className="text-text-tertiary mr-2">🔍</Text>
          <TextInput
            className="flex-1 font-sans text-text-primary text-base"
            placeholder="Search your recipes..."
            placeholderTextColor="#9CA3AF"
            value={recipeQuery}
            onChangeText={setRecipeQuery}
            autoCorrect={false}
          />
        </View>
        {filteredRecipes.map((r) => (
          <TouchableOpacity
            key={r.id}
            onPress={() => logRecipe(r)}
            className="bg-surface border border-border rounded-xl px-4 py-3 mt-2 flex-row items-center justify-between"
          >
            <Text className="font-sans text-text-primary text-sm flex-1" numberOfLines={1}>{r.title}</Text>
            <Text className="text-primary font-sans-medium text-sm ml-2">+ Log</Text>
          </TouchableOpacity>
        ))}

        {/* Today's entries */}
        <Text className="font-sans-bold text-text-primary text-base mb-2 mt-6">
          Today's entries {logs.length > 0 ? `(${logs.length})` : ''}
        </Text>
        {logs.length === 0 ? (
          <View className="bg-surface border border-border rounded-card p-6 items-center">
            <Text className="text-3xl mb-2">🍽️</Text>
            <Text className="font-sans text-text-secondary text-sm text-center">
              Nothing logged yet today. Add a meal above.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {logs.map((log) => (
              <View key={log.id} className="bg-surface border border-border rounded-card px-4 py-3 flex-row items-center">
                <View className="flex-1">
                  <Text className="font-sans-medium text-text-primary text-sm">
                    {log.recipe_title ?? log.custom_food ?? 'Logged item'}
                  </Text>
                  {log.recipe_title && (
                    <Text className="font-sans text-text-tertiary text-xs mt-0.5">From recipes</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => remove(log.id)} className="ml-2 px-2 py-1">
                  <Text className="text-text-tertiary text-lg">×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
