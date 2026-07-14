import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { ProjectTable } from "./ProjectTable.js";
import { UserTable } from "../../user/db/UserTable.js";

export const TaskTable = pgTable("tasks", {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    status: varchar("status").notNull(),
    startAt: timestamp("start_at"),
    endAt: timestamp('end_at'),
    projectId: varchar("project_id").notNull().references(() => ProjectTable.id),
    assigneeId: varchar('assignee_id').references(() => UserTable.id),
    createdAt: timestamp("created_at").notNull(),
})