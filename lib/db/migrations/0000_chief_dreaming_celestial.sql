CREATE TABLE "activity_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"shadowing_mins" integer DEFAULT 0 NOT NULL,
	"anki_mins" integer DEFAULT 0 NOT NULL,
	"ai_conv_mins" integer DEFAULT 0 NOT NULL,
	"writing_mins" integer DEFAULT 0 NOT NULL,
	"self_talk_mins" integer DEFAULT 0 NOT NULL,
	"collocation_mins" integer DEFAULT 0 NOT NULL,
	"total_mins" integer DEFAULT 0 NOT NULL,
	"is_bad_day" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"phrase" varchar(255) NOT NULL,
	"translation" text NOT NULL,
	"example" text,
	"domain" varchar(50) NOT NULL,
	"category" varchar(100),
	"status" varchar(1) DEFAULT 'N' NOT NULL,
	"adoption_count" integer DEFAULT 0 NOT NULL,
	"flashcard_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcard_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"flashcard_id" integer NOT NULL,
	"review_date" date NOT NULL,
	"quality" integer NOT NULL,
	"interval_after" integer NOT NULL,
	"ease_factor_after" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"key_phrase" varchar(255),
	"domain" varchar(50),
	"source" varchar(255),
	"next_review_date" date NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"day" integer NOT NULL,
	"description" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_date" date
);
--> statement-breakpoint
CREATE TABLE "phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"goal" text NOT NULL,
	"week_start" integer NOT NULL,
	"week_end" integer NOT NULL,
	CONSTRAINT "phases_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"plan_start_date" date,
	"ef_set_baseline" real,
	"ef_set_retest" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weekly_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"week_number" integer NOT NULL,
	"phase" integer NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"total_mins" integer DEFAULT 0 NOT NULL,
	"went_well" text,
	"was_difficult" text,
	"insight_of_week" text,
	"next_focus" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_records" ADD CONSTRAINT "activity_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collocations" ADD CONSTRAINT "collocations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collocations" ADD CONSTRAINT "collocations_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_summaries" ADD CONSTRAINT "weekly_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;