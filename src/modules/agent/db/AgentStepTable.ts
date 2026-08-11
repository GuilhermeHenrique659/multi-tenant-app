import { integer, jsonb, pgTable, varchar } from "drizzle-orm/pg-core";
import { AgentTable } from "./AgentTable.js";

export const AgentStepTable = pgTable("agent_steps", {
    id: varchar("id").primaryKey(),
    agentId: varchar("agent_id").notNull().references(() => AgentTable.id),
    action: varchar("action").notNull(),
    input: jsonb("input").notNull(),
    answer: varchar("answer"),
    order: integer("step_order").notNull(),
    type: varchar("type").notNull(),
    status: varchar("status").notNull(),
    /** Why the step failed, so the plan can be analysed again with the reason. */
    error: varchar("error"),
})
