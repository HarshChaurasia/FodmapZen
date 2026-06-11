import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';

const FEATURES = [
  { icon: '📅', title: 'Weekly Meal Planner', desc: 'Auto-generate a full low-FODMAP week in one tap' },
  { icon: '🛒', title: 'Smart Shopping Lists', desc: 'Built from your plan, grouped by aisle' },
  { icon: '🔬', title: 'Reintroduction Tracker', desc: 'Guided 3-day testing for every FODMAP group' },
  { icon: '🍽️', title: '100+ Premium Recipes', desc: 'Dietitian-verified, beyond the free library' },
  { icon: '🍴', title: 'Restaurant Guide', desc: 'Safe choices across 15 cuisines' },
  { icon: '📊', title: 'Full Symptom History', desc: 'Trends, exports, and 30-day insights' },
];

type Plan = 'annual' | 'monthly';

export default function PaywallScreen() {
  const setSubscriptionTier = useUserStore((s) => s.setSubscriptionTier);
  const [plan, setPlan] = useState<Plan>('annual');
  const [loading, setLoading] = useState(false);

  const startTrial = async () => {
    setLoading(true);
    // NOTE: Real purchase flow runs through RevenueCat on native builds.
    // On web / Expo Go we grant Premium locally so the gated features are testable.
    await new Promise((r) => setTimeout(r, 600));
    setSubscriptionTier('premium');
    setLoading(false);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-2 pb-1 flex-row items-center justify-end">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 items-center justify-center">
          <Text className="text-text-tertiary text-xl">×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="items-center mb-6">
          <Text className="text-5xl mb-3">🌿</Text>
          <Text className="text-2xl font-sans-bold text-text-primary text-center">
            FodmapZen Premium
          </Text>
          <Text className="font-sans text-text-secondary text-sm text-center mt-2 leading-relaxed">
            Everything you need to plan, shop, and reintroduce with confidence.
          </Text>
        </View>

        {/* Features */}
        <View className="gap-3 mb-6">
          {FEATURES.map((f) => (
            <View key={f.title} className="flex-row items-start gap-3 bg-surface border border-border rounded-card p-3.5">
              <Text className="text-2xl">{f.icon}</Text>
              <View className="flex-1">
                <Text className="font-sans-bold text-text-primary text-sm">{f.title}</Text>
                <Text className="font-sans text-text-secondary text-xs mt-0.5 leading-relaxed">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <PlanOption
          selected={plan === 'annual'}
          onPress={() => setPlan('annual')}
          title="Annual"
          price="$59.99/yr"
          sub="$5.00/mo · best value"
          badge="Save 37%"
        />
        <PlanOption
          selected={plan === 'monthly'}
          onPress={() => setPlan('monthly')}
          title="Monthly"
          price="$7.99/mo"
          sub="Cancel anytime"
        />
      </ScrollView>

      <View className="px-5 pb-4 pt-2">
        <TouchableOpacity
          onPress={startTrial}
          disabled={loading}
          className="bg-primary rounded-xl py-4 items-center"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-white font-sans-bold text-base">
            {loading ? 'Starting…' : 'Start 14-Day Free Trial'}
          </Text>
        </TouchableOpacity>
        <Text className="font-sans text-text-tertiary text-[11px] text-center mt-2">
          Free for 14 days, then {plan === 'annual' ? '$59.99/year' : '$7.99/month'}. Cancel anytime.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function PlanOption({
  selected, onPress, title, price, sub, badge,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  sub: string;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-card border-2 p-4 mb-3 flex-row items-center ${
        selected ? 'border-primary bg-primary-light' : 'border-border bg-surface'
      }`}
    >
      <View
        className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
          selected ? 'border-primary bg-primary' : 'border-border'
        }`}
      >
        {selected ? <Text className="text-white text-[10px]">✓</Text> : null}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-sans-bold text-text-primary text-base">{title}</Text>
          {badge && (
            <View className="bg-primary rounded px-1.5 py-0.5">
              <Text className="text-white font-sans-medium text-[10px]">{badge}</Text>
            </View>
          )}
        </View>
        <Text className="font-sans text-text-secondary text-xs mt-0.5">{sub}</Text>
      </View>
      <Text className="font-sans-bold text-text-primary text-base">{price}</Text>
    </Pressable>
  );
}
