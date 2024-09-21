import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  userId: serial("user_id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).$type<"admin" | "user">().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const avatars = pgTable("avatars", {
  avatarId: serial("avatar_id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.userId)
    .notNull(),
  avatarName: varchar("avatar_name", { length: 50 }).notNull(),
  imageUrl: text("image_url").notNull(),
  voiceSampleUrl: text("voice_sample_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  sessionId: serial("session_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId),
  avatarId: integer("avatar_id").references(() => avatars.avatarId),
  meetingLink: varchar("meeting_link", { length: 255 }).notNull().unique(),
  emotionalTone: varchar("emotional_tone", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Avatar = typeof avatars.$inferSelect;
export type NewAvatar = typeof avatars.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
