CREATE TABLE "auth_lockouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope_type" varchar(16) NOT NULL,
	"scope_hash" varchar(64) NOT NULL,
	"strike_level" integer DEFAULT 1 NOT NULL,
	"locked_until" timestamp NOT NULL,
	"last_failed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope_type" varchar(16) NOT NULL,
	"scope_hash" varchar(64) NOT NULL,
	"success" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "auth_lockouts_scope_unique" ON "auth_lockouts" USING btree ("scope_type","scope_hash");--> statement-breakpoint
CREATE INDEX "auth_lockouts_locked_until_idx" ON "auth_lockouts" USING btree ("locked_until");--> statement-breakpoint
CREATE INDEX "auth_login_attempts_scope_created_idx" ON "auth_login_attempts" USING btree ("scope_type","scope_hash","created_at");--> statement-breakpoint
CREATE INDEX "auth_login_attempts_created_at_idx" ON "auth_login_attempts" USING btree ("created_at");