import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { ELIMINATION_PHASE_DAYS, phaseDaysRemaining } from '@fodmapzen/shared';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AI_API_URL = process.env.EXPO_PUBLIC_AI_API_URL ?? 'http://localhost:3000';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    "Hi! I'm your AI dietitian. Ask me anything about the low-FODMAP diet — \"can I eat hummus?\", \"give me a quick dinner idea\", or \"what should I order at a Thai place?\" 🌿",
};

const SUGGESTIONS = [
  'Can I eat garlic bread?',
  'Quick low-FODMAP dinner idea',
  'What can I order at an Italian restaurant?',
  'Explain the reintroduction phase',
];

export default function AiDietitianScreen() {
  const { subscriptionTier, preferences } = useUserStore();
  const isPremium = subscriptionTier === 'premium';

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!isPremium) router.replace('/paywall');
  }, [isPremium]);

  if (!isPremium) return null;

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const next: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setSending(true);

    try {
      const daysIntoPhase =
        preferences?.phaseStartDate != null
          ? ELIMINATION_PHASE_DAYS -
            phaseDaysRemaining(preferences.phaseStartDate, ELIMINATION_PHASE_DAYS)
          : null;

      const res = await fetch(`${AI_API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Skip the local welcome message — the API expects user-first turns.
          messages: next.slice(1),
          context: {
            phase: preferences?.phase ?? 'unknown',
            phaseDay: daysIntoPhase,
            dietaryRestrictions: preferences?.dietaryRestrictions ?? [],
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setMessages([...next, { role: 'assistant', content: json.reply }]);
    } catch {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content:
            "Sorry — I couldn't reach the AI service. Check your connection and try again. (In development, make sure the web server is running: pnpm web)",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-2 pb-3 flex-row items-center gap-3 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface border border-border"
        >
          <Text className="text-text-primary text-lg">‹</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-sans-bold text-text-primary">AI Dietitian 🌿</Text>
          <Text className="text-xs font-sans text-text-tertiary">Personalized low-FODMAP guidance</Text>
        </View>
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, i) => (
            <ChatBubble key={i} message={m} />
          ))}

          {sending && (
            <View className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 self-start mb-3 flex-row items-center gap-2">
              <ActivityIndicator size="small" />
              <Text className="text-text-tertiary font-sans text-sm">Thinking…</Text>
            </View>
          )}

          {messages.length === 1 && !sending && (
            <View className="mt-2">
              <Text className="text-xs font-sans-medium text-text-tertiary uppercase tracking-wide mb-2">
                Try asking
              </Text>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => send(s)}
                  className="bg-surface border border-border rounded-xl px-4 py-3 mb-2"
                >
                  <Text className="text-primary font-sans-medium text-sm">{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View className="border-t border-border bg-surface px-4 py-3 flex-row items-end gap-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about a food, meal, or symptom…"
            placeholderTextColor="#9ca3af"
            multiline
            className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 font-sans text-text-primary text-sm max-h-24"
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            onPress={() => send(input)}
            disabled={sending || !input.trim()}
            className="bg-primary rounded-xl px-4 py-2.5"
            style={{ opacity: sending || !input.trim() ? 0.5 : 1 }}
          >
            <Text className="text-white font-sans-bold text-sm">Send</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-background px-4 py-1.5">
          <Text className="text-[10px] text-text-tertiary font-sans text-center">
            General education only — not medical advice. See a doctor or RD for clinical questions.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View
      className={
        isUser
          ? 'bg-primary rounded-2xl rounded-tr-sm px-4 py-3 self-end mb-3 max-w-[85%]'
          : 'bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 self-start mb-3 max-w-[85%]'
      }
    >
      <Text className={isUser ? 'text-white font-sans text-sm leading-5' : 'text-text-primary font-sans text-sm leading-5'}>
        {message.content}
      </Text>
    </View>
  );
}
