CREATE TABLE "worker_steps" (
	"id" varchar PRIMARY KEY NOT NULL,
	"worker_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"input" jsonb NOT NULL,
	"step_order" integer NOT NULL,
	"type" varchar NOT NULL,
	"status" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "worker_steps" ADD CONSTRAINT "worker_steps_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;