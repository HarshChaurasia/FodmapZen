import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase/client';
import { useUserStore } from '../store/userStore';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const setAuth = useUserStore((s) => s.setAuth);
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validPassword = password.length >= 6;
  const canSubmit = validEmail && validPassword && !loading;

  const submit = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          setAuth(data.user?.id ?? null, data.user?.email ?? null);
          router.back();
        } else {
          setInfo('Account created! Check your email to confirm, then sign in.');
          setMode('signin');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setAuth(data.user?.id ?? null, data.user?.email ?? null);
        router.back();
      }
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <Text className="text-xl font-sans-bold text-text-primary flex-1">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 16 }}>
        <Text className="text-3xl mb-2">🌿</Text>
        <Text className="text-2xl font-sans-bold text-text-primary">
          {mode === 'signin' ? 'Welcome back' : 'Join FodmapZen'}
        </Text>
        <Text className="font-sans text-text-secondary text-sm mt-2 mb-6 leading-relaxed">
          {mode === 'signin'
            ? 'Sign in to sync your meal plans and logs across devices.'
            : 'Create an account to back up and sync your data securely.'}
        </Text>

        <Text className="font-sans-medium text-text-primary text-sm mb-1.5">Email</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 font-sans text-text-primary text-base mb-4"
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          inputMode="email"
        />

        <Text className="font-sans-medium text-text-primary text-sm mb-1.5">Password</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 font-sans text-text-primary text-base"
          placeholder="At least 6 characters"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
            <Text className="font-sans text-red-700 text-sm">{error}</Text>
          </View>
        )}
        {info && (
          <View className="bg-primary-light border border-primary/30 rounded-xl p-3 mt-4">
            <Text className="font-sans text-primary text-sm">{info}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={submit}
          disabled={!canSubmit}
          className="bg-primary rounded-xl py-4 items-center mt-6"
          style={{ opacity: canSubmit ? 1 : 0.5 }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-sans-bold text-base">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }}
          className="items-center mt-4 py-2"
        >
          <Text className="font-sans text-text-secondary text-sm">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Text className="text-primary font-sans-medium">
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </TouchableOpacity>

        <Text className="font-sans text-text-tertiary text-xs text-center mt-6 leading-relaxed">
          Your on-device data works fully offline. An account only adds secure cloud backup and cross-device sync.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
