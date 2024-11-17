import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  jsonb,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 })
    .$type<"admin" | "therapist">()
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  usersToAvatars: many(usersToAvatars),
}));

export const avatars = pgTable("avatar", {
  id: serial("id").primaryKey(),
  avatarName: varchar("avatar_name", { length: 50 }).notNull(),
  imageUrl: text("image_url").notNull(),
  idleVideoUrl: text("idle_video_url"),
  elevenlabsVoiceId: text("elevenlabs_voice_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const avatarsRelations = relations(avatars, ({ many }) => ({
  usersToAvatars: many(usersToAvatars),
}));

export const usersToAvatars = pgTable(
  "users_to_avatars",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // Cascades deletion of associations when a user is deleted
    avatarId: integer("avatar_id")
      .notNull()
      .references(() => avatars.id, { onDelete: "restrict" }), // Prevents avatar deletion when associations are removed
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.avatarId] }),
  })
);

export const usersToAvatarsRelations = relations(usersToAvatars, ({ one }) => ({
  avatar: one(avatars, {
    fields: [usersToAvatars.avatarId],
    references: [avatars.id],
  }),
  user: one(users, {
    fields: [usersToAvatars.userId],
    references: [users.id],
  }),
}));

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const meetingSessions = pgTable("meeting_session", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  avatarId: integer("avatar_id").references(() => avatars.id, {
    onDelete: "restrict",
  }),
  meetingLink: varchar("meeting_link", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  didStreamId: text("did_stream_id"),
  didSessionId: text("did_session_id"),
  offer: jsonb("offer"), // (RTCSessionDescriptionInit stored as JSONB)
  iceServers: jsonb("ice_servers"),
});

export type User = typeof users.$inferSelect;
export type UserDto = Omit<User, "passwordHash">;
export type NewUser = typeof users.$inferInsert;

export type Avatar = typeof avatars.$inferSelect;
export type NewAvatar = typeof avatars.$inferInsert;

export type MeetingSession = typeof meetingSessions.$inferSelect;
export type NewMeetingSession = typeof meetingSessions.$inferInsert;
