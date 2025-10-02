import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real, uuid, varchar, date, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  partnerName: text("partner_name"),
  relationshipDuration: text("relationship_duration"),
  partnerAge: integer("partner_age"),
  personalityType: text("personality_type"),
  personalityInsight: jsonb("personality_insight"),
  preferences: jsonb("preferences"),
  location: jsonb("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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

export const assessmentResponses = pgTable("assessment_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  responses: jsonb("responses").notNull(),
  personalityType: text("personality_type"),
  completedAt: timestamp("completed_at").defaultNow(),
});



export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventsCreated: integer("events_created").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssessmentResponseSchema = createInsertSchema(assessmentResponses).omit({
  id: true,
  completedAt: true,
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
}).extend({
  startTime: z.string().or(z.date()).transform((val) => new Date(val)),
  endTime: z.string().or(z.date()).transform((val) => new Date(val)),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});



// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  partners: many(partners),
  assessmentResponses: many(assessmentResponses),
  notifications: many(notifications),
  calendarEvents: many(calendarEvents),
  stats: one(userStats),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const partnersRelations = relations(partners, ({ one, many }) => ({
  user: one(users, {
    fields: [partners.userId],
    references: [users.id],
  }),
  assessmentResponses: many(assessmentResponses),
  calendarEvents: many(calendarEvents),
}));

export const assessmentResponsesRelations = relations(assessmentResponses, ({ one }) => ({
  user: one(users, {
    fields: [assessmentResponses.userId],
    references: [users.id],
  }),
  partner: one(partners, {
    fields: [assessmentResponses.userId],
    references: [partners.userId],
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
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type InsertAssessmentResponse = z.infer<typeof insertAssessmentResponseSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
