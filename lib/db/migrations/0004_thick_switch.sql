ALTER TABLE "collocations" ADD COLUMN "mastery_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "collocations" ADD COLUMN "total_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "collocations" ADD COLUMN "correct_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "collocations" ADD COLUMN "wrong_streak" integer DEFAULT 0 NOT NULL;