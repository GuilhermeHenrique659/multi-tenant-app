ALTER TABLE "workers" RENAME TO "agents";--> statement-breakpoint
ALTER TABLE "worker_steps" RENAME TO "agent_steps";--> statement-breakpoint
ALTER TABLE "agent_steps" RENAME COLUMN "worker_id" TO "agent_id";--> statement-breakpoint
ALTER TABLE "agents" RENAME CONSTRAINT "workers_pkey" TO "agents_pkey";--> statement-breakpoint
ALTER TABLE "agents" RENAME CONSTRAINT "workers_tenant_id_tenant_id_fk" TO "agents_tenant_id_tenant_id_fk";--> statement-breakpoint
ALTER TABLE "agent_steps" RENAME CONSTRAINT "worker_steps_pkey" TO "agent_steps_pkey";--> statement-breakpoint
ALTER TABLE "agent_steps" RENAME CONSTRAINT "worker_steps_worker_id_workers_id_fk" TO "agent_steps_agent_id_agents_id_fk";
