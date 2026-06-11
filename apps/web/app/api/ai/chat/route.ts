import Anthropic from '@anthropic-ai/sdk';
import type { NextRequest } from 'next/server';
import { corsJson, corsPreflight } from '../../../../lib/cors';

export const runtime = 'nodejs';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatTurn[];
  context?: {
    phase?: string;
    phaseDay?: number | null;
    dietaryRestrictions?: string[];
    safeGroups?: string[];
  };
}

const MAX_TURNS = 20;
const MAX_MESSAGE_CHARS = 4000;

function buildSystemPrompt(ctx: ChatRequest['context']): string {
  const restrictions = ctx?.dietaryRestrictions?.length
    ? ctx.dietaryRestrictions.join(', ')
    : 'none';
  const phase = ctx?.phase && ctx.phase !== 'unknown' ? ctx.phase : 'not set';
  const phaseDay =
    ctx?.phaseDay != null ? `They are on day ${ctx.phaseDay} of this phase.` : '';

  return `You are the FodmapZen AI Dietitian — a friendly, evidence-based assistant inside a low-FODMAP meal-planning app for people with IBS.

User context:
- Current FODMAP phase: ${phase}. ${phaseDay}
- Dietary restrictions: ${restrictions}

What you do:
- Answer "can I eat X?" questions with the food's typical FODMAP profile, WHY it is high/low (which subgroup: fructans, GOS, lactose, fructose, sorbitol, mannitol), serving-size nuance, and a safe swap.
- Suggest meal ideas and simple day plans that fit the user's phase and restrictions. Prefer simple whole-food meals with explicit low-FODMAP ingredients.
- Explain reintroduction protocol questions (3-day testing, one subgroup at a time, washout days).
- Give restaurant ordering tips (no onion/garlic, sauces on the side, plain proteins, rice over wheat).

Rules:
- General FODMAP levels are common knowledge, but exact tested gram thresholds vary by source — speak in qualitative terms ("small servings are usually tolerated") rather than citing precise lab-tested gram cutoffs.
- You are not a medical professional. For diagnosis, medication, severe/red-flag symptoms (bleeding, weight loss, fever, night symptoms), tell the user to see a doctor or registered dietitian.
- During elimination, err on the side of caution. During maintenance, personalize using the user's tolerated groups if provided.
- Be concise and warm. Use short paragraphs or bullets. No long lectures.`;
}

function mockReply(lastUser: string): string {
  return (
    `(Demo mode — no AI key configured on the server)\n\n` +
    `You asked: "${lastUser.slice(0, 120)}"\n\n` +
    `Here's how this will work once connected: I'll answer with the food's FODMAP profile, why it's rated that way, serving-size nuance, and a safe swap — personalized to your phase and dietary restrictions.\n\n` +
    `Example: Garlic is high-FODMAP (fructans). Swap in garlic-infused olive oil — fructans aren't oil-soluble, so you keep the flavour without the FODMAPs.`
  );
}

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return corsJson({ error: 'Invalid JSON body' }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return corsJson({ error: 'messages array is required' }, 400);
  }

  const turns = body.messages
    .slice(-MAX_TURNS)
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') {
    return corsJson({ error: 'last message must be from the user' }, 400);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return corsJson({ reply: mockReply(turns[turns.length - 1].content), mock: true });
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: buildSystemPrompt(body.context),
      messages: turns,
    });

    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    return corsJson({ reply, mock: false });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`AI chat error ${error.status}:`, error.message);
      return corsJson({ error: 'AI service error, please try again' }, 502);
    }
    console.error('AI chat unexpected error:', error);
    return corsJson({ error: 'Unexpected server error' }, 500);
  }
}
