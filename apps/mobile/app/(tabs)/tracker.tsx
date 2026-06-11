import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../../store/userStore';

const TRACKER_ITEMS = [
  {
    id: 'ai-dietitian',
    icon: '🤖',
    title: 'AI Dietitian',
    description: 'Ask anything — foods, meals, eating out',
    locked: 'premium' as const,
    route: '/ai-dietitian',
  },
  {
    id: 'food-check',
    icon: '🔍',
    title: 'Check a Food',
    description: 'Search 200+ foods with FODMAP ratings',
    locked: false,
    route: '/food-check',
  },
  {
    id: 'food-log',
    icon: '📝',
    title: 'Food Log',
    description: 'Log what you\'ve eaten today',
    locked: false,
    route: '/food-log',
  },
  {
    id: 'symptom-diary',
    icon: '📊',
    title: 'Symptom Diary',
    description: 'Track bloating, pain, stress and more',
    locked: false,
    route: '/symptom-log',
  },
  {
    id: 'reintroduction',
    icon: '🔬',
    title: 'Reintroduction Tracker',
    description: 'Guided 3-day food testing protocol',
    locked: true,
    route: null,
  },
];

export default function TrackerTab() {
  const { subscriptionTier } = useUserStore();
  const isPremium = subscriptionTier === 'premium';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          <Text className="text-2xl font-sans-bold text-text-primary">Tracker</Text>
          <Text className="text-sm font-sans text-text-secondary mt-1">
            Monitor your diet & symptoms
          </Text>
        </View>

        {TRACKER_ITEMS.map((item) => {
          // 'premium'-locked items unlock for premium users; `true` stays locked.
          const locked = item.locked === 'premium' ? !isPremium : !!item.locked;
          return (
            <TrackerCard
              key={item.id}
              icon={item.icon}
              title={item.title}
              description={item.description}
              locked={locked}
              onPress={
                locked
                  ? () => router.push('/paywall')
                  : item.route
                  ? () => router.push(item.route as any)
                  : undefined
              }
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function TrackerCard({
  icon, title, description, locked, onPress,
}: {
  icon: string;
  title: string;
  description: string;
  locked: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="bg-surface border border-border rounded-card p-4 mb-3 flex-row items-center"
      style={{ opacity: locked ? 0.85 : 1 }}
    >
      <View className="bg-primary-light rounded-xl w-12 h-12 items-center justify-center mr-4">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-sans-bold text-text-primary text-base">{title}</Text>
          {locked && (
            <View className="bg-accent-yellow/20 rounded px-2 py-0.5">
              <Text className="text-xs font-sans-medium text-amber-700">Premium</Text>
            </View>
          )}
        </View>
        <Text className="font-sans text-text-secondary text-sm mt-0.5">{description}</Text>
      </View>
      {!locked && onPress && (
        <Text className="text-text-tertiary text-lg">›</Text>
      )}
      {locked && (
        <Text className="text-text-tertiary text-base">🔒</Text>
      )}
    </TouchableOpacity>
  );
}
