import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real, uuid, varchar, date, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  partnerName: text("partner_name"),
  relationshipDuration: text("relationship_duration"),
  assessmentCompleted: boolean("assessment_completed").default(false),
  personalityType: text("personality_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  nickname: varchar("nickname", { length: 50 }),
  dateOfBirth: date("date_of_birth"),
  relationshipStatus: varchar("relationship_status", { length: 20 }).notNull(),
  relationshipStartDate: date("relationship_start_date"),
  anniversaryDate: date("anniversary_date"),
  personalityType: varchar("personality_type", { length: 50 }),
  loveLangPrimary: varchar("love_language_primary", { length: 50 }),
  loveLangSecondary: varchar("love_language_secondary", { length: 50 }),
  interests: jsonb("interests").default([]),
  preferences: jsonb("preferences").default({}),
  importantDates: jsonb("important_dates").default([]),
  notes: text("notes"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const personalityAssessments = pgTable("personality_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "cascade" }),
  assessmentType: varchar("assessment_type", { length: 20 }).notNull(),
  questionsResponses: jsonb("questions_responses").notNull(),
  connectionStyleScore: decimal("connection_style_score", { precision: 5, scale: 2 }),
  motivationDriverScore: decimal("motivation_driver_score", { precision: 5, scale: 2 }),
  affectionLanguageScore: decimal("affection_language_score", { precision: 5, scale: 2 }),
  personalityType: varchar("personality_type", { length: 50 }),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  assessmentVersion: varchar("assessment_version", { length: 10 }).notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  content: jsonb("content").notNull(),
  context: jsonb("context").default({}),
  priority: varchar("priority", { length: 20 }).notNull(),
  personalityMatch: decimal("personality_match", { precision: 5, scale: 2 }),
  relevanceScore: decimal("relevance_score", { precision: 5, scale: 2 }),
  status: varchar("status", { length: 20 }).default("active"),
  scheduledFor: timestamp("scheduled_for"),
  expiresAt: timestamp("expires_at"),
  viewedAt: timestamp("viewed_at"),
  implementedAt: timestamp("implemented_at"),
  feedback: jsonb("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data").default({}),
  scheduledFor: timestamp("scheduled_for").notNull(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  channel: varchar("channel", { length: 20 }).default("push"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  location: text("location"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  allDay: boolean("all_day").default(false),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("scheduled"),
  externalEventId: varchar("external_event_id", { length: 100 }),
  calendarProvider: varchar("calendar_provider", { length: 20 }),
  reminders: jsonb("reminders").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location"),
  rating: real("rating"),
  distance: text("distance"),
  personalityMatch: text("personality_match"),
  imageUrl: text("image_url"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActiveAt: true,
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPersonalityAssessmentSchema = createInsertSchema(personalityAssessments).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  partners: many(partners),
  personalityAssessments: many(personalityAssessments),
  recommendations: many(recommendations),
  notifications: many(notifications),
  calendarEvents: many(calendarEvents),
}));

export const partnersRelations = relations(partners, ({ one, many }) => ({
  user: one(users, {
    fields: [partners.userId],
    references: [users.id],
  }),
  personalityAssessments: many(personalityAssessments),
  recommendations: many(recommendations),
  calendarEvents: many(calendarEvents),
}));

export const personalityAssessmentsRelations = relations(personalityAssessments, ({ one }) => ({
  user: one(users, {
    fields: [personalityAssessments.userId],
    references: [users.id],
  }),
  partner: one(partners, {
    fields: [personalityAssessments.partnerId],
    references: [partners.id],
  }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  user: one(users, {
    fields: [recommendations.userId],
    references: [users.id],
  }),
  partner: one(partners, {
    fields: [recommendations.partnerId],
    references: [partners.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
  partner: one(partners, {
    fields: [calendarEvents.partnerId],
    references: [partners.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type PersonalityAssessment = typeof personalityAssessments.$inferSelect;
export type InsertPersonalityAssessment = z.infer<typeof insertPersonalityAssessmentSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
