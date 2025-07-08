import { 
  users, 
  partners,
  personalityAssessments,
  recommendations, 
  activities, 
  notifications,
  calendarEvents,
  type User, 
  type InsertUser,
  type Partner,
  type InsertPartner,
  type PersonalityAssessment,
  type InsertPersonalityAssessment,
  type Recommendation,
  type InsertRecommendation,
  type Activity,
  type InsertActivity,
  type Notification,
  type InsertNotification,
  type CalendarEvent,
  type InsertCalendarEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  
  // Activities
  getActivities(): Promise<Activity[]>;
  getActivitiesByPersonality(personalityType: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assessmentResponses: Map<number, AssessmentResponse>;
  private recommendations: Map<number, Recommendation>;
  private activities: Map<number, Activity>;
  private scheduledEvents: Map<number, ScheduledEvent>;
  private currentUserId: number;
  private currentAssessmentId: number;
  private currentRecommendationId: number;
  private currentActivityId: number;
  private currentEventId: number;

  constructor() {
    this.users = new Map();
    this.assessmentResponses = new Map();
    this.recommendations = new Map();
    this.activities = new Map();
    this.scheduledEvents = new Map();
    this.currentUserId = 1;
    this.currentAssessmentId = 1;
    this.currentRecommendationId = 1;
    this.currentActivityId = 1;
    this.currentEventId = 1;
    
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
      partnerName: insertUser.partnerName || null,
      relationshipDuration: insertUser.relationshipDuration || null,
      assessmentCompleted: false,
      personalityType: null,
      createdAt: new Date(),
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

  async saveAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse> {
    const id = this.currentAssessmentId++;
    const assessmentResponse: AssessmentResponse = {
      id,
      userId: response.userId || null,
      responses: response.responses,
      personalityType: response.personalityType,
      completedAt: new Date(),
    };
    this.assessmentResponses.set(id, assessmentResponse);
    return assessmentResponse;
  }

  async getAssessmentByUserId(userId: number): Promise<AssessmentResponse | undefined> {
    return Array.from(this.assessmentResponses.values()).find(
      response => response.userId === userId
    );
  }

  async getRecommendationsByUserId(userId: number): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values()).filter(
      rec => rec.userId === userId && rec.isActive
    );
  }

  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const id = this.currentRecommendationId++;
    const newRecommendation: Recommendation = {
      id,
      userId: recommendation.userId || null,
      type: recommendation.type,
      category: recommendation.category,
      content: recommendation.content,
      priority: recommendation.priority,
      personalityMatch: recommendation.personalityMatch || null,
      isActive: recommendation.isActive !== undefined ? recommendation.isActive : true,
      createdAt: new Date(),
    };
    this.recommendations.set(id, newRecommendation);
    return newRecommendation;
  }

  async updateRecommendation(id: number, updates: Partial<InsertRecommendation>): Promise<Recommendation> {
    const recommendation = this.recommendations.get(id);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }
    const updated = { ...recommendation, ...updates };
    this.recommendations.set(id, updated);
    return updated;
  }

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

  async getEventsByUserId(userId: number): Promise<ScheduledEvent[]> {
    return Array.from(this.scheduledEvents.values()).filter(
      event => event.userId === userId
    );
  }

  async createEvent(event: InsertScheduledEvent): Promise<ScheduledEvent> {
    const id = this.currentEventId++;
    const newEvent: ScheduledEvent = {
      id,
      userId: event.userId || null,
      title: event.title,
      description: event.description || null,
      date: event.date,
      type: event.type,
      reminderSet: event.reminderSet !== undefined ? event.reminderSet : false,
      createdAt: new Date(),
    };
    this.scheduledEvents.set(id, newEvent);
    return newEvent;
  }

  async updateEvent(id: number, updates: Partial<InsertScheduledEvent>): Promise<ScheduledEvent> {
    const event = this.scheduledEvents.get(id);
    if (!event) {
      throw new Error('Event not found');
    }
    const updated = { ...event, ...updates };
    this.scheduledEvents.set(id, updated);
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    this.scheduledEvents.delete(id);
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
}

export const storage = new MemStorage();
