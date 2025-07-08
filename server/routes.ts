import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertAssessmentResponseSchema, insertScheduledEventSchema } from "@shared/schema";
import { z } from "zod";
import { generateRecommendations } from "./lib/recommendation-engine";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  // Assessment routes
  app.post("/api/assessments", async (req, res) => {
    try {
      const assessmentData = insertAssessmentResponseSchema.parse(req.body);
      const assessment = await storage.saveAssessmentResponse(assessmentData);
      
      // Update user's assessment completion status
      await storage.updateUser(assessmentData.userId!, {
        assessmentCompleted: true,
        personalityType: assessmentData.personalityType,
      });

      // Generate initial recommendations
      await generateRecommendations(assessmentData.userId!, assessmentData.personalityType);

      res.status(201).json(assessment);
    } catch (error) {
      res.status(400).json({ message: "Invalid assessment data" });
    }
  });

  app.get("/api/assessments/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const assessment = await storage.getAssessmentByUserId(userId);
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Failed to get assessment" });
    }
  });

  // Recommendations routes
  app.get("/api/recommendations/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const recommendations = await storage.getRecommendationsByUserId(userId);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const { personality } = req.query;
      let activities;
      
      if (personality) {
        activities = await storage.getActivitiesByPersonality(personality as string);
      } else {
        activities = await storage.getActivities();
      }
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  // Events routes
  app.get("/api/events/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const events = await storage.getEventsByUserId(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to get events" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertScheduledEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const event = await storage.updateEvent(id, updates);
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEvent(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Recommendation engine
async function generateRecommendations(userId: number, personalityType: string) {
  const recommendations = [
    {
      userId,
      type: "message",
      category: "daily_checkin",
      content: "Good morning beautiful! I know you have that big presentation today. You've got this - I believe in you completely! ☀️",
      priority: "high",
      personalityMatch: personalityType,
      isActive: true,
    },
    {
      userId,
      type: "activity",
      category: "date_idea",
      content: "Cozy Garden Café - Perfect for meaningful conversations. Known for their artisanal coffee and peaceful atmosphere.",
      priority: "medium",
      personalityMatch: personalityType,
      isActive: true,
    },
    {
      userId,
      type: "reminder",
      category: "quality_time",
      content: "Ask about her presentation today and really listen. She'll appreciate you remembering and caring about her day.",
      priority: "high",
      personalityMatch: personalityType,
      isActive: true,
    },
  ];

  for (const rec of recommendations) {
    await storage.createRecommendation(rec);
  }
}
