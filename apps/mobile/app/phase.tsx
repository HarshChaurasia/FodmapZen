import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { saveUserProfile } from '../lib/db/database';
import {
  ELIMINATION_PHASE_DAYS,
  phaseDaysRemaining,
  type UserPhase,
} from '@fodmapzen/shared';

const PHASES: { value: UserPhase; emoji: string; title: string; desc: string }[] = [
  { value: 'elimination', emoji: '🌱', title: 'Elimination', desc: 'Strict low-FODMAP for 2–6 weeks to calm symptoms.' },
  { value: 'reintroduction', emoji: '🔬', title: 'Reintroduction', desc: 'Systematically test each FODMAP group.' },
  { value: 'maintenance', emoji: '🌿', title: 'Maintenance', desc: 'A personalised long-term diet around your triggers.' },
  { value: 'unknown', emoji: '🤔', title: 'Not sure yet', desc: "I'm still figuring out where I am." },
];

export default function PhaseScreen() {
  const { preferences, updatePreferences } = useUserStore();
  const [phase, setPhase] = useState<UserPhase>(preferences?.phase ?? 'elimination');
  const [saving, setSaving] = useState(false);

  const currentStart = preferences?.phaseStartDate;
  const daysLeft =
    phase === 'elimination' && currentStart
      ? phaseDaysRemaining(currentStart, ELIMINATION_PHASE_DAYS)
      : null;
  const elapsed =
    phase === 'elimination' && currentStart
      ? ELIMINATION_PHASE_DAYS - (daysLeft ?? 0)
      : 0;
  const progress = Math.min(1, Math.max(0, elapsed / ELIMINATION_PHASE_DAYS));

  const save = async () => {
    setSaving(true);
    // Reset start date when switching INTO elimination (or starting fresh)
    const phaseStartDate =
      phase === 'elimination'
        ? preferences?.phase === 'elimination' && currentStart
          ? currentStart
          : new Date().toISOString().slice(0, 10)
        : preferences?.phaseStartDate;

    const next = {
      phase,
      phaseStartDate,
      dietaryRestrictions: preferences?.dietaryRestrictions ?? [],
      preferredCookTime: preferences?.preferredCookTime ?? 'any',
      householdSize: preferences?.householdSize ?? 2,
    };
    try {
      await saveUserProfile(next);
    } catch (err) {
      console.error('Failed to save phase:', err);
    }
    updatePreferences({ phase, phaseStartDate });
    setSaving(false);
    router.back();
  };

  const restartElimination = () => {
    const today = new Date().toISOString().slice(0, 10);
    updatePreferences({ phase: 'elimination', phaseStartDate: today });
    setPhase('elimination');
    saveUserProfile({
      phase: 'elimination',
      phaseStartDate: today,
      dietaryRestrictions: preferences?.dietaryRestrictions ?? [],
      preferredCookTime: preferences?.preferredCookTime ?? 'any',
      householdSize: preferences?.householdSize ?? 2,
    }).catch((e) => console.error(e));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-2 pb-3 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface border border-border"
        >
          <Text className="text-text-primary text-lg">‹</Text>
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-text-primary flex-1">My Phase</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Elimination progress card */}
        {phase === 'elimination' && currentStart && (
          <View className="bg-primary rounded-card p-5 mb-5">
            <Text className="text-white/80 font-sans-medium text-xs uppercase tracking-wide">Elimination Phase</Text>
            <Text className="text-white font-sans-bold text-3xl mt-1">
              {daysLeft === 0 ? 'Complete!' : `${daysLeft} days left`}
            </Text>
            <Text className="text-white/80 font-sans text-sm mt-1">
              Day {Math.max(1, elapsed)} of {ELIMINATION_PHASE_DAYS}
            </Text>
            <View className="h-2 bg-white/25 rounded-full mt-4 overflow-hidden">
              <View className="h-2 bg-white rounded-full" style={{ width: `${progress * 100}%` }} />
            </View>
            {daysLeft === 0 && (
              <Text className="text-white/90 font-sans text-xs mt-3 leading-relaxed">
                🎉 You've completed the minimum elimination period. Consider moving to Reintroduction to find your triggers.
              </Text>
            )}
            <TouchableOpacity onPress={restartElimination} className="mt-4 self-start">
              <Text className="text-white/90 font-sans-medium text-xs underline">Restart timer from today</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text className="font-sans-bold text-text-primary text-base mb-3">Change phase</Text>
        <View className="gap-3">
          {PHASES.map((p) => {
            const selected = phase === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                onPress={() => setPhase(p.value)}
                activeOpacity={0.8}
                className={`rounded-card border p-4 flex-row items-center ${
                  selected ? 'bg-primary-light border-primary' : 'bg-surface border-border'
                }`}
              >
                <Text className="text-2xl mr-3">{p.emoji}</Text>
                <View className="flex-1">
                  <Text className={`font-sans-bold text-base ${selected ? 'text-primary' : 'text-text-primary'}`}>{p.title}</Text>
                  <Text className="font-sans text-text-secondary text-xs mt-0.5 leading-relaxed">{p.desc}</Text>
                </View>
                <View
                  className={`w-5 h-5 rounded-full border-2 ${
                    selected ? 'border-primary bg-primary' : 'border-border'
                  } items-center justify-center`}
                >
                  {selected ? <Text className="text-white text-[10px]">✓</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-4 pb-4 pt-2">
        <TouchableOpacity
          onPress={save}
          disabled={saving}
          className="bg-primary rounded-xl py-4 items-center"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          <Text className="text-white font-sans-bold text-base">{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
