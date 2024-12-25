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
  real,
  customType,
} from "drizzle-orm/pg-core";
import { decrypt, encrypt } from "../cryptoHelpers";
import { type CipherKey } from "ably";

const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
};

TODO: "Add user versioning for optimistic concurrency control?";
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "therapist"] }).notNull(),
  credits: real("credits").default(40).notNull(),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  ...timestamps,
});

export const usersRelations = relations(users, ({ many }) => ({
  usersToAvatars: many(usersToAvatars),
  meetingSessions: many(meetingSessions),
  creditTransactions: many(creditTransactions),
}));

export const avatars = pgTable("avatar", {
  id: serial("id").primaryKey(),
  avatarName: varchar("avatar_name", { length: 50 }).notNull(),
  imageUrl: text("image_url").notNull(),
  imageKey: text("image_key").notNull(),
  idleVideoUrl: text("idle_video_url"),
  idleVideoKey: text("idle_video_key"),
  elevenlabsClonedVoiceId: text("elevenlabs_cloned_voice_id"),
  ...timestamps,
});

export const avatarsRelations = relations(avatars, ({ many }) => ({
  usersToAvatars: many(usersToAvatars),
  meetingSessions: many(meetingSessions),
}));

export const usersToAvatars = pgTable(
  "users_to_avatars",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    avatarId: integer("avatar_id")
      .notNull()
      .references(() => avatars.id, { onDelete: "cascade" }),
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

export const encryptedKey = customType<{ data: CipherKey }>({
  dataType() {
    return "text";
  },
  fromDriver(value: unknown) {
    if (typeof value !== "string")
      throw new Error("Expected a string from the database");
    const decryptedValue = decrypt(value); // returns the base64 string
    return Buffer.from(decryptedValue, "base64");
  },
  toDriver(value: CipherKey) {
    const base64Value = value.toString("base64");
    return encrypt(base64Value);
  },
});

export const meetingSessions = pgTable("meeting_session", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  avatarId: integer("avatar_id")
    .notNull()
    .references(() => avatars.id, { onDelete: "cascade" }),
  meetingLink: varchar("meeting_link", { length: 255 }).notNull().unique(),
  didStreamId: text("did_stream_id"),
  didSessionId: text("did_session_id"),
  offer: jsonb("offer"), // (RTCSessionDescriptionInit stored as JSONB)
  iceServers: jsonb("ice_servers"),
  cipherKey: encryptedKey("cipher_key").notNull(),
  ...timestamps,
});

export const meetingSessionsRelations = relations(
  meetingSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [meetingSessions.userId],
      references: [users.id],
    }),
    avatar: one(avatars, {
      fields: [meetingSessions.avatarId],
      references: [avatars.id],
    }),
    talks: many(talks),
  })
);

export const talks = pgTable("talk", {
  id: varchar("id", { length: 50 }).primaryKey(),
  meetingSessionId: integer("meeting_session_id")
    .notNull()
    .references(() => meetingSessions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const talksRelations = relations(talks, ({ one }) => ({
  meetingSession: one(meetingSessions, {
    fields: [talks.meetingSessionId],
    references: [meetingSessions.id],
  }),
}));

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(), // Positive for addition, negative for removal
  reason: varchar("reason", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creditTransactionsRelations = relations(
  creditTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [creditTransactions.userId],
      references: [users.id],
    }),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserDto = Omit<
  User,
  "passwordHash" | "resetToken" | "resetTokenExpires"
>;

export type Avatar = typeof avatars.$inferSelect;
export type NewAvatar = typeof avatars.$inferInsert;

export type MeetingSession = typeof meetingSessions.$inferSelect;
export type NewMeetingSession = typeof meetingSessions.$inferInsert;

export type Talk = typeof talks.$inferSelect;
export type NewTalk = typeof talks.$inferInsert;

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
