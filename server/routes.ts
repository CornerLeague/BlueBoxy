import { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertPartnerSchema, 
  insertPersonalityAssessmentSchema, 
  insertRecommendationSchema,
  insertNotificationSchema,
  insertCalendarEventSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import { 
  generatePersonalityInsight, 
  generatePersonalizedMessages, 
  generateActivityRecommendations,
  generateLocationBasedRecommendations,
  type RecommendationContext 
} from "./openai";

export async function registerRoutes(app: Express) {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, partnerName, relationshipDuration } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userData = {
        name: name || "User",
        email,
        password: hashedPassword,
        partnerName: partnerName || "",
        relationshipDuration: relationshipDuration || "",
        assessmentCompleted: false,
        personalityType: null
      };

      const user = await storage.createUser(userData);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          assessmentCompleted: user.assessmentCompleted
        },
        token
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          assessmentCompleted: user.assessmentCompleted
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // User profile routes
  app.get("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(parseInt(req.user.userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user has completed assessment, generate personality insights
      let personalityInsight = null;
      if (user.personalityType && user.assessmentCompleted) {
        const assessment = await storage.getAssessmentByUserId(parseInt(req.user.userId));
        if (assessment) {
          personalityInsight = await generatePersonalityInsight(
            user.personalityType,
            user.partnerName,
            assessment.responses
          );
        }
      }
      
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        partnerName: user.partnerName,
        relationshipDuration: user.relationshipDuration,
        assessmentCompleted: user.assessmentCompleted,
        personalityType: user.personalityType,
        personalityInsight
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Legacy endpoint for backwards compatibility
  app.get("/api/users/:userId", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(parseInt(req.user.userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(parseInt(req.user.userId), updates);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Partner management routes
  app.post("/api/partner", authenticateToken, async (req: any, res) => {
    try {
      const partnerData = {
        ...req.body,
        userId: req.user.userId
      };
      
      const partner = await storage.createPartner(partnerData);
      res.json(partner);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/partner/:id", authenticateToken, async (req: any, res) => {
    try {
      const partner = await storage.updatePartner(req.params.id, req.body);
      res.json(partner);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Personality assessment routes
  app.get("/api/assessment/questions", (req, res) => {
    const questions = [
      {
        id: "q1",
        question: "When planning a surprise for your partner, you prefer to:",
        options: [
          { id: "a", text: "Plan every detail meticulously" },
          { id: "b", text: "Keep it simple and spontaneous" },
          { id: "c", text: "Ask subtle questions to understand their preferences" },
          { id: "d", text: "Go with something you know they've mentioned before" }
        ]
      },
      {
        id: "q2", 
        question: "During disagreements, you tend to:",
        options: [
          { id: "a", text: "Address the issue directly and immediately" },
          { id: "b", text: "Take time to think before discussing" },
          { id: "c", text: "Focus on understanding their perspective first" },
          { id: "d", text: "Try to find a compromise quickly" }
        ]
      },
      {
        id: "q3",
        question: "Your ideal date night would involve:",
        options: [
          { id: "a", text: "Trying a new restaurant or activity" },
          { id: "b", text: "Staying in and enjoying each other's company" },
          { id: "c", text: "Doing something your partner loves" },
          { id: "d", text: "A balance of planned and spontaneous activities" }
        ]
      }
    ];

    res.json({ questions });
  });

  // Guest assessment endpoint (no authentication required)
  app.post("/api/assessment/guest", async (req: any, res) => {
    try {
      const { responses, assessmentType } = req.body;
      
      // Calculate personality scores
      const scores = calculatePersonalityScores(responses);
      const personalityType = determinePersonalityType(scores);
      
      // Return assessment results without saving to database
      res.json({
        personalityType,
        scores,
        responses
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/assessment/responses", authenticateToken, async (req: any, res) => {
    try {
      const { responses, assessmentType } = req.body;
      
      // Calculate personality scores
      const scores = calculatePersonalityScores(responses);
      const personalityType = determinePersonalityType(scores);
      
      const assessmentData = {
        userId: req.user.userId,
        responses,
        personalityType
      };

      const assessment = await storage.saveAssessmentResponse(assessmentData);
      
      // Update user's personality type and assessment status
      await storage.updateUser(req.user.userId, {
        personalityType,
        assessmentCompleted: true
      });

      // Generate sample recommendations for the user
      await storage.generateSampleRecommendations(req.user.userId, personalityType);

      res.json(assessment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Legacy endpoint for backwards compatibility
  app.post("/api/assessments", authenticateToken, async (req: any, res) => {
    try {
      const { responses, assessmentType } = req.body;
      
      // Calculate personality scores
      const scores = calculatePersonalityScores(responses);
      const personalityType = determinePersonalityType(scores);
      
      const assessmentData = {
        userId: req.user.userId,
        responses,
        personalityType
      };

      const assessment = await storage.saveAssessmentResponse(assessmentData);
      
      // Update user's personality type and assessment status
      await storage.updateUser(req.user.userId, {
        personalityType,
        assessmentCompleted: true
      });

      res.json(assessment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/assessment/results/:assessmentId", authenticateToken, async (req: any, res) => {
    try {
      const assessment = await storage.getAssessmentByUserId(req.user.userId);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Recommendation routes
  app.get("/api/recommendations/messages", authenticateToken, async (req: any, res) => {
    try {
      const { messageType, context, timeOfDay } = req.query;
      const userId = req.user.userId;
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get assessment responses for context
      const assessment = await storage.getAssessmentByUserId(userId);
      
      if (!assessment || !user.personalityType) {
        return res.status(400).json({ error: "Assessment not completed" });
      }

      // Generate dynamic recommendations using OpenAI
      const recommendationContext: RecommendationContext = {
        userName: user.name,
        partnerName: user.partnerName,
        personalityType: user.personalityType,
        relationshipDuration: user.relationshipDuration,
        assessmentResponses: assessment.responses
      };

      const messages = await generatePersonalizedMessages(recommendationContext, 5);
      
      // Format as recommendation objects
      const recommendations = messages.map((content, index) => ({
        id: index + 1,
        userId: userId,
        type: "message",
        category: index === 0 ? "romantic" : index === 1 ? "appreciation" : index === 2 ? "playful" : index === 3 ? "supportive" : "daily",
        content,
        priority: index < 2 ? "high" : index < 4 ? "medium" : "low",
        personalityMatch: user.personalityType,
        createdAt: new Date().toISOString(),
        isRead: false
      }));

      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Legacy endpoint for backwards compatibility
  app.get("/api/recommendations/user/:userId", authenticateToken, async (req: any, res) => {
    try {
      const recommendations = await storage.getRecommendationsByUserId(req.user.userId);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/recommendations/activities", authenticateToken, async (req: any, res) => {
    try {
      const { location, budget, timeframe, activityType } = req.query;
      const userId = req.user.userId;
      
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get assessment responses for context
      const assessment = await storage.getAssessmentByUserId(parseInt(userId));
      
      if (!assessment || !user.personalityType) {
        return res.status(400).json({ error: "Assessment not completed" });
      }

      // Generate dynamic activity recommendations using OpenAI
      const recommendationContext: RecommendationContext = {
        userName: user.name,
        partnerName: user.partnerName,
        personalityType: user.personalityType,
        relationshipDuration: user.relationshipDuration,
        assessmentResponses: assessment.responses
      };

      const activities = await generateActivityRecommendations(recommendationContext, 5);
      
      res.json({ activities });
    } catch (error) {
      console.error("Error generating activity recommendations:", error);
      res.status(500).json({ error: "Failed to generate activity recommendations" });
    }
  });

  // User preferences route
  app.post("/api/user/preferences", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { preferences, location } = req.body;
      
      const user = await storage.updateUserPreferences(parseInt(userId), preferences, location);
      
      res.json({ 
        message: "Preferences saved successfully",
        user: {
          id: user.id,
          name: user.name,
          preferences: user.preferences,
          location: user.location
        }
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  // Location-based recommendations route
  app.get("/api/recommendations/location-based", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { radius = 25 } = req.query;
      
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.location) {
        return res.status(400).json({ error: "Location not set. Please complete preferences first." });
      }

      // Get assessment responses for context
      const assessment = await storage.getAssessmentByUserId(parseInt(userId));
      
      if (!assessment || !user.personalityType) {
        return res.status(400).json({ error: "Assessment not completed" });
      }

      // Generate location-based recommendations using OpenAI
      const recommendationContext: RecommendationContext = {
        userName: user.name,
        partnerName: user.partnerName,
        personalityType: user.personalityType,
        relationshipDuration: user.relationshipDuration,
        assessmentResponses: assessment.responses
      };

      const activities = await generateLocationBasedRecommendations(
        recommendationContext,
        user.location,
        user.preferences,
        parseInt(radius),
        12
      );
      
      res.json({ activities });
    } catch (error) {
      console.error("Error generating location-based recommendations:", error);
      res.status(500).json({ error: "Failed to generate location-based recommendations" });
    }
  });

  app.get("/api/recommendations/gifts", authenticateToken, async (req: any, res) => {
    try {
      const { occasion, budget, giftType } = req.query;
      
      const user = await storage.getUser(req.user.userId);
      const partner = await storage.getPartnerByUserId(req.user.userId);
      
      const gifts = await generateGiftRecommendations(user, partner, {
        occasion,
        budget,
        giftType
      });
      
      res.json({ gifts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/recommendations/feedback", authenticateToken, async (req: any, res) => {
    try {
      const { recommendationId, action, outcome, partnerResponse, notes } = req.body;
      
      const feedback = {
        action,
        outcome,
        partnerResponse,
        notes,
        timestamp: new Date().toISOString()
      };
      
      await storage.updateRecommendation(recommendationId, {
        feedback,
        implementedAt: action === "implemented" ? new Date() : null
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Notification routes
  app.post("/api/notifications/schedule", authenticateToken, async (req: any, res) => {
    try {
      const notificationData = {
        ...req.body,
        userId: req.user.userId
      };
      
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/notifications/pending", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.user.userId);
      const pending = notifications.filter(n => n.status === "pending");
      res.json({ notifications: pending });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notifications/acknowledge", authenticateToken, async (req: any, res) => {
    try {
      const { notificationId, action, snoozeUntil } = req.body;
      
      const updates: any = {
        status: action === "snoozed" ? "snoozed" : "delivered",
        readAt: new Date()
      };
      
      if (snoozeUntil) {
        updates.scheduledFor = new Date(snoozeUntil);
        updates.status = "pending";
      }
      
      await storage.updateNotification(notificationId, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Calendar routes
  app.get("/api/calendar/availability", authenticateToken, async (req: any, res) => {
    try {
      const { dateRange, duration, activityType } = req.query;
      
      const events = await storage.getCalendarEventsByUserId(req.user.userId);
      const availability = analyzeAvailability(events, {
        dateRange,
        duration,
        activityType
      });
      
      res.json({ availability });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/calendar/schedule", authenticateToken, async (req: any, res) => {
    try {
      const eventData = {
        ...req.body,
        userId: req.user.userId
      };
      
      const event = await storage.createCalendarEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Activity routes
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/activities/personality/:type", async (req, res) => {
    try {
      const activities = await storage.getActivitiesByPersonality(req.params.type);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions
function calculatePersonalityScores(responses: any) {
  // Simplified scoring algorithm
  const scores = {
    connectionStyle: 75.0,
    motivationDriver: 80.0,
    affectionLanguage: 70.0,
    confidence: 85.0
  };
  
  // In a real implementation, this would analyze actual responses
  Object.keys(responses).forEach(questionId => {
    const answer = responses[questionId];
    // Adjust scores based on answers
    if (answer === 'a') scores.connectionStyle += 5;
    if (answer === 'b') scores.motivationDriver += 5;
    if (answer === 'c') scores.affectionLanguage += 5;
  });
  
  return scores;
}

function determinePersonalityType(scores: any): string {
  const types = [
    "Thoughtful Harmonizer",
    "Practical Supporter", 
    "Emotional Connector",
    "Independent Thinker",
    "Social Butterfly",
    "Quiet Confidant",
    "Adventure Seeker",
    "Nurturing Caregiver"
  ];
  
  // Select type based on highest scores
  if (scores.connectionStyle > 80) return "Thoughtful Harmonizer";
  if (scores.motivationDriver > 80) return "Practical Supporter";
  if (scores.affectionLanguage > 80) return "Emotional Connector";
  
  return types[Math.floor(Math.random() * types.length)];
}

async function generateMessageRecommendations(user: any, partner: any, context: any) {
  // AI-powered message generation would go here
  const messages = [
    {
      content: "Good morning beautiful! Hope you have an amazing day ❤️",
      timing: "morning",
      personalityMatch: 95,
      category: "affectionate"
    },
    {
      content: "Thinking of you and can't wait to see you later!",
      timing: "afternoon", 
      personalityMatch: 88,
      category: "romantic"
    }
  ];
  
  return messages;
}

async function generateActivityRecommendations(user: any, context: any) {
  // Location-based activity recommendations
  const activities = await storage.getActivitiesByPersonality(user?.personalityType || "Thoughtful Harmonizer");
  
  return activities.map(activity => ({
    ...activity,
    personalityMatch: 85,
    estimatedCost: "$50-100",
    bookingUrl: `https://example.com/book/${activity.id}`
  }));
}

async function generateGiftRecommendations(user: any, partner: any, context: any) {
  const gifts = [
    {
      name: "Personalized Photo Album",
      description: "Custom photo book with your favorite memories together",
      price: "$35-50",
      category: "sentimental",
      personalityMatch: 90,
      purchaseUrl: "https://example.com/gifts/photo-album"
    },
    {
      name: "Spa Day Package",
      description: "Relaxing couples massage and spa experience",
      price: "$150-300",
      category: "experience",
      personalityMatch: 75,
      purchaseUrl: "https://example.com/gifts/spa-day"
    }
  ];
  
  return gifts;
}

function analyzeAvailability(events: any[], context: any) {
  // Analyze calendar events to find optimal timing
  const availability = {
    optimalTimes: [
      {
        date: "2024-01-20",
        startTime: "19:00",
        endTime: "22:00",
        confidence: 95
      },
      {
        date: "2024-01-21", 
        startTime: "14:00",
        endTime: "17:00",
        confidence: 80
      }
    ],
    conflicts: [],
    recommendations: [
      "Weekend evenings work best for your schedule",
      "Consider 2-3 hour blocks for optimal experience"
    ]
  };
  
  return availability;
}