import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../../store/userStore';
import { PHASE_LABELS } from '@fodmapzen/shared';
import { supabase } from '../../lib/supabase/client';

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  'ad-free': 'Ad-Free',
  premium: 'Premium',
};

export default function ProfileTab() {
  const { subscriptionTier, preferences, userEmail, supabaseUserId, setAuth, setSubscriptionTier } = useUserStore();

  const isFreeTier = subscriptionTier === 'free';
  const signedIn = !!supabaseUserId;

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch {}
    setAuth(null, null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          <Text className="text-2xl font-sans-bold text-text-primary">Profile</Text>
        </View>

        {/* Subscription Banner */}
        {isFreeTier ? (
          <View className="bg-primary rounded-card p-4 mb-6">
            <Text className="text-white font-sans-bold text-base mb-1">
              Upgrade to Premium
            </Text>
            <Text className="text-white/80 font-sans text-sm mb-3">
              100+ recipes, meal planner, reintroduction tracker & restaurant guide
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/paywall')}
              className="bg-white rounded-lg px-4 py-2 self-start"
            >
              <Text className="text-primary font-sans-bold text-sm">
                Start Free Trial →
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-primary-light border border-primary/30 rounded-card p-4 mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-primary font-sans-bold text-base">✨ Premium active</Text>
              <Text className="text-text-secondary font-sans text-xs mt-0.5">All features unlocked</Text>
            </View>
          </View>
        )}

        {/* Settings Sections */}
        <SettingsSection title="Diet Settings">
          <SettingsRow
            label="Current Phase"
            value={preferences ? PHASE_LABELS[preferences.phase] : 'Not set'}
            onPress={() => router.push('/phase')}
          />
          <SettingsRow label="Household Size" value={String(preferences?.householdSize ?? 2)} />
          <SettingsRow label="Dietary Restrictions" value="Edit" />
        </SettingsSection>

        <SettingsSection title="Account">
          {signedIn ? (
            <>
              <SettingsRow label="Signed in as" value={userEmail ?? 'Account'} />
              <SettingsRow label="Sign Out" value="→" onPress={signOut} />
            </>
          ) : (
            <SettingsRow label="Sign In / Create Account" value="→" onPress={() => router.push('/auth')} />
          )}
          <SettingsRow
            label="Subscription"
            value={TIER_LABELS[subscriptionTier] ?? 'Free'}
            onPress={isFreeTier ? () => router.push('/paywall') : undefined}
          />
          {!isFreeTier && (
            <SettingsRow label="Cancel Premium (test)" value="→" onPress={() => setSubscriptionTier('free')} />
          )}
        </SettingsSection>

        <SettingsSection title="Tools">
          <SettingsRow label="Restaurant Guide" value="→" />
          <SettingsRow label="Export My Data" value="→" />
          <SettingsRow label="Notifications" value="→" />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsRow label="Help & FAQ" value="→" />
          <SettingsRow label="Privacy Policy" value="→" />
          <SettingsRow label="App Version" value="1.0.0" />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-xs font-sans-medium text-text-tertiary uppercase tracking-wider mb-2 px-1">
        {title}
      </Text>
      <View className="bg-surface rounded-card border border-border overflow-hidden">
        {children}
      </View>
    </View>
  );
}

function SettingsRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="flex-row items-center justify-between px-4 py-3 border-b border-border last:border-b-0"
    >
      <Text className="font-sans text-text-primary text-base">{label}</Text>
      <Text className="font-sans text-text-secondary text-sm">{value}</Text>
    </TouchableOpacity>
  );
}
