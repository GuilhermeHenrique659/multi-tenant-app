import { pgTable, primaryKey, varchar } from "drizzle-orm/pg-core";
import { TenantTable } from "./TenantTable.js";
import { UserTable } from "../../user/db/UserTable.js";

export const MembershipTable = pgTable("membership", {
    tenantId: varchar("tenant_id").notNull().references(() => TenantTable.id),
    role: varchar("role").notNull(),
    userId: varchar("user_id").notNull().references(() => UserTable.id),
    
}, (t) => [primaryKey({ name: "pk_membership", columns: [t.tenantId, t.userId] })])