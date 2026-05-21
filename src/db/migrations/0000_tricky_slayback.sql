CREATE TABLE "tenant" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"subdomain" varchar NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "tenant_subdomain_unique" UNIQUE("subdomain")
);
