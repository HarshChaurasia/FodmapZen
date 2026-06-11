import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useUserStore } from '../../store/userStore';
import { PHASE_LABELS, ELIMINATION_PHASE_DAYS } from '@fodmapzen/shared';
import { phaseDaysRemaining } from '@fodmapzen/shared';
import { initializeDatabase } from '../../lib/db/database';
import {
  weekStartISO, getOrCreatePlan, getSlots, type SlotRow,
} from '../../lib/db/mealPlan';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning 👋';
  if (h < 18) return 'Good afternoon 👋';
  return 'Good evening 👋';
}

function todayDayName(): string {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    new Date().getDay()
  ];
}

export default function HomeTab() {
  const { preferences } = useUserStore();
  const phase = preferences?.phase ?? 'unknown';
  const phaseLabel = PHASE_LABELS[phase];
  const [todaySlots, setTodaySlots] = useState<Map<string, SlotRow>>(new Map());

  const daysLeft = preferences?.phaseStartDate
    ? phaseDaysRemaining(preferences.phaseStartDate, ELIMINATION_PHASE_DAYS)
    : null;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      initializeDatabase()
        .then(async () => {
          const plan = await getOrCreatePlan(weekStartISO());
          const slots = await getSlots(plan.id);
          if (cancelled) return;
          const today = todayDayName();
          const map = new Map<string, SlotRow>();
          for (const s of slots) if (s.day_of_week === today) map.set(s.meal_type, s);
          setTodaySlots(map);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="py-6">
          <Text className="text-2xl font-sans-bold text-text-primary">{greeting()}</Text>
          <TouchableOpacity
            onPress={() => router.push('/phase')}
            activeOpacity={0.7}
            className="flex-row items-center mt-2 bg-primary-light rounded-xl px-3 py-2 self-start"
          >
            <Text className="text-primary font-sans-medium text-sm">
              🌿 {phaseLabel}
              {daysLeft != null && phase === 'elimination'
                ? ` — ${daysLeft} days remaining`
                : ''}
              {'  ›'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Meals */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-sans-bold text-text-primary">Today's Meals</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/meal-plan')}>
              <Text className="text-primary font-sans-medium text-sm">Plan week ›</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-3">
            <MealSlotCard label="Breakfast" slot={todaySlots.get('breakfast')} />
            <MealSlotCard label="Lunch" slot={todaySlots.get('lunch')} />
          </View>
          <View className="mt-3">
            <MealSlotCard label="Dinner" slot={todaySlots.get('dinner')} />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-lg font-sans-bold text-text-primary mb-3">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <QuickAction icon="🍽" label="Find Recipe" onPress={() => router.push('/(tabs)/recipes')} />
            <QuickAction icon="🔍" label="Check Food" onPress={() => router.push('/food-check')} />
            <QuickAction icon="📝" label="Log Meal" onPress={() => router.push('/food-log')} />
            <QuickAction icon="🤖" label="AI Dietitian" onPress={() => router.push('/ai-dietitian' as any)} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MealSlotCard({ label, slot }: { label: string; slot?: SlotRow }) {
  return (
    <View className="bg-surface rounded-card border border-border p-4 flex-1">
      <Text className="text-xs font-sans-medium text-text-secondary uppercase tracking-wide mb-2">
        {label}
      </Text>
      {slot ? (
        <TouchableOpacity
          onPress={() => router.push(`/recipe/${slot.recipe_id}`)}
          activeOpacity={0.7}
        >
          <Text className="font-sans-bold text-text-primary text-sm" numberOfLines={2}>
            {slot.recipe_title}
          </Text>
          <Text className="font-sans text-text-tertiary text-xs mt-1">
            ⏱ {(slot.prep_mins ?? 0) + (slot.cook_mins ?? 0)} min
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/meal-plan')}
          className="border border-dashed border-border rounded-lg p-3 items-center"
        >
          <Text className="text-text-tertiary text-sm">+ Add meal</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center gap-2 flex-1 min-w-[44%]"
    >
      <Text className="text-xl">{icon}</Text>
      <Text className="font-sans-medium text-text-primary text-sm">{label}</Text>
    </TouchableOpacity>
  );
}
