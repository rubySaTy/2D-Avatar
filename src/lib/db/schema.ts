import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 })
    .$type<"admin" | "therapist">()
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const avatarTable = pgTable("avatar", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => userTable.id)
    .notNull(),
  avatarName: varchar("avatar_name", { length: 50 }).notNull(),
  imageUrl: text("image_url").notNull(),
  idleVideoUrl: text("idle_video_url"),
  elevenlabsVoiceId: text("elevenlabs_voice_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meetingSessionTable = pgTable("meeting_session", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => userTable.id),
  avatarId: serial("avatar_id").references(() => avatarTable.id),
  meetingLink: varchar("meeting_link", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  didStreamId: text("did_stream_id"),
  didSessionId: text("did_session_id"),
  offer: jsonb("offer"), // (RTCSessionDescriptionInit stored as JSONB)
  iceServers: jsonb("ice_servers"),
});

export type User = typeof userTable.$inferSelect;
export type NewUser = typeof userTable.$inferInsert;

export type Avatar = typeof avatarTable.$inferSelect;
export type NewAvatar = typeof avatarTable.$inferInsert;

export type MeetingSession = typeof meetingSessionTable.$inferSelect;
export type NewMeetingSession = typeof meetingSessionTable.$inferInsert;
