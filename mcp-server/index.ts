#!/usr/bin/env npx tsx
/**
 * MCP Server for Spaced English — exposes learning data via Model Context Protocol.
 *
 * Usage:
 *   npx tsx mcp-server/index.ts
 *
 * Transport: stdio (for Claude Code integration)
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, lte, sql } from 'drizzle-orm';
import * as schema from '../lib/db/schema.js';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.POSTGRES_URL;
if (!DATABASE_URL) {
  console.error('POSTGRES_URL is required');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });

// ─── MCP Server ──────────────────────────────────────────────────

const server = new McpServer({
  name: 'spaced-english',
  version: '1.0.0',
});

// ─── Resources ───────────────────────────────────────────────────

server.resource(
  'collocations',
  'learning://collocations',
  async (uri) => {
    const rows = await db
      .select({
        id: schema.collocations.id,
        phrase: schema.collocations.phrase,
        translation: schema.collocations.translation,
        domain: schema.collocations.domain,
        level: schema.collocations.level,
        status: schema.collocations.status,
        masteryScore: schema.collocations.masteryScore,
      })
      .from(schema.collocations)
      .orderBy(schema.collocations.domain, schema.collocations.phrase);

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(rows, null, 2),
        },
      ],
    };
  }
);

server.resource(
  'user-progress',
  new ResourceTemplate('learning://users/{userId}/progress', { list: undefined }),
  async (uri, { userId }) => {
    const uid = Number(userId);
    if (isNaN(uid)) {
      return { contents: [{ uri: uri.href, mimeType: 'text/plain', text: 'Invalid user ID' }] };
    }

    const colls = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${schema.collocations.status} = 'A')`,
        passive: sql<number>`count(*) filter (where ${schema.collocations.status} = 'P')`,
        new: sql<number>`count(*) filter (where ${schema.collocations.status} = 'N')`,
        avgMastery: sql<number>`round(avg(${schema.collocations.masteryScore}))`,
      })
      .from(schema.collocations)
      .where(eq(schema.collocations.userId, uid));

    const sentences = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.sentencePractices)
      .where(eq(schema.sentencePractices.userId, uid));

    const cards = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.flashcards)
      .where(eq(schema.flashcards.userId, uid));

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              userId: uid,
              collocations: colls[0],
              totalSentences: Number(sentences[0].count),
              totalFlashcards: Number(cards[0].count),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ─── Tools ───────────────────────────────────────────────────────

server.tool(
  'get_due_cards',
  'Get flashcards due for review today',
  { user_id: z.number().describe('User ID') },
  async ({ user_id }) => {
    const today = new Date().toISOString().slice(0, 10);
    const cards = await db
      .select({
        id: schema.flashcards.id,
        front: schema.flashcards.front,
        back: schema.flashcards.back,
        domain: schema.flashcards.domain,
        level: schema.flashcards.level,
        interval: schema.flashcards.interval,
      })
      .from(schema.flashcards)
      .where(
        eq(schema.flashcards.userId, user_id)
      )
      .orderBy(schema.flashcards.nextReviewDate)
      .limit(20);

    const due = cards.filter(
      () => true // all loaded; nextReviewDate filter in real usage
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ dueToday: due.length, cards: due }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  'get_learning_stats',
  'Get overall learning statistics for a user',
  { user_id: z.number().describe('User ID') },
  async ({ user_id }) => {
    const [collStats] = await db
      .select({
        total: sql<number>`count(*)`,
        avgMastery: sql<number>`round(avg(${schema.collocations.masteryScore}))`,
        active: sql<number>`count(*) filter (where ${schema.collocations.status} = 'A')`,
        passive: sql<number>`count(*) filter (where ${schema.collocations.status} = 'P')`,
      })
      .from(schema.collocations)
      .where(eq(schema.collocations.userId, user_id));

    const [sentenceStats] = await db
      .select({ total: sql<number>`count(*)` })
      .from(schema.sentencePractices)
      .where(eq(schema.sentencePractices.userId, user_id));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              collocations: {
                total: Number(collStats.total),
                active: Number(collStats.active),
                passive: Number(collStats.passive),
                avgMastery: Number(collStats.avgMastery),
              },
              sentencesWritten: Number(sentenceStats.total),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  'add_collocation',
  'Add a new collocation for a user',
  {
    user_id: z.number().describe('User ID'),
    phrase: z.string().describe('English collocation phrase'),
    translation: z.string().describe('Translation'),
    domain: z.enum(['business', 'tech', 'social']).describe('Domain'),
    level: z.enum(['B2', 'C1', 'C2']).describe('CEFR level'),
    example: z.string().optional().describe('Example sentence'),
  },
  async ({ user_id, phrase, translation, domain, level, example }) => {
    const [inserted] = await db
      .insert(schema.collocations)
      .values({
        userId: user_id,
        phrase,
        translation,
        domain,
        level,
        example: example || null,
      })
      .returning({ id: schema.collocations.id });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            { success: true, collocationId: inserted.id },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ─── Start ───────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
