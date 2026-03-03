ALTER TABLE "collocations" ADD COLUMN "level" varchar(8) DEFAULT 'C1' NOT NULL;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "level" varchar(8) DEFAULT 'C1' NOT NULL;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "card_type" varchar(16) DEFAULT 'sentence' NOT NULL;