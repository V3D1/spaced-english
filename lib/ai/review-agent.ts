import 'server-only';
import { getAnthropicClient, AI_MODEL } from './client';
import { db } from '@/lib/db/drizzle';
import {
  collocations,
  sentencePractices,
  flashcards,
  flashcardReviews,
} from '@/lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import type Anthropic from '@anthropic-ai/sdk';

const MAX_ITERATIONS = 5;

// ─── Tool Definitions ────────────────────────────────────────────

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_collocation_stats',
    description:
      'Get overview of all collocations: mastery scores, status distribution, streaks, and domains.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_recent_drill_performance',
    description:
      'Get drill performance from the last 14 days: attempts, accuracy, hardest phrases.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_flashcard_review_history',
    description:
      'Get flashcard review stats: quality distribution, leech cards (many low ratings).',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_practice_sentence_count',
    description:
      'Get number of practice sentences written per collocation.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'submit_recommendations',
    description:
      'Submit the final weekly recommendations. Call this LAST after analyzing all data.',
    input_schema: {
      type: 'object' as const,
      properties: {
        focus_collocation_ids: {
          type: 'array',
          items: { type: 'number' },
          description:
            'IDs of 3-5 collocations the learner should focus on this week.',
        },
        pattern_analysis: {
          type: 'string',
          description:
            '2-3 sentences analyzing patterns in the learner\'s performance.',
        },
        difficulty_advice: {
          type: 'string',
          description:
            '2-3 sentences of advice on adjusting difficulty or approach.',
        },
      },
      required: [
        'focus_collocation_ids',
        'pattern_analysis',
        'difficulty_advice',
      ],
    },
  },
];

// ─── Tool Handlers ───────────────────────────────────────────────

async function handleToolCall(
  toolName: string,
  userId: number
): Promise<string> {
  switch (toolName) {
    case 'get_collocation_stats': {
      const rows = await db
        .select({
          id: collocations.id,
          phrase: collocations.phrase,
          domain: collocations.domain,
          level: collocations.level,
          status: collocations.status,
          masteryScore: collocations.masteryScore,
          totalAttempts: collocations.totalAttempts,
          correctStreak: collocations.correctStreak,
          wrongStreak: collocations.wrongStreak,
        })
        .from(collocations)
        .where(eq(collocations.userId, userId));

      const statusCounts = { N: 0, P: 0, A: 0 };
      for (const r of rows) {
        statusCounts[r.status as 'N' | 'P' | 'A']++;
      }

      const weakest = rows
        .filter((r) => r.totalAttempts > 0)
        .sort((a, b) => a.masteryScore - b.masteryScore)
        .slice(0, 10);

      return JSON.stringify({
        total: rows.length,
        statusDistribution: statusCounts,
        avgMastery:
          rows.length > 0
            ? Math.round(
                rows.reduce((sum, r) => sum + r.masteryScore, 0) / rows.length
              )
            : 0,
        weakest: weakest.map((r) => ({
          id: r.id,
          phrase: r.phrase,
          domain: r.domain,
          mastery: r.masteryScore,
          wrongStreak: r.wrongStreak,
        })),
      });
    }

    case 'get_recent_drill_performance': {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const rows = await db
        .select({
          phrase: collocations.phrase,
          id: collocations.id,
          totalAttempts: collocations.totalAttempts,
          masteryScore: collocations.masteryScore,
          correctStreak: collocations.correctStreak,
          wrongStreak: collocations.wrongStreak,
        })
        .from(collocations)
        .where(
          and(
            eq(collocations.userId, userId),
            gte(collocations.totalAttempts, 1)
          )
        )
        .orderBy(desc(collocations.totalAttempts))
        .limit(20);

      return JSON.stringify({
        recentlyDrilled: rows.map((r) => ({
          id: r.id,
          phrase: r.phrase,
          attempts: r.totalAttempts,
          mastery: r.masteryScore,
          correctStreak: r.correctStreak,
          wrongStreak: r.wrongStreak,
        })),
      });
    }

    case 'get_flashcard_review_history': {
      const reviews = await db
        .select({
          quality: flashcardReviews.quality,
          count: sql<number>`count(*)`,
        })
        .from(flashcardReviews)
        .innerJoin(flashcards, eq(flashcardReviews.flashcardId, flashcards.id))
        .where(eq(flashcards.userId, userId))
        .groupBy(flashcardReviews.quality);

      // Find leech cards (cards with many Again/Hard ratings)
      const leechCards = await db
        .select({
          front: flashcards.front,
          back: flashcards.back,
          lowCount: sql<number>`count(*) filter (where ${flashcardReviews.quality} <= 2)`,
        })
        .from(flashcardReviews)
        .innerJoin(flashcards, eq(flashcardReviews.flashcardId, flashcards.id))
        .where(eq(flashcards.userId, userId))
        .groupBy(flashcards.id, flashcards.front, flashcards.back)
        .having(sql`count(*) filter (where ${flashcardReviews.quality} <= 2) >= 3`)
        .limit(5);

      return JSON.stringify({
        qualityDistribution: reviews.map((r) => ({
          quality: r.quality,
          count: Number(r.count),
        })),
        leechCards: leechCards.map((c) => ({
          front: c.front,
          back: c.back,
          lowRatingCount: Number(c.lowCount),
        })),
      });
    }

    case 'get_practice_sentence_count': {
      const counts = await db
        .select({
          collocationId: sentencePractices.collocationId,
          phrase: collocations.phrase,
          count: sql<number>`count(*)`,
        })
        .from(sentencePractices)
        .innerJoin(
          collocations,
          eq(sentencePractices.collocationId, collocations.id)
        )
        .where(eq(sentencePractices.userId, userId))
        .groupBy(sentencePractices.collocationId, collocations.phrase);

      return JSON.stringify({
        sentencesPerCollocation: counts.map((c) => ({
          id: c.collocationId,
          phrase: c.phrase,
          sentences: Number(c.count),
        })),
        totalSentences: counts.reduce((sum, c) => sum + Number(c.count), 0),
      });
    }

    default:
      return JSON.stringify({ error: 'Unknown tool' });
  }
}

// ─── Agent Loop ──────────────────────────────────────────────────

export interface AgentRecommendations {
  focusIds: number[];
  patternAnalysis: string;
  difficultyAdvice: string;
}

export async function runReviewAgent(
  userId: number
): Promise<{ recommendations: AgentRecommendations; inputTokens: number; outputTokens: number }> {
  const client = getAnthropicClient();

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  let messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content:
        'Analyze my English learning progress and provide weekly recommendations. ' +
        'Use the available tools to gather data about my collocations, drills, flashcards, and practice sentences. ' +
        'Then submit your recommendations using submit_recommendations.',
    },
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      system:
        'You are a learning analytics agent for an English learning app. ' +
        'Your job is to analyze the learner\'s performance data and identify areas for improvement. ' +
        'Call the data tools first to gather information, then call submit_recommendations with your analysis. ' +
        'Be specific about which collocations to focus on and why.',
      messages,
      tools: AGENT_TOOLS,
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    // Check if agent called submit_recommendations
    const submitBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === 'tool_use' && block.name === 'submit_recommendations'
    );

    if (submitBlock) {
      const input = submitBlock.input as Record<string, unknown>;
      return {
        recommendations: {
          focusIds: (input.focus_collocation_ids as number[]) || [],
          patternAnalysis: String(input.pattern_analysis || ''),
          difficultyAdvice: String(input.difficulty_advice || ''),
        },
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      };
    }

    // Process tool calls
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUseBlocks.length === 0) {
      // No tool calls and no submit — force exit
      break;
    }

    // Add assistant message with all content blocks
    messages.push({ role: 'assistant', content: response.content });

    // Add tool results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const result = await handleToolCall(block.name, userId);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: result,
      });
    }

    messages.push({ role: 'user', content: toolResults });

    // If stop_reason is end_turn (no more tool calls expected)
    if (response.stop_reason === 'end_turn') {
      break;
    }
  }

  // Fallback if agent didn't submit
  return {
    recommendations: {
      focusIds: [],
      patternAnalysis: 'Unable to generate analysis. Please try again.',
      difficultyAdvice: '',
    },
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
  };
}
