CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"status" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"status" varchar NOT NULL,
	"start_at" timestamp,
	"end_at" timestamp,
	"project_id" varchar NOT NULL,
	"assignee_id" varchar,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;