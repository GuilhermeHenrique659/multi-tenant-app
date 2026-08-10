import { integer, jsonb, pgTable, varchar } from "drizzle-orm/pg-core";
import { WorkerTable } from "./WorkerTable.js";

export const WorkerStepTable = pgTable("worker_steps", {
    id: varchar("id").primaryKey(),
    workerId: varchar("worker_id").notNull().references(() => WorkerTable.id),
    action: varchar("action").notNull(),
    input: jsonb("input").notNull(),
    answer: varchar("answer"),
    order: integer("step_order").notNull(),
    type: varchar("type").notNull(),
    status: varchar("status").notNull(),
    /** Why the step failed, so the plan can be analysed again with the reason. */
    error: varchar("error"),
})
