import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  partnerName: text("partner_name"),
  relationshipDuration: text("relationship_duration"),
  assessmentCompleted: boolean("assessment_completed").default(false),
  personalityType: text("personality_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assessmentResponses = pgTable("assessment_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  responses: jsonb("responses").notNull(),
  personalityType: text("personality_type").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // 'message', 'activity', 'reminder'
  category: text("category").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull(), // 'high', 'medium', 'low'
  personalityMatch: text("personality_match"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location"),
  rating: integer("rating"),
  distance: text("distance"),
  personalityMatch: text("personality_match"),
  imageUrl: text("image_url"),
});

export const scheduledEvents = pgTable("scheduled_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  type: text("type").notNull(),
  reminderSet: boolean("reminder_set").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAssessmentResponseSchema = createInsertSchema(assessmentResponses).omit({
  id: true,
  completedAt: true,
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
});

export const insertScheduledEventSchema = createInsertSchema(scheduledEvents).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type InsertAssessmentResponse = z.infer<typeof insertAssessmentResponseSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type ScheduledEvent = typeof scheduledEvents.$inferSelect;
export type InsertScheduledEvent = z.infer<typeof insertScheduledEventSchema>;
