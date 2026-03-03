import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  date,
  timestamp,
  boolean,
  real,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  planStartDate: date('plan_start_date'),
  efSetBaseline: real('ef_set_baseline'),
  efSetRetest: real('ef_set_retest'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const flashcards = pgTable('flashcards', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  front: text('front').notNull(), // PL
  back: text('back').notNull(), // EN
  keyPhrase: varchar('key_phrase', { length: 255 }),
  domain: varchar('domain', { length: 50 }), // business, tech, social
  level: varchar('level', { length: 8 }).notNull().default('C1'), // B2, C1, C2
  cardType: varchar('card_type', { length: 16 }).notNull().default('sentence'), // word, sentence
  source: varchar('source', { length: 255 }),
  nextReviewDate: date('next_review_date').notNull(),
  interval: integer('interval').notNull().default(1),
  easeFactor: real('ease_factor').notNull().default(2.5),
  repetitions: integer('repetitions').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const flashcardReviews = pgTable('flashcard_reviews', {
  id: serial('id').primaryKey(),
  flashcardId: integer('flashcard_id')
    .references(() => flashcards.id, { onDelete: 'cascade' })
    .notNull(),
  reviewDate: date('review_date').notNull(),
  quality: integer('quality').notNull(), // 0-5
  intervalAfter: integer('interval_after').notNull(),
  easeFactorAfter: real('ease_factor_after').notNull(),
});

export const collocations = pgTable('collocations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  phrase: varchar('phrase', { length: 255 }).notNull(),
  translation: text('translation').notNull(),
  example: text('example'),
  domain: varchar('domain', { length: 50 }).notNull(), // business, tech, social
  level: varchar('level', { length: 8 }).notNull().default('C1'), // B2, C1, C2
  category: varchar('category', { length: 100 }),
  status: varchar('status', { length: 1 }).notNull().default('N'), // N, P, A
  adoptionCount: integer('adoption_count').notNull().default(0),
  masteryScore: integer('mastery_score').notNull().default(0), // 0-100
  totalAttempts: integer('total_attempts').notNull().default(0),
  correctStreak: integer('correct_streak').notNull().default(0),
  wrongStreak: integer('wrong_streak').notNull().default(0),
  flashcardId: integer('flashcard_id').references(() => flashcards.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activityRecords = pgTable('activity_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  date: date('date').notNull(),
  shadowingMins: integer('shadowing_mins').notNull().default(0),
  ankiMins: integer('anki_mins').notNull().default(0),
  aiConvMins: integer('ai_conv_mins').notNull().default(0),
  writingMins: integer('writing_mins').notNull().default(0),
  selfTalkMins: integer('self_talk_mins').notNull().default(0),
  collocationMins: integer('collocation_mins').notNull().default(0),
  totalMins: integer('total_mins').notNull().default(0),
  isBadDay: boolean('is_bad_day').notNull().default(false),
});

export const weeklySummaries = pgTable('weekly_summaries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  weekNumber: integer('week_number').notNull(),
  phase: integer('phase').notNull(),
  streak: integer('streak').notNull().default(0),
  totalMins: integer('total_mins').notNull().default(0),
  wentWell: text('went_well'),
  wasDifficult: text('was_difficult'),
  insightOfWeek: text('insight_of_week'),
  nextFocus: text('next_focus'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const phases = pgTable('phases', {
  id: serial('id').primaryKey(),
  number: integer('number').notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  goal: text('goal').notNull(),
  weekStart: integer('week_start').notNull(),
  weekEnd: integer('week_end').notNull(),
});

export const milestones = pgTable('milestones', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  day: integer('day').notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // checkpoint, recording, test, review
  completed: boolean('completed').notNull().default(false),
  completedDate: date('completed_date'),
});

export const sentencePractices = pgTable('sentence_practices', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  collocationId: integer('collocation_id')
    .references(() => collocations.id)
    .notNull(),
  sentence: text('sentence').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const authLoginAttempts = pgTable(
  'auth_login_attempts',
  {
    id: serial('id').primaryKey(),
    scopeType: varchar('scope_type', { length: 16 }).notNull(), // ip | email
    scopeHash: varchar('scope_hash', { length: 64 }).notNull(),
    success: boolean('success').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    scopeCreatedIdx: index('auth_login_attempts_scope_created_idx').on(
      table.scopeType,
      table.scopeHash,
      table.createdAt
    ),
    createdAtIdx: index('auth_login_attempts_created_at_idx').on(table.createdAt),
  })
);

export const authLockouts = pgTable(
  'auth_lockouts',
  {
    id: serial('id').primaryKey(),
    scopeType: varchar('scope_type', { length: 16 }).notNull(), // ip | email
    scopeHash: varchar('scope_hash', { length: 64 }).notNull(),
    strikeLevel: integer('strike_level').notNull().default(1),
    lockedUntil: timestamp('locked_until').notNull(),
    lastFailedAt: timestamp('last_failed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    scopeUnique: uniqueIndex('auth_lockouts_scope_unique').on(
      table.scopeType,
      table.scopeHash
    ),
    lockedUntilIdx: index('auth_lockouts_locked_until_idx').on(table.lockedUntil),
  })
);

// ─── AI Feature Tables ───────────────────────────────────────────

export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  feature: varchar('feature', { length: 50 }).notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiSentenceEvaluations = pgTable(
  'ai_sentence_evaluations',
  {
    id: serial('id').primaryKey(),
    sentencePracticeId: integer('sentence_practice_id')
      .references(() => sentencePractices.id, { onDelete: 'cascade' })
      .notNull(),
    naturalness: integer('naturalness').notNull(),
    correctedSentence: text('corrected_sentence').notNull(),
    explanation: text('explanation').notNull(),
    alternativePhrase: text('alternative_phrase').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    spUnique: uniqueIndex('ai_sentence_eval_sp_unique').on(
      table.sentencePracticeId
    ),
  })
);

export const aiDrillTips = pgTable(
  'ai_drill_tips',
  {
    id: serial('id').primaryKey(),
    phrase: varchar('phrase', { length: 255 }).notNull(),
    tipType: varchar('tip_type', { length: 16 }).notNull(), // 'correct' | 'incorrect'
    tip: text('tip').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    phraseTipUnique: uniqueIndex('ai_drill_tips_phrase_type_unique').on(
      table.phrase,
      table.tipType
    ),
  })
);

export const aiWeeklyRecommendations = pgTable(
  'ai_weekly_recommendations',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    weekKey: varchar('week_key', { length: 16 }).notNull(), // e.g. '2026-W09'
    focusIds: text('focus_ids').notNull(), // JSON array of collocation IDs
    patternAnalysis: text('pattern_analysis').notNull(),
    difficultyAdvice: text('difficulty_advice').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userWeekUnique: uniqueIndex('ai_weekly_rec_user_week_unique').on(
      table.userId,
      table.weekKey
    ),
  })
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Flashcard = typeof flashcards.$inferSelect;
export type NewFlashcard = typeof flashcards.$inferInsert;
export type Collocation = typeof collocations.$inferSelect;
export type ActivityRecord = typeof activityRecords.$inferSelect;
export type WeeklySummary = typeof weeklySummaries.$inferSelect;
export type Phase = typeof phases.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type SentencePractice = typeof sentencePractices.$inferSelect;
export type AuthLoginAttempt = typeof authLoginAttempts.$inferSelect;
export type AuthLockout = typeof authLockouts.$inferSelect;
export type AIUsageLog = typeof aiUsageLogs.$inferSelect;
export type AISentenceEvaluation = typeof aiSentenceEvaluations.$inferSelect;
export type AIDrillTip = typeof aiDrillTips.$inferSelect;
export type AIWeeklyRecommendation = typeof aiWeeklyRecommendations.$inferSelect;
