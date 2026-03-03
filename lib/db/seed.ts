import { eq, sql } from 'drizzle-orm';
import { client, db } from './drizzle';
import {
  users,
  phases,
  milestones,
  collocations,
  flashcards,
  sentencePractices,
  activityRecords,
  weeklySummaries,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import {
  buildFlashcardSeedFromCollocations,
  getLearningCollocationSeed,
} from '@/lib/learning/content';

async function getOrCreateSeedUser(seedEmail: string, seedPassword: string) {
  const passwordHash = await hashPassword(seedPassword);
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, seedEmail))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, existing.id));
    return existing;
  }

  const [user] = await db
    .insert(users)
    .values({
      email: seedEmail,
      passwordHash,
    })
    .returning();

  return user;
}

async function seedPhases() {
  const current = await db.select().from(phases).limit(1);
  if (current.length > 0) {
    return;
  }

  await db.insert(phases).values([
    {
      number: 1,
      name: 'Foundation',
      goal: 'Build daily habit, start EF SET baseline, and stabilize repetition.',
      weekStart: 1,
      weekEnd: 2,
    },
    {
      number: 2,
      name: 'Output Ramp',
      goal: 'Increase speaking and writing frequency with weekly output targets.',
      weekStart: 3,
      weekEnd: 6,
    },
    {
      number: 3,
      name: 'Integration',
      goal: 'Integrate domain-specific vocabulary into regular conversations.',
      weekStart: 7,
      weekEnd: 10,
    },
    {
      number: 4,
      name: 'Consolidation',
      goal: 'Polish fluency, boost confidence, and validate progress on C1/C2 material.',
      weekStart: 11,
      weekEnd: 13,
    },
  ]);
}

async function seedMilestones(userId: number) {
  await db.delete(milestones).where(eq(milestones.userId, userId));
  await db.insert(milestones).values([
    { userId, day: 1, description: 'EF SET baseline test completed', type: 'test' },
    { userId, day: 1, description: 'Anki installed and synced', type: 'checkpoint' },
    { userId, day: 7, description: '7-day streak achieved', type: 'checkpoint' },
    { userId, day: 14, description: 'Foundation phase completed', type: 'checkpoint' },
    { userId, day: 21, description: 'First AI conversation session (15 min)', type: 'checkpoint' },
    { userId, day: 28, description: 'Recording #1: 2-min self-intro', type: 'recording' },
    { userId, day: 42, description: 'ChatGPT Voice 5 min without pauses >5s', type: 'checkpoint' },
    { userId, day: 49, description: 'First italki session completed', type: 'checkpoint' },
    { userId, day: 56, description: 'Recording #2: comparison with Day 28', type: 'recording' },
    { userId, day: 63, description: 'All 3 domain vocabulary sprints completed', type: 'checkpoint' },
    { userId, day: 70, description: 'italki 10 min without blocks', type: 'checkpoint' },
    { userId, day: 84, description: 'Recording #3: final assessment', type: 'recording' },
    { userId, day: 90, description: 'EF SET retest + C1 self-check completed', type: 'test' },
  ]);
}

async function resetProgressState(userId: number) {
  await db.delete(activityRecords).where(eq(activityRecords.userId, userId));
  await db.delete(weeklySummaries).where(eq(weeklySummaries.userId, userId));
  await db.delete(sentencePractices).where(eq(sentencePractices.userId, userId));

  await db
    .update(users)
    .set({
      planStartDate: null,
      efSetBaseline: null,
      efSetRetest: null,
    })
    .where(eq(users.id, userId));
}

async function seedLearningContent(userId: number) {
  const today = new Date().toISOString().split('T')[0];
  const collocationSeed = getLearningCollocationSeed();
  const flashcardSeed = buildFlashcardSeedFromCollocations(collocationSeed);

  await db.delete(collocations).where(eq(collocations.userId, userId));
  await db.delete(flashcards).where(eq(flashcards.userId, userId));

  await db.insert(collocations).values(
    collocationSeed.map((item) => ({
      userId,
      phrase: item.phrase,
      translation: item.translation,
      example: item.example,
      domain: item.domain,
      level: item.level,
      category: item.category,
      status: 'N' as const,
      adoptionCount: 0,
      masteryScore: 0,
      totalAttempts: 0,
      correctStreak: 0,
      wrongStreak: 0,
    }))
  );

  await db.insert(flashcards).values(
    flashcardSeed.map((item) => ({
      userId,
      front: item.front,
      back: item.back,
      keyPhrase: item.keyPhrase,
      domain: item.domain,
      level: item.level,
      cardType: item.cardType,
      source: item.source,
      nextReviewDate: today,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    }))
  );
}

async function seed() {
  console.log('Seeding database...');

  const seedEmail = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  const seedPassword = process.env.SEED_USER_PASSWORD;

  if (!seedEmail || !seedPassword) {
    throw new Error(
      'Missing SEED_USER_EMAIL or SEED_USER_PASSWORD. Set both env vars before running db:seed.'
    );
  }

  if (seedPassword.length < 12) {
    throw new Error('SEED_USER_PASSWORD must be at least 12 characters.');
  }

  const user = await getOrCreateSeedUser(seedEmail, seedPassword);
  await seedPhases();
  await resetProgressState(user.id);
  await seedMilestones(user.id);
  await seedLearningContent(user.id);

  const [collocationCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(collocations)
    .where(eq(collocations.userId, user.id));
  const [flashcardCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(flashcards)
    .where(eq(flashcards.userId, user.id));

  console.log(`Seeded user: ${user.email} (id: ${user.id})`);
  console.log(`Collocations loaded: ${Number(collocationCount?.count || 0)}`);
  console.log(`Flashcards loaded: ${Number(flashcardCount?.count || 0)}`);
  console.log('Seed completed successfully!');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end({ timeout: 5 });
  });
