CREATE TABLE "sentence_practices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"collocation_id" integer NOT NULL,
	"sentence" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sentence_practices" ADD CONSTRAINT "sentence_practices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentence_practices" ADD CONSTRAINT "sentence_practices_collocation_id_collocations_id_fk" FOREIGN KEY ("collocation_id") REFERENCES "public"."collocations"("id") ON DELETE no action ON UPDATE no action;