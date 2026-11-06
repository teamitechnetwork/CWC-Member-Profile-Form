import { createInsertSchema } from "drizzle-zod";
import { jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const memberProfilesTable = pgTable("cwc_member_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile: jsonb("profile").$type<Record<string, unknown>>().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertMemberProfileSchema = createInsertSchema(
  memberProfilesTable,
).omit({ id: true, submittedAt: true });

export type InsertMemberProfile = z.infer<typeof insertMemberProfileSchema>;
export type MemberProfile = typeof memberProfilesTable.$inferSelect;
