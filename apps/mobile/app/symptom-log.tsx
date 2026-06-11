import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getSymptomLogByDate, upsertSymptomLog } from '../lib/db/database';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function prettyDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

const SEVERITY_LABELS = ['None', 'Mild', 'Moderate', 'Strong', 'Severe'];
const SEVERITY_COLORS = ['#E5E7EB', '#A7F3D0', '#FDE68A', '#FCA5A5', '#EF4444'];

const SYMPTOMS = [
  { key: 'bloating', label: 'Bloating', emoji: '🎈' },
  { key: 'gas', label: 'Gas', emoji: '💨' },
  { key: 'pain', label: 'Abdominal pain', emoji: '⚡' },
  { key: 'stressLevel', label: 'Stress level', emoji: '🧠' },
  { key: 'sleepQuality', label: 'Poor sleep', emoji: '😴' },
] as const;

type SymptomKey = (typeof SYMPTOMS)[number]['key'];

// Bristol Stool Scale 1–7
const BRISTOL = [
  { type: 1, desc: 'Hard lumps' },
  { type: 2, desc: 'Lumpy sausage' },
  { type: 3, desc: 'Cracked sausage' },
  { type: 4, desc: 'Smooth & soft' },
  { type: 5, desc: 'Soft blobs' },
  { type: 6, desc: 'Mushy' },
  { type: 7, desc: 'Watery' },
];

export default function SymptomLogScreen() {
  const date = todayISO();
  const [values, setValues] = useState<Record<SymptomKey, number>>({
    bloating: 0, gas: 0, pain: 0, stressLevel: 0, sleepQuality: 0,
  });
  const [stoolType, setStoolType] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSymptomLogByDate(date).then((row) => {
      if (row) {
        setValues({
          bloating: row.bloating, gas: row.gas, pain: row.pain,
          stressLevel: row.stress_level, sleepQuality: row.sleep_quality,
        });
        setStoolType(row.stool_type);
        setNotes(row.notes ?? '');
      }
      setLoaded(true);
    });
  }, [date]);

  const setVal = (key: SymptomKey, v: number) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await upsertSymptomLog({
        date,
        bloating: values.bloating,
        gas: values.gas,
        pain: values.pain,
        stoolType,
        stressLevel: values.stressLevel,
        sleepQuality: values.sleepQuality,
        notes: notes.trim() || null,
      });
    } catch (err) {
      console.error('Failed to save symptom log:', err);
    }
    setSaving(false);
    router.back();
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
        <View className="flex-1">
          <Text className="text-xl font-sans-bold text-text-primary">Symptom Diary</Text>
          <Text className="font-sans text-text-tertiary text-xs">{prettyDate(date)}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
        {SYMPTOMS.map((s) => (
          <View key={s.key} className="mb-5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-sans-medium text-text-primary text-sm">
                {s.emoji} {s.label}
              </Text>
              <Text className="font-sans text-text-secondary text-xs">
                {SEVERITY_LABELS[values[s.key]]}
              </Text>
            </View>
            <View className="flex-row gap-2">
              {SEVERITY_LABELS.map((_, i) => {
                const active = values[s.key] === i;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setVal(s.key, i)}
                    className="flex-1 h-10 rounded-lg items-center justify-center border"
                    style={{
                      backgroundColor: active ? SEVERITY_COLORS[i] : '#FFFFFF',
                      borderColor: active ? SEVERITY_COLORS[i] : '#E5E7EB',
                    }}
                  >
                    <Text className="font-sans-medium text-xs" style={{ color: active && i >= 2 ? '#1F2937' : active ? '#1B5C38' : '#9CA3AF' }}>
                      {i}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Bristol stool scale */}
        <Text className="font-sans-medium text-text-primary text-sm mb-2 mt-1">💩 Stool type (Bristol scale)</Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {BRISTOL.map((b) => {
            const active = stoolType === b.type;
            return (
              <Pressable
                key={b.type}
                onPress={() => setStoolType(active ? null : b.type)}
                className={`px-3 py-2 rounded-lg border ${active ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
              >
                <Text className={`font-sans-bold text-xs ${active ? 'text-white' : 'text-text-primary'}`}>
                  Type {b.type}
                </Text>
                <Text className={`font-sans text-[10px] ${active ? 'text-white/80' : 'text-text-tertiary'}`}>
                  {b.desc}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Notes */}
        <Text className="font-sans-medium text-text-primary text-sm mb-2">📝 Notes</Text>
        <View className="bg-surface border border-border rounded-card px-4 py-3 mb-2">
          <TextInput
            className="font-sans text-text-primary text-base"
            placeholder="Anything else? Foods, stress, medications…"
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>
      </ScrollView>

      <View className="px-4 pb-4 pt-2">
        <TouchableOpacity
          onPress={save}
          disabled={saving || !loaded}
          className="bg-primary rounded-xl py-4 items-center"
          style={{ opacity: saving || !loaded ? 0.6 : 1 }}
        >
          <Text className="text-white font-sans-bold text-base">{saving ? 'Saving…' : 'Save entry'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
