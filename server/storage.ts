import { 
  users, 
  assessmentResponses,
  partners,
  activities, 
  notifications,
  calendarEvents,
  userStats
} from "@shared/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// Infer types from schema
export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;
export type Partner = InferSelectModel<typeof partners>;
export type InsertPartner = InferInsertModel<typeof partners>;
export type AssessmentResponse = InferSelectModel<typeof assessmentResponses>;
export type InsertAssessmentResponse = InferInsertModel<typeof assessmentResponses>;
export type Activity = InferSelectModel<typeof activities>;
export type InsertActivity = InferInsertModel<typeof activities>;
export type Notification = InferSelectModel<typeof notifications>;
export type InsertNotification = InferInsertModel<typeof notifications>;
export type CalendarEvent = InferSelectModel<typeof calendarEvents>;
export type InsertCalendarEvent = InferInsertModel<typeof calendarEvents>;
export type UserStats = InferSelectModel<typeof userStats>;
export type InsertUserStats = InferInsertModel<typeof userStats>;
import { db } from "./db";
import { eq, and, desc, asc, lt } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  updateUserPreferences(id: number, preferences: any, location?: any): Promise<User>;
  
  // Assessment responses
  saveAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse>;
  getAssessmentByUserId(userId: number): Promise<AssessmentResponse | undefined>;
  
  // Activities
  getActivities(): Promise<Activity[]>;
  getActivitiesByPersonality(personalityType: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Calendar Events
  getUserEvents(userId: number): Promise<CalendarEvent[]>;
  createEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  deleteEvent(eventId: number, userId: number): Promise<boolean>;
  cleanupExpiredEvents(): Promise<Record<number, number>>; // returns userId->removedCount
  
  // User Statistics
  getUserStats(userId: number): Promise<UserStats | undefined>;
  incrementEventsCreated(userId: number): Promise<UserStats>;
  decrementEventsCreated(userId: number, by?: number): Promise<UserStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assessmentResponses: Map<number, AssessmentResponse>;
  private activities: Map<number, Activity>;
  private calendarEvents: Map<number, CalendarEvent>;
  private userStatsMap: Map<number, UserStats>;
  private currentUserId: number;
  private currentAssessmentId: number;
  private currentActivityId: number;
  private currentEventId: number;
  private currentStatsId: number;

  constructor() {
    this.users = new Map();
    this.assessmentResponses = new Map();
    this.activities = new Map();
    this.calendarEvents = new Map();
    this.userStatsMap = new Map();
    this.currentUserId = 1;
    this.currentAssessmentId = 1;
    this.currentActivityId = 1;
    this.currentEventId = 1;
    this.currentStatsId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Seed activities
    const sampleActivities: Activity[] = [
      {
        id: this.currentActivityId++,
        name: "Cozy Garden Café",
        description: "Perfect for meaningful conversations. Known for artisanal coffee and peaceful atmosphere.",
        category: "dining",
        location: "Downtown",
        rating: 4.8,
        distance: "0.3 miles",
        personalityMatch: "Thoughtful Harmonizer",
        imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb"
      },
      {
        id: this.currentActivityId++,
        name: "Golden Gate Park Walk",
        description: "Peaceful nature walk with beautiful scenery. Great for deep conversations and connection.",
        category: "outdoor",
        location: "Golden Gate Park",
        rating: 4.9,
        distance: "1.2 miles",
        personalityMatch: "Quality Time",
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e"
      },
      {
        id: this.currentActivityId++,
        name: "SFMOMA Art Gallery",
        description: "Inspiring art collection with thoughtful exhibits. Perfect for cultural conversations.",
        category: "cultural",
        location: "SOMA",
        rating: 4.7,
        distance: "2.1 miles",
        personalityMatch: "Intellectual Connection",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96"
      }
    ];

    sampleActivities.forEach(activity => {
      this.activities.set(activity.id, activity);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      name: insertUser.name,
      email: insertUser.email,
      passwordHash: insertUser.passwordHash,
      partnerName: insertUser.partnerName || null,
      relationshipDuration: insertUser.relationshipDuration || null,
      partnerAge: (insertUser as any).partnerAge || null,
      personalityType: insertUser.personalityType || null,
      personalityInsight: insertUser.personalityInsight || null,
      preferences: insertUser.preferences || null,
      location: insertUser.location || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPreferences(id: number, preferences: any, location?: any): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updatedUser = { 
      ...user, 
      preferences,
      location: location || user.location
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async saveAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse> {
    const id = this.currentAssessmentId++;
    const assessmentResponse: AssessmentResponse = {
      id,
      userId: response.userId,
      responses: response.responses,
      personalityType: response.personalityType || null,
      completedAt: new Date()
    };
    this.assessmentResponses.set(id, assessmentResponse);
    return assessmentResponse;
  }

  async getAssessmentByUserId(userId: number): Promise<AssessmentResponse | undefined> {
    // Return most recent by completedAt then id
    let latest: AssessmentResponse | undefined = undefined;
    for (const res of this.assessmentResponses.values()) {
      if (res.userId !== userId) continue;
      if (!latest) {
        latest = res;
      } else {
        const at = new Date((res as any).completedAt).getTime();
        const bt = new Date((latest as any).completedAt).getTime();
        if (at > bt || (at === bt && (res as any).id > (latest as any).id)) {
          latest = res as any;
        }
      }
    }
    return latest;
  }

  // Legacy recommendation methods removed - not in current schema

  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }

  async getActivitiesByPersonality(personalityType: string): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(
      activity => activity.personalityMatch === personalityType
    );
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const newActivity: Activity = {
      id,
      name: activity.name,
      description: activity.description,
      category: activity.category,
      location: activity.location || null,
      rating: activity.rating || null,
      distance: activity.distance || null,
      personalityMatch: activity.personalityMatch || null,
      imageUrl: activity.imageUrl || null,
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  async getUserEvents(userId: number): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values()).filter(
      event => event.userId === userId
    );
  }

  async createEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.currentEventId++;
    const newEvent: CalendarEvent = {
      id,
      userId: event.userId,
      title: event.title,
      description: event.description || null,
      location: event.location || null,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay || false,
      eventType: event.eventType,
      status: event.status || null,
      externalEventId: event.externalEventId || null,
      calendarProvider: event.calendarProvider || null,
      reminders: event.reminders || null,
      metadata: event.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.calendarEvents.set(id, newEvent);
    return newEvent;
  }

  async deleteEvent(eventId: number, userId: number): Promise<boolean> {
    const ev = this.calendarEvents.get(eventId);
    if (!ev || ev.userId !== userId) return false;
    this.calendarEvents.delete(eventId);
    return true;
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    return this.userStatsMap.get(userId);
  }

  async incrementEventsCreated(userId: number): Promise<UserStats> {
    let stats = this.userStatsMap.get(userId);
    if (!stats) {
      stats = {
        id: this.currentStatsId++,
        userId,
        eventsCreated: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } else {
      stats = {
        ...stats,
        eventsCreated: (stats.eventsCreated ?? 0) + 1,
        updatedAt: new Date()
      };
    }
    this.userStatsMap.set(userId, stats);
    return stats;
  }

  async decrementEventsCreated(userId: number, by: number = 1): Promise<UserStats> {
    let stats = this.userStatsMap.get(userId);
    if (!stats) {
      stats = {
        id: this.currentStatsId++,
        userId,
        eventsCreated: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } else {
      stats = {
        ...stats,
        eventsCreated: Math.max(0, (stats.eventsCreated ?? 0) - by),
        updatedAt: new Date()
      };
    }
    this.userStatsMap.set(userId, stats);
    return stats;
  }

  async cleanupExpiredEvents(): Promise<Record<number, number>> {
    const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour ago
    const removedCount: Record<number, number> = {};
    for (const entry of Array.from(this.calendarEvents.entries())) {
      const [id, ev] = entry;
      const end = (ev as any).endTime?.getTime ? (ev as any).endTime.getTime() : new Date((ev as any).endTime).getTime();
      if (end < cutoff) {
        this.calendarEvents.delete(id);
        removedCount[ev.userId] = (removedCount[ev.userId] || 0) + 1;
      }
    }
    // Apply decrements
    for (const [uidStr, count] of Object.entries(removedCount)) {
      await this.decrementEventsCreated(parseInt(uidStr, 10), count);
    }
    return removedCount;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPreferences(id: number, preferences: any, location?: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        preferences,
        location: location || undefined
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getActivities(): Promise<Activity[]> {
    try {
      return await db.select().from(activities);
    } catch (error) {
      console.error("Error getting activities:", error);
      return [];
    }
  }

  async getActivitiesByPersonality(personalityType: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.personalityMatch, personalityType));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async saveAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse> {
    const [assessment] = await db
      .insert(assessmentResponses)
      .values(response)
      .returning();
    return assessment;
  }

  async getAssessmentByUserId(userId: number): Promise<AssessmentResponse | undefined> {
    // Return the most recent assessment for the user (stable ordering)
    const [assessment] = await db
      .select()
      .from(assessmentResponses)
      .where(eq(assessmentResponses.userId, userId))
      .orderBy(
        desc(assessmentResponses.completedAt),
        desc(assessmentResponses.id),
      )
      .limit(1);
    return assessment || undefined;
  }

  async getUserEvents(userId: number): Promise<CalendarEvent[]> {
    try {
      const userEvents = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.userId, userId))
        .orderBy(asc(calendarEvents.startTime));
      return userEvents;
    } catch (error) {
      console.error("Error getting user events:", error);
      return [];
    }
  }

  async createEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db
      .insert(calendarEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async deleteEvent(eventId: number, userId: number): Promise<boolean> {
    const [deleted] = await db
      .delete(calendarEvents)
      .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)))
      .returning({ id: calendarEvents.id });
    return !!deleted;
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    try {
      const [stats] = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, userId));
      return stats || undefined;
    } catch (error) {
      console.error("Error getting user stats:", error);
      return undefined;
    }
  }

  async decrementEventsCreated(userId: number, by: number = 1): Promise<UserStats> {
    const existing = await this.getUserStats(userId);
    if (!existing) {
      const [newStats] = await db
        .insert(userStats)
        .values({ userId, eventsCreated: 0 })
        .returning();
      return newStats;
    }
    const newValue = Math.max(0, (existing.eventsCreated ?? 0) - by);
    const [updated] = await db
      .update(userStats)
      .set({ eventsCreated: newValue, updatedAt: new Date() })
      .where(eq(userStats.userId, userId))
      .returning();
    return updated;
  }

  async cleanupExpiredEvents(): Promise<Record<number, number>> {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const deleted = await db
      .delete(calendarEvents)
      .where(lt(calendarEvents.endTime, cutoff))
      .returning({ userId: calendarEvents.userId });

    const counts: Record<number, number> = {};
    for (const row of deleted) {
      counts[row.userId] = (counts[row.userId] || 0) + 1;
    }
    for (const [uidStr, count] of Object.entries(counts)) {
      await this.decrementEventsCreated(parseInt(uidStr, 10), count);
    }
    return counts;
  }



  async incrementEventsCreated(userId: number): Promise<UserStats> {
    // First check if stats record exists
    let stats = await this.getUserStats(userId);
    
    if (!stats) {
      // Create new stats record
      const [newStats] = await db
        .insert(userStats)
        .values({ 
          userId, 
          eventsCreated: 1 
        })
        .returning();
      return newStats;
    } else {
      // Update existing record
      const [updatedStats] = await db
        .update(userStats)
        .set({ 
          eventsCreated: (stats.eventsCreated ?? 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId))
        .returning();
      return updatedStats;
    }
  }
}

// Simple localStorage wrapper for server-side compatibility
class LocalStorageStorage implements IStorage {
  private storage: Record<string, any> = {};
  
  constructor() {
    // Initialize with empty storage
    this.storage = {
      users: new Map(),
      assessments: new Map(),
      activities: new Map(),
      events: new Map(),
      userStats: new Map(),
      currentUserId: 1,
      currentAssessmentId: 1,
      currentActivityId: 1,
      currentEventId: 1,
      currentStatsId: 1
    };
    
    // Seed some basic activity data
    this.seedData();
  }
  
  private seedData() {
    const activities = [
      {
        id: 1,
        name: "Cozy Garden Café",
        description: "A charming café surrounded by beautiful gardens, perfect for intimate conversations.",
        category: "dining",
        location: "Downtown",
        rating: 4.5,
        distance: "0.8 miles",
        personalityMatch: "92% match",
        imageUrl: "/api/placeholder/400/300"
      },
      {
        id: 2,
        name: "Sunset Beach Walk",
        description: "Take a romantic stroll along the beach during golden hour.",
        category: "outdoor",
        location: "Beach",
        rating: 4.8,
        distance: "1.2 miles",
        personalityMatch: "88% match",
        imageUrl: "/api/placeholder/400/300"
      },
      {
        id: 3,
        name: "Art Gallery Downtown",
        description: "Explore contemporary art together in this intimate gallery space.",
        category: "cultural",
        location: "Downtown",
        rating: 4.3,
        distance: "0.5 miles",
        personalityMatch: "85% match",
        imageUrl: "/api/placeholder/400/300"
      }
    ];
    
    activities.forEach(activity => {
      this.storage.activities.set(activity.id, activity);
    });
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.storage.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.storage.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.storage.currentUserId++,
      email: insertUser.email,
      name: insertUser.name,
      partnerName: insertUser.partnerName || null,
      relationshipDuration: insertUser.relationshipDuration || null,
      partnerAge: (insertUser as any).partnerAge || null,
      passwordHash: insertUser.passwordHash,
      personalityType: insertUser.personalityType || null,
      personalityInsight: insertUser.personalityInsight || null,
      preferences: insertUser.preferences || null,
      location: insertUser.location || null,
      createdAt: new Date()
    };
    
    this.storage.users.set(user.id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const user = this.storage.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates };
    this.storage.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPreferences(id: number, preferences: any, location?: any): Promise<User> {
    const user = this.storage.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      preferences, 
      location
    };
    this.storage.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async saveAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse> {
    const assessmentResponse: AssessmentResponse = {
      id: this.storage.currentAssessmentId++,
      userId: response.userId,
      responses: response.responses,
      personalityType: response.personalityType || null,
      completedAt: new Date()
    };
    
    this.storage.assessments.set(assessmentResponse.id, assessmentResponse);
    return assessmentResponse;
  }
  
  async getAssessmentByUserId(userId: number): Promise<AssessmentResponse | undefined> {
    // Return most recent by completedAt then id
    let latest: AssessmentResponse | undefined;
    for (const assessment of this.storage.assessments.values()) {
      if (assessment.userId !== userId) continue;
      if (!latest) {
        latest = assessment;
      } else {
        const at = new Date(assessment.completedAt).getTime();
        const bt = new Date(latest.completedAt).getTime();
        // For in-memory, use id if available to break ties
        const aid = (assessment as any).id ?? 0;
        const bid = (latest as any).id ?? 0;
        if (at > bt || (at === bt && aid > bid)) {
          latest = assessment;
        }
      }
    }
    return latest;
  }
  
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.storage.activities.values()) as Activity[];
  }
  
  async getActivitiesByPersonality(personalityType: string): Promise<Activity[]> {
    const list = Array.from(this.storage.activities.values()) as Activity[];
    return list.filter((activity: Activity) => activity.personalityMatch === personalityType);
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity: Activity = {
      id: this.storage.currentActivityId++,
      name: activity.name,
      description: activity.description,
      category: activity.category,
      location: activity.location || null,
      rating: activity.rating || null,
      distance: activity.distance || null,
      personalityMatch: activity.personalityMatch || null,
      imageUrl: activity.imageUrl || null
    };
    
    this.storage.activities.set(newActivity.id, newActivity);
    return newActivity;
  }

  async getUserEvents(userId: number): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];
    for (const event of this.storage.events.values()) {
      if (event.userId === userId) events.push(event);
    }
    return events;
  }

  async createEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      id: this.storage.currentEventId++,
      userId: event.userId,
      title: event.title,
      description: event.description || null,
      location: event.location || null,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay || false,
      eventType: event.eventType,
      status: event.status || null,
      externalEventId: event.externalEventId || null,
      calendarProvider: event.calendarProvider || null,
      reminders: event.reminders || null,
      metadata: event.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.storage.events.set(newEvent.id, newEvent);
    return newEvent;
  }

  async deleteEvent(eventId: number, userId: number): Promise<boolean> {
    const ev = this.storage.events.get(eventId);
    if (!ev || ev.userId !== userId) return false;
    this.storage.events.delete(eventId);
    return true;
  }

  async cleanupExpiredEvents(): Promise<Record<number, number>> {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const removed: Record<number, number> = {};
    for (const [id, ev] of this.storage.events.entries()) {
      const end = (ev as any).endTime?.getTime ? (ev as any).endTime.getTime() : new Date((ev as any).endTime).getTime();
      if (end < cutoff) {
        this.storage.events.delete(id);
        removed[ev.userId] = (removed[ev.userId] || 0) + 1;
      }
    }
    for (const [uidStr, count] of Object.entries(removed)) {
      await this.decrementEventsCreated(parseInt(uidStr, 10), count);
    }
    return removed;
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    return this.storage.userStats?.get(userId);
  }

  async incrementEventsCreated(userId: number): Promise<UserStats> {
    if (!this.storage.userStats) {
      this.storage.userStats = new Map();
    }

    let stats = this.storage.userStats.get(userId);
    
    if (!stats) {
      stats = {
        id: this.storage.currentStatsId++,
        userId,
        eventsCreated: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } else {
      stats = {
        ...stats,
        eventsCreated: stats.eventsCreated + 1,
        updatedAt: new Date()
      };
    }
    
    this.storage.userStats.set(userId, stats);
    return stats;
  }

  async decrementEventsCreated(userId: number, by: number = 1): Promise<UserStats> {
    if (!this.storage.userStats) {
      this.storage.userStats = new Map();
    }
    let stats = this.storage.userStats.get(userId);
    if (!stats) {
      stats = {
        id: this.storage.currentStatsId++,
        userId,
        eventsCreated: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } else {
      stats = {
        ...stats,
        eventsCreated: Math.max(0, stats.eventsCreated - by),
        updatedAt: new Date()
      };
    }
    this.storage.userStats.set(userId, stats);
    return stats;
  }
}

export const storage = new DatabaseStorage();
