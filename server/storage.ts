import { 
  users, 
  assessmentResponses,
  partners,
  recommendations, 
  activities, 
  notifications,
  calendarEvents,
  type User, 
  type InsertUser,
  type Partner,
  type InsertPartner,
  type AssessmentResponse,
  type InsertAssessmentResponse,
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
      password: insertUser.password,
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

  async generateSampleRecommendations(userId: number, personalityType: string): Promise<void> {
    const sampleRecommendations = [
      {
        userId,
        type: "message",
        category: "morning",
        content: "Good morning, beautiful! I hope your day is as amazing as you are. Can't wait to see you tonight! 💕",
        priority: "medium",
        personalityMatch: personalityType
      },
      {
        userId,
        type: "message",
        category: "appreciation",
        content: "I was just thinking about how lucky I am to have you in my life. Thank you for being so supportive and understanding.",
        priority: "high",
        personalityMatch: personalityType
      },
      {
        userId,
        type: "activity",
        category: "date",
        content: "Plan a cozy movie night at home with their favorite snacks and a film you both want to watch.",
        priority: "medium",
        personalityMatch: personalityType
      },
      {
        userId,
        type: "message",
        category: "support",
        content: "I know you've been working hard lately. Remember to take care of yourself - you're amazing and I believe in you!",
        priority: "high",
        personalityMatch: personalityType
      }
    ];

    for (const rec of sampleRecommendations) {
      await this.createRecommendation(rec as InsertRecommendation);
    }
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
    const [assessment] = await db
      .select()
      .from(assessmentResponses)
      .where(eq(assessmentResponses.userId, userId));
    return assessment || undefined;
  }

  async getUserEvents(userId: number): Promise<CalendarEvent[]> {
    try {
      const userEvents = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.userId, userId.toString()))
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
}

// Simple localStorage wrapper for server-side compatibility
class LocalStorageStorage implements IStorage {
  private storage: Record<string, any> = {};
  
  constructor() {
    // Initialize with empty storage
    this.storage = {
      users: new Map(),
      assessments: new Map(),
      recommendations: new Map(),
      activities: new Map(),
      events: new Map(),
      currentUserId: 1,
      currentAssessmentId: 1,
      currentRecommendationId: 1,
      currentActivityId: 1,
      currentEventId: 1
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
        rating: 4.5,
        personalityMatch: "92% match",
        distance: "0.8 miles",
        imageUrl: "/api/placeholder/400/300"
      },
      {
        id: 2,
        name: "Sunset Beach Walk",
        description: "Take a romantic stroll along the beach during golden hour.",
        category: "outdoor",
        rating: 4.8,
        personalityMatch: "88% match",
        distance: "1.2 miles",
        imageUrl: "/api/placeholder/400/300"
      },
      {
        id: 3,
        name: "Art Gallery Downtown",
        description: "Explore contemporary art together in this intimate gallery space.",
        category: "cultural",
        rating: 4.3,
        personalityMatch: "85% match",
        distance: "0.5 miles",
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
      partnerName: insertUser.partnerName,
      relationshipDuration: insertUser.relationshipDuration,
      passwordHash: insertUser.passwordHash,
      personalityType: insertUser.personalityType,
      personalityInsight: insertUser.personalityInsight,
      preferences: insertUser.preferences,
      location: insertUser.location,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.storage.users.set(user.id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const user = this.storage.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.storage.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPreferences(id: number, preferences: any, location?: any): Promise<User> {
    const user = this.storage.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      preferences, 
      location,
      updatedAt: new Date() 
    };
    this.storage.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async saveAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse> {
    const assessmentResponse: AssessmentResponse = {
      id: this.storage.currentAssessmentId++,
      userId: response.userId,
      responses: response.responses,
      personalityType: response.personalityType,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.storage.assessments.set(assessmentResponse.id, assessmentResponse);
    return assessmentResponse;
  }
  
  async getAssessmentByUserId(userId: number): Promise<AssessmentResponse | undefined> {
    for (const assessment of this.storage.assessments.values()) {
      if (assessment.userId === userId) return assessment;
    }
    return undefined;
  }
  
  async getRecommendationsByUserId(userId: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    for (const rec of this.storage.recommendations.values()) {
      if (rec.userId === userId) recommendations.push(rec);
    }
    return recommendations;
  }
  
  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const newRecommendation: Recommendation = {
      id: this.storage.currentRecommendationId++,
      userId: recommendation.userId,
      type: recommendation.type,
      category: recommendation.category,
      content: recommendation.content,
      priority: recommendation.priority,
      personalityMatch: recommendation.personalityMatch,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.storage.recommendations.set(newRecommendation.id, newRecommendation);
    return newRecommendation;
  }
  
  async updateRecommendation(id: number, updates: Partial<InsertRecommendation>): Promise<Recommendation> {
    const recommendation = this.storage.recommendations.get(id);
    if (!recommendation) throw new Error("Recommendation not found");
    
    const updatedRecommendation = { ...recommendation, ...updates, updatedAt: new Date() };
    this.storage.recommendations.set(id, updatedRecommendation);
    return updatedRecommendation;
  }
  
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.storage.activities.values());
  }
  
  async getActivitiesByPersonality(personalityType: string): Promise<Activity[]> {
    return Array.from(this.storage.activities.values());
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity: Activity = {
      id: this.storage.currentActivityId++,
      name: activity.name,
      description: activity.description,
      category: activity.category,
      rating: activity.rating,
      personalityMatch: activity.personalityMatch,
      distance: activity.distance,
      imageUrl: activity.imageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.storage.activities.set(newActivity.id, newActivity);
    return newActivity;
  }
  
  async getEventsByUserId(userId: number): Promise<ScheduledEvent[]> {
    const events: ScheduledEvent[] = [];
    for (const event of this.storage.events.values()) {
      if (event.userId === userId) events.push(event);
    }
    return events;
  }
  
  async createEvent(event: InsertScheduledEvent): Promise<ScheduledEvent> {
    const newEvent: ScheduledEvent = {
      id: this.storage.currentEventId++,
      userId: event.userId,
      title: event.title,
      description: event.description,
      scheduledDate: event.scheduledDate,
      eventType: event.eventType,
      location: event.location,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.storage.events.set(newEvent.id, newEvent);
    return newEvent;
  }
  
  async updateEvent(id: number, updates: Partial<InsertScheduledEvent>): Promise<ScheduledEvent> {
    const event = this.storage.events.get(id);
    if (!event) throw new Error("Event not found");
    
    const updatedEvent = { ...event, ...updates, updatedAt: new Date() };
    this.storage.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<void> {
    this.storage.events.delete(id);
  }
  
  async generateSampleRecommendations(userId: number, personalityType: string): Promise<void> {
    // This will be handled by OpenAI integration
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
      partnerId: event.partnerId,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay || false,
      eventType: event.eventType,
      status: event.status || 'scheduled',
      externalEventId: event.externalEventId,
      calendarProvider: event.calendarProvider,
      reminders: event.reminders || [],
      metadata: event.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.storage.events.set(newEvent.id, newEvent);
    return newEvent;
  }
}

export const storage = new DatabaseStorage();
