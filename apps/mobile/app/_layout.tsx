import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { initializeDatabase, getUserProfile } from '../lib/db/database';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase/client';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  const [dbReady, setDbReady] = useState(false);
  const setOnboardingComplete = useUserStore((s) => s.setOnboardingComplete);
  const setAuth = useUserStore((s) => s.setAuth);

  useEffect(() => {
    initializeDatabase()
      .then(async () => {
        // Restore persisted profile so onboarding/phase survive restarts
        try {
          const profile = await getUserProfile();
          if (profile) {
            setOnboardingComplete({
              phase: profile.phase as any,
              phaseStartDate: profile.phase_start_date ?? undefined,
              dietaryRestrictions: JSON.parse(profile.dietary_restrictions || '[]'),
              preferredCookTime: profile.preferred_cook_time as any,
              householdSize: profile.household_size,
            });
          }
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
        setDbReady(true);
      })
      .catch((err) => {
        console.error('DB init failed:', err);
        setDbReady(true); // allow app to open even if seed fails
      });
  }, [setOnboardingComplete]);

  // Restore auth session + subscribe to changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setAuth(data.session.user.id, data.session.user.email ?? null);
      }
    }).catch(() => {});

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user?.id ?? null, session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [setAuth]);

  useEffect(() => {
    if (fontsLoaded && dbReady) SplashScreen.hideAsync();
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) return null;

  const app = (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="food-check" />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="phase" />
        <Stack.Screen name="food-log" />
        <Stack.Screen name="symptom-log" />
        <Stack.Screen name="ai-dietitian" />
        <Stack.Screen name="shopping-list" />
        <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );

  // On web, constrain to a phone-width centered column so the mobile-first
  // layout doesn't stretch across the full browser window.
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#E5E7EB', alignItems: 'center' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 448, backgroundColor: '#FAFAF7' }}>
          {app}
        </View>
      </View>
    );
  }

  return app;
}
