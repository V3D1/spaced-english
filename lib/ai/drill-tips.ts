import 'server-only';
import { db } from '@/lib/db/drizzle';
import { aiDrillTips } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getAnthropicClient, AI_MODEL_FAST, isAIEnabled } from './client';

type TipType = 'correct' | 'incorrect';

export async function getDrillTip(
  phrase: string,
  tipType: TipType
): Promise<string | null> {
  if (!isAIEnabled()) return null;

  // Check cache first
  const [cached] = await db
    .select({ tip: aiDrillTips.tip })
    .from(aiDrillTips)
    .where(
      and(eq(aiDrillTips.phrase, phrase), eq(aiDrillTips.tipType, tipType))
    )
    .limit(1);

  if (cached) return cached.tip;

  // Cache miss — call Haiku
  const prompt =
    tipType === 'correct'
      ? `The learner correctly recalled the English collocation "${phrase}". Give a brief tip (1-2 sentences) about its usage nuance, register, or common collocates. Be specific and practical.`
      : `The learner failed to recall the English collocation "${phrase}". Give a brief tip (1-2 sentences) with a mnemonic or explanation of why this phrase works in English. Help them remember it next time.`;

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: AI_MODEL_FAST,
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });

  const tip =
    response.content[0].type === 'text' ? response.content[0].text : '';

  // Persist to cache (onConflictDoNothing for concurrent writes)
  const inserted = await db
    .insert(aiDrillTips)
    .values({ phrase, tipType, tip })
    .onConflictDoNothing()
    .returning({ tip: aiDrillTips.tip });

  // If conflict (another request won), read their value
  if (inserted.length === 0) {
    const [fallback] = await db
      .select({ tip: aiDrillTips.tip })
      .from(aiDrillTips)
      .where(
        and(eq(aiDrillTips.phrase, phrase), eq(aiDrillTips.tipType, tipType))
      )
      .limit(1);
    return fallback?.tip ?? tip;
  }

  return inserted[0].tip;
}
