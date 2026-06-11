import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../../store/userStore';
import { saveUserProfile } from '../../lib/db/database';
import type { UserPhase, DietaryRestriction } from '@fodmapzen/shared';

const PHASES: { value: UserPhase; emoji: string; title: string; desc: string }[] = [
  { value: 'elimination', emoji: '🌱', title: 'Elimination', desc: 'Cutting out high-FODMAP foods (usually 2–6 weeks)' },
  { value: 'reintroduction', emoji: '🔬', title: 'Reintroduction', desc: 'Testing FODMAP groups one at a time' },
  { value: 'maintenance', emoji: '🌿', title: 'Maintenance', desc: 'Living long-term with your known triggers' },
  { value: 'unknown', emoji: '🤔', title: 'Just starting out', desc: "I'm new and not sure where I am yet" },
];

const RESTRICTIONS: { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'nut-free', label: 'Nut-free' },
  { value: 'egg-free', label: 'Egg-free' },
];

const COOK_TIMES: { value: 'quick' | 'medium' | 'any'; label: string; desc: string }[] = [
  { value: 'quick', label: 'Quick', desc: 'Under 15 minutes' },
  { value: 'medium', label: 'Medium', desc: 'Up to 30 minutes' },
  { value: 'any', label: 'Any', desc: "Time isn't a problem" },
];

export default function Onboarding() {
  const setOnboardingComplete = useUserStore((s) => s.setOnboardingComplete);
  const [step, setStep] = useState(0);

  const [phase, setPhase] = useState<UserPhase>('elimination');
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>([]);
  const [cookTime, setCookTime] = useState<'quick' | 'medium' | 'any'>('any');
  const [household, setHousehold] = useState(2);
  const [saving, setSaving] = useState(false);

  const TOTAL_STEPS = 4;

  const toggleRestriction = (r: DietaryRestriction) => {
    setRestrictions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const finish = async () => {
    setSaving(true);
    const phaseStartDate =
      phase === 'elimination' ? new Date().toISOString().slice(0, 10) : undefined;
    const prefs = {
      phase,
      phaseStartDate,
      dietaryRestrictions: restrictions,
      preferredCookTime: cookTime,
      householdSize: household,
    };
    try {
      await saveUserProfile(prefs);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
    setOnboardingComplete(prefs);
    router.replace('/(tabs)');
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else finish();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Progress */}
      <View className="px-4 pt-4 pb-2 flex-row items-center gap-2">
        {step > 0 ? (
          <TouchableOpacity onPress={() => setStep((s) => s - 1)} className="pr-1">
            <Text className="text-text-secondary text-lg">‹</Text>
          </TouchableOpacity>
        ) : null}
        <View className="flex-1 flex-row gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <StepWrap
            title="Where are you in your FODMAP journey?"
            subtitle="This helps us tailor recipes and tracking to your stage."
          >
            {PHASES.map((p) => (
              <SelectCard
                key={p.value}
                emoji={p.emoji}
                title={p.title}
                desc={p.desc}
                selected={phase === p.value}
                onPress={() => setPhase(p.value)}
              />
            ))}
          </StepWrap>
        )}

        {step === 1 && (
          <StepWrap
            title="Any dietary preferences?"
            subtitle="We'll prioritise recipes that fit. Select all that apply — or none."
          >
            <View className="flex-row flex-wrap gap-2">
              {RESTRICTIONS.map((r) => {
                const active = restrictions.includes(r.value);
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => toggleRestriction(r.value)}
                    className={`px-4 py-3 rounded-xl border ${
                      active ? 'bg-primary border-primary' : 'bg-surface border-border'
                    }`}
                  >
                    <Text className={`font-sans-medium text-sm ${active ? 'text-white' : 'text-text-secondary'}`}>
                      {active ? '✓ ' : ''}{r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </StepWrap>
        )}

        {step === 2 && (
          <StepWrap
            title="How much time for cooking?"
            subtitle="We'll surface recipes that match your pace."
          >
            {COOK_TIMES.map((c) => (
              <SelectCard
                key={c.value}
                title={c.label}
                desc={c.desc}
                selected={cookTime === c.value}
                onPress={() => setCookTime(c.value)}
              />
            ))}
          </StepWrap>
        )}

        {step === 3 && (
          <StepWrap
            title="How many people are you cooking for?"
            subtitle="Recipe quantities and shopping lists will scale to suit."
          >
            <View className="bg-surface border border-border rounded-card p-6 items-center mt-2">
              <Text className="text-6xl font-sans-bold text-primary">{household}</Text>
              <Text className="font-sans text-text-secondary text-sm mt-1 mb-6">
                {household === 1 ? 'person' : 'people'}
              </Text>
              <View className="flex-row items-center gap-8">
                <TouchableOpacity
                  onPress={() => setHousehold((h) => Math.max(1, h - 1))}
                  className="w-12 h-12 items-center justify-center rounded-full bg-background border border-border"
                >
                  <Text className="text-text-primary text-2xl">−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setHousehold((h) => Math.min(12, h + 1))}
                  className="w-12 h-12 items-center justify-center rounded-full bg-primary"
                >
                  <Text className="text-white text-2xl">+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </StepWrap>
        )}
      </ScrollView>

      {/* CTA */}
      <View className="px-5 pb-4 pt-2">
        <TouchableOpacity
          onPress={next}
          disabled={saving}
          className="bg-primary rounded-xl py-4 items-center"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          <Text className="text-white font-sans-bold text-base">
            {step < TOTAL_STEPS - 1 ? 'Continue' : saving ? 'Setting up…' : "Let's go 🎉"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StepWrap({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="text-2xl font-sans-bold text-text-primary leading-tight">{title}</Text>
      <Text className="font-sans text-text-secondary text-sm mt-2 mb-5 leading-relaxed">{subtitle}</Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}

function SelectCard({
  emoji, title, desc, selected, onPress,
}: {
  emoji?: string;
  title: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`rounded-card border p-4 flex-row items-center ${
        selected ? 'bg-primary-light border-primary' : 'bg-surface border-border'
      }`}
    >
      {emoji ? <Text className="text-2xl mr-3">{emoji}</Text> : null}
      <View className="flex-1">
        <Text className={`font-sans-bold text-base ${selected ? 'text-primary' : 'text-text-primary'}`}>{title}</Text>
        <Text className="font-sans text-text-secondary text-xs mt-0.5 leading-relaxed">{desc}</Text>
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
}
