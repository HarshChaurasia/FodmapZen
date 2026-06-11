import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, TextInput,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/userStore';
import { initializeDatabase, getRecipes, type RecipeRow } from '../../lib/db/database';
import {
  DAYS_OF_WEEK, PLANNER_MEAL_TYPES, type PlannerDay, type PlannerMealType,
  weekStartISO, getOrCreatePlan, getSlots, setSlot, removeSlot, clearWeek,
  autoGenerateWeek, generateShoppingList, type SlotRow, type MealPlanRow,
} from '../../lib/db/mealPlan';

const DAY_LABELS: Record<PlannerDay, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const MEAL_META: Record<PlannerMealType, { label: string; icon: string }> = {
  breakfast: { label: 'Breakfast', icon: '🌅' },
  lunch: { label: 'Lunch', icon: '🥗' },
  dinner: { label: 'Dinner', icon: '🍽️' },
  snack: { label: 'Snack', icon: '🍎' },
};

function todayPlannerDay(): PlannerDay {
  const idx = (new Date().getDay() + 6) % 7; // Monday = 0
  return DAYS_OF_WEEK[idx];
}

export default function MealPlanTab() {
  const { subscriptionTier, preferences } = useUserStore();
  const isPremium = subscriptionTier === 'premium';

  if (!isPremium) return <PremiumGate />;
  return <Planner householdSize={preferences?.householdSize ?? 2} />;
}

function Planner({ householdSize }: { householdSize: number }) {
  const [plan, setPlan] = useState<MealPlanRow | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [activeDay, setActiveDay] = useState<PlannerDay>(todayPlannerDay());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [picker, setPicker] = useState<{ day: PlannerDay; mealType: PlannerMealType } | null>(null);

  const reload = useCallback(async () => {
    const p = await getOrCreatePlan(weekStartISO());
    setPlan(p);
    setSlots(await getSlots(p.id));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      initializeDatabase().then(reload);
    }, [reload])
  );

  const slotsByDay = useMemo(() => {
    const map = new Map<string, SlotRow>();
    for (const s of slots) map.set(`${s.day_of_week}|${s.meal_type}`, s);
    return map;
  }, [slots]);

  const plannedCount = slots.length;

  const handleAutoFill = async () => {
    if (!plan) return;
    setGenerating(true);
    try {
      await autoGenerateWeek(plan.id);
      await generateShoppingList(plan.id);
      await reload();
    } finally {
      setGenerating(false);
    }
  };

  const confirmAutoFill = () => {
    if (plannedCount === 0) return void handleAutoFill();
    if (Platform.OS === 'web') {
      // Alert with buttons is a no-op on react-native-web
      if (window.confirm('Replace your current plan with a fresh week?')) handleAutoFill();
    } else {
      Alert.alert('Replace plan?', 'Auto-fill will replace your current week.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', style: 'destructive', onPress: handleAutoFill },
      ]);
    }
  };

  const handleRemove = async (slotId: string) => {
    await removeSlot(slotId);
    if (plan) await generateShoppingList(plan.id);
    await reload();
  };

  const handlePick = async (recipe: RecipeRow) => {
    if (!plan || !picker) return;
    await setSlot(plan.id, picker.day, picker.mealType, recipe.id, householdSize);
    await generateShoppingList(plan.id);
    setPicker(null);
    await reload();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#2D7A4F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-sans-bold text-text-primary">Meal Plan</Text>
          <Text className="text-sm font-sans text-text-secondary mt-0.5">
            {plannedCount > 0 ? `${plannedCount} meals planned this week` : 'Plan your week ahead'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/shopping-list' as any)}
          className="bg-primary-light rounded-xl w-11 h-11 items-center justify-center"
          accessibilityLabel="Shopping list"
        >
          <Ionicons name="cart-outline" size={22} color="#2D7A4F" />
        </TouchableOpacity>
      </View>

      {/* Day selector */}
      <View className="px-4 pt-2">
        <View className="flex-row bg-surface border border-border rounded-xl p-1">
          {DAYS_OF_WEEK.map((day) => {
            const active = day === activeDay;
            const has = PLANNER_MEAL_TYPES.some((m) => slotsByDay.has(`${day}|${m}`));
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setActiveDay(day)}
                className={`flex-1 items-center py-2 rounded-lg ${active ? 'bg-primary' : ''}`}
              >
                <Text className={`text-xs font-sans-medium ${active ? 'text-white' : 'text-text-secondary'}`}>
                  {DAY_LABELS[day]}
                </Text>
                <View
                  className="w-1 h-1 rounded-full mt-1"
                  style={{ backgroundColor: has ? (active ? '#fff' : '#2D7A4F') : 'transparent' }}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false}>
        {PLANNER_MEAL_TYPES.map((mealType) => {
          const slot = slotsByDay.get(`${activeDay}|${mealType}`);
          const meta = MEAL_META[mealType];
          return (
            <View key={mealType} className="mb-3">
              <Text className="text-xs font-sans-medium text-text-tertiary uppercase tracking-wider mb-1.5">
                {meta.icon}  {meta.label}
              </Text>
              {slot ? (
                <TouchableOpacity
                  onPress={() => router.push(`/recipe/${slot.recipe_id}`)}
                  className="bg-surface border border-border rounded-card p-4 flex-row items-center"
                  activeOpacity={0.7}
                >
                  <View className="flex-1 pr-2">
                    <Text className="font-sans-bold text-text-primary text-base" numberOfLines={2}>
                      {slot.recipe_title}
                    </Text>
                    <Text className="font-sans text-text-secondary text-xs mt-1">
                      ⏱ {(slot.prep_mins ?? 0) + (slot.cook_mins ?? 0)} min
                      {slot.calories ? `  ·  ${Math.round(slot.calories)} kcal` : ''}
                      {`  ·  ${slot.servings} serv.`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(slot.id)}
                    className="p-2 -mr-1"
                    accessibilityLabel={`Remove ${slot.recipe_title}`}
                  >
                    <Ionicons name="close-circle" size={22} color="#9CA3AF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setPicker({ day: activeDay, mealType })}
                  className="border border-dashed border-border rounded-card py-4 items-center bg-surface/50"
                  activeOpacity={0.7}
                >
                  <Text className="font-sans-medium text-primary text-sm">+ Add {meta.label.toLowerCase()}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Actions */}
        <TouchableOpacity
          onPress={confirmAutoFill}
          disabled={generating}
          className="bg-primary rounded-xl py-4 items-center mt-2 flex-row justify-center"
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-sans-bold text-base">✨ Auto-Fill My Week</Text>
          )}
        </TouchableOpacity>
        {plannedCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/shopping-list' as any)}
            className="border border-primary rounded-xl py-3.5 items-center mt-3"
          >
            <Text className="text-primary font-sans-bold text-sm">🛒 View Shopping List</Text>
          </TouchableOpacity>
        )}
        <View className="h-8" />
      </ScrollView>

      <RecipePickerModal
        visible={!!picker}
        mealType={picker?.mealType ?? 'dinner'}
        onClose={() => setPicker(null)}
        onPick={handlePick}
      />
    </SafeAreaView>
  );
}

function RecipePickerModal({
  visible, mealType, onClose, onPick,
}: {
  visible: boolean;
  mealType: PlannerMealType;
  onClose: () => void;
  onPick: (recipe: RecipeRow) => void;
}) {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    getRecipes({ mealType, isPremium: true, limit: 100 }).then(setRecipes);
  }, [visible, mealType]);

  const filtered = query.trim()
    ? recipes.filter((r) => r.title.toLowerCase().includes(query.trim().toLowerCase()))
    : recipes;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-background rounded-t-3xl max-h-[80%] min-h-[55%]">
          <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
            <Text className="text-lg font-sans-bold text-text-primary">
              Choose a {MEAL_META[mealType].label.toLowerCase()}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1" accessibilityLabel="Close">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View className="px-4 pb-2">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search recipes…"
              placeholderTextColor="#9CA3AF"
              className="bg-surface border border-border rounded-xl px-4 py-3 font-sans text-text-primary"
            />
          </View>
          <ScrollView className="px-4" keyboardShouldPersistTaps="handled">
            {filtered.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => onPick(r)}
                className="bg-surface border border-border rounded-card p-3.5 mb-2 flex-row items-center"
              >
                <View className="flex-1 pr-2">
                  <Text className="font-sans-medium text-text-primary text-sm">{r.title}</Text>
                  <Text className="font-sans text-text-tertiary text-xs mt-0.5">
                    ⏱ {r.prep_mins + r.cook_mins} min · {r.difficulty}
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={22} color="#2D7A4F" />
              </TouchableOpacity>
            ))}
            {filtered.length === 0 && (
              <Text className="text-center text-text-tertiary font-sans py-8">No recipes found</Text>
            )}
            <View className="h-8" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PremiumGate() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-5xl mb-4">📅</Text>
        <Text className="text-xl font-sans-bold text-text-primary mb-3 text-center">
          Weekly Meal Planner
        </Text>
        <Text className="text-text-secondary font-sans text-center mb-6 leading-6">
          Plan your entire week with one tap. Auto-generate meals, build your shopping list,
          and never wonder "what's for dinner?" again.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/paywall')}
          className="bg-primary rounded-xl px-6 py-4 w-full items-center"
        >
          <Text className="text-white font-sans-bold text-base">Start 14-Day Free Trial</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/paywall')} className="mt-3 py-2">
          <Text className="text-primary font-sans-medium text-sm">See all Premium features</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
