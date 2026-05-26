import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const TenantTable = pgTable("tenant", {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    subdomain: varchar("subdomain").notNull().unique(),
    maxNumberOfMembers: integer("max_number_of_members").notNull().default(0),
    createdAt: timestamp("created_at").notNull(),
})