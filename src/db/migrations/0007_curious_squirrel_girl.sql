ALTER TABLE "worker_steps" ADD COLUMN "error" varchar;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "user_prompt" varchar DEFAULT '' NOT NULL;