CREATE TABLE "membership" (
	"tenant_id" varchar NOT NULL,
	"role" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	CONSTRAINT "pk_membership" PRIMARY KEY("tenant_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "max_number_of_members" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;