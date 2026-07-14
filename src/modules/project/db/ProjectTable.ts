import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { TenantTable } from "../../tenant/db/TenantTable.js";

export const ProjectTable = pgTable("projects", {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    status: varchar("status").notNull(),
    tenantId: varchar("tenant_id").notNull().references(() => TenantTable.id),
    createdAt: timestamp("created_at").notNull(),
})