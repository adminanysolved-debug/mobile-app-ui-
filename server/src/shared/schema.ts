import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "bronze",
  "silver",
  "gold",
  "platinum",
]);

export const dreamTypeEnum = pgEnum("dream_type", [
  "personal",
  "challenge",
  "group",
]);

export const dreamPrivacyEnum = pgEnum("dream_privacy", [
  "public",
  "connections",
  "private",
]);

export const durationUnitEnum = pgEnum("duration_unit", [
  "days",
  "weeks",
  "months",
  "years",
]);

export const recurrenceEnum = pgEnum("recurrence", [
  "daily",
  "weekly",
  "semi-weekly",
  "monthly",
  "semi-monthly",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "achievement",
  "social",
  "system",
  "reward",
  "transaction",
]);

export const authProviderEnum = pgEnum("auth_provider", [
  "email",
  "google",
  "facebook",
  "phone",
]);

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password"),
  authProvider: authProviderEnum("auth_provider").default("email"),
  firebaseUid: text("firebase_uid").unique(),
  googleId: text("google_id"),
  facebookId: text("facebook_id"),
  fullName: text("full_name"),
  phoneNumber: text("phone_number"),
  city: text("city"),
  country: text("country"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  isVendor: boolean("is_vendor").default(false),
  vendorBusinessName: text("vendor_business_name"),
  vendorDescription: text("vendor_description"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("free"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  coins: integer("coins").default(100),
  trophies: integer("trophies").default(0),
  awards: integer("awards").default(0),
  totalPoints: integer("total_points").default(0),
  dailySpinsLeft: integer("daily_spins_left").default(3),
  lastSpinDate: timestamp("last_spin_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dreams = pgTable("dreams", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: dreamTypeEnum("type").notNull().default("personal"),
  privacy: dreamPrivacyEnum("privacy").default("public"),
  imageUrl: text("image_url"),
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  duration: integer("duration"),
  durationUnit: durationUnitEnum("duration_unit"),
  recurrence: recurrenceEnum("recurrence"),
  progress: integer("progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  routineDescription: text("routine_description"),
  designNotes: text("design_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dreamMembers = pgTable("dream_members", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  dreamId: varchar("dream_id")
    .notNull()
    .references(() => dreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const dreamTasks = pgTable("dream_tasks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  dreamId: varchar("dream_id")
    .notNull()
    .references(() => dreams.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  reminderDate: timestamp("reminder_date"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const connections = pgTable("connections", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: notificationTypeEnum("type").default("system"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const champions = pgTable("champions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull(),
  month: integer("month"),
  year: integer("year").notNull(),
  dreamsCompleted: integer("dreams_completed").default(0),
  points: integer("points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const galleryPosts = pgTable("gallery_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dreamId: varchar("dream_id").references(() => dreams.id, {
    onDelete: "set null",
  }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const newsFeedPosts = pgTable("news_feed_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dreamId: varchar("dream_id").references(() => dreams.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postLikes = pgTable("post_likes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => newsFeedPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postComments = pgTable("post_comments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => newsFeedPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  participant2Id: varchar("participant2_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketItems = pgTable("market_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dreamId: varchar("dream_id").references(() => dreams.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  imageUrl: text("image_url"),
  price: integer("price"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRelations = relations(users, ({ many }) => ({
  dreams: many(dreams),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  notifications: many(notifications),
  transactions: many(transactions),
  followers: many(connections, { relationName: "followers" }),
  following: many(connections, { relationName: "following" }),
  galleryPosts: many(galleryPosts),
  newsFeedPosts: many(newsFeedPosts),
}));

export const dreamsRelations = relations(dreams, ({ one, many }) => ({
  user: one(users, {
    fields: [dreams.userId],
    references: [users.id],
  }),
  members: many(dreamMembers),
  tasks: many(dreamTasks),
}));

export const dreamTasksRelations = relations(dreamTasks, ({ one }) => ({
  dream: one(dreams, {
    fields: [dreamTasks.dreamId],
    references: [dreams.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  fullName: true,
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z.string().optional(),
});

export const insertDreamSchema = createInsertSchema(dreams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Dream = typeof dreams.$inferSelect;
export type DreamTask = typeof dreamTasks.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Connection = typeof connections.$inferSelect;
export type Champion = typeof champions.$inferSelect;
export type GalleryPost = typeof galleryPosts.$inferSelect;
export type NewsFeedPost = typeof newsFeedPosts.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
