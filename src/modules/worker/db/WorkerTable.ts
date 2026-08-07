import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { TenantTable } from "../../tenant/db/TenantTable.js";

export const WorkerTable = pgTable("workers", {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    type: varchar("type").notNull(),
    tenantId: varchar("tenant_id").notNull().references(() => TenantTable.id),
    createdAt: timestamp("created_at").notNull(),
})
