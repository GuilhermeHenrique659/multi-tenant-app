import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const UserTable = pgTable("user", {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    email: varchar("email").notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    isSuperAdmin: boolean("is_super_admin").notNull().default(false),
    createdAt: timestamp("created_at").notNull(),
});