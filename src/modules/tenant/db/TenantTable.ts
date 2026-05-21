import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const TenantTable = pgTable("tenant", {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    subdomain: varchar("subdomain").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
})