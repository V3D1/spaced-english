CREATE TABLE "ai_drill_tips" (
	"id" serial PRIMARY KEY NOT NULL,
	"phrase" varchar(255) NOT NULL,
	"tip_type" varchar(16) NOT NULL,
	"tip" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_sentence_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"sentence_practice_id" integer NOT NULL,
	"naturalness" integer NOT NULL,
	"corrected_sentence" text NOT NULL,
	"explanation" text NOT NULL,
	"alternative_phrase" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"feature" varchar(50) NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_weekly_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"week_key" varchar(16) NOT NULL,
	"focus_ids" text NOT NULL,
	"pattern_analysis" text NOT NULL,
	"difficulty_advice" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_sentence_evaluations" ADD CONSTRAINT "ai_sentence_evaluations_sentence_practice_id_sentence_practices_id_fk" FOREIGN KEY ("sentence_practice_id") REFERENCES "public"."sentence_practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_weekly_recommendations" ADD CONSTRAINT "ai_weekly_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_drill_tips_phrase_type_unique" ON "ai_drill_tips" USING btree ("phrase","tip_type");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_sentence_eval_sp_unique" ON "ai_sentence_evaluations" USING btree ("sentence_practice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_weekly_rec_user_week_unique" ON "ai_weekly_recommendations" USING btree ("user_id","week_key");