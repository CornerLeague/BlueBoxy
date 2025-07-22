import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertAssessmentResponseSchema,
  insertCalendarEventSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import { 
  generatePersonalityInsight, 
  generateActivityRecommendations,
  generateLocationBasedRecommendations,
  generateAIPoweredRecommendations,
  type RecommendationContext 
} from "./openai";
import { 
  generatePersonalizedMessages, 
  getMessageCategories,
  type GenerateMessageRequest 
} from "./message-generation";
import { calendarProviderManager } from "./calendar-providers";

// Remove JWT authentication - use simple session management

export async function registerRoutes(app: Express) {
  
  // Authentication routes - simplified without JWT
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
        email,
        passwordHash: hashedPassword,
        name: name || "User",
        partnerName: partnerName || "",
        relationshipDuration: relationshipDuration || "",
        personalityType: null,
        personalityInsight: null,
        preferences: null,
        location: null
      };

      const user = await storage.createUser(userData);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          partnerName: user.partnerName,
          relationshipDuration: user.relationshipDuration,
          personalityType: user.personalityType,
          personalityInsight: user.personalityInsight,
          preferences: user.preferences,
          location: user.location
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
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
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          partnerName: user.partnerName,
          relationshipDuration: user.relationshipDuration,
          personalityType: user.personalityType,
          personalityInsight: user.personalityInsight,
          preferences: user.preferences,
          location: user.location
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // User profile routes - simplified without authentication middleware
  app.get("/api/user/profile", async (req, res) => {
    try {
      const userIdStr = req.query.userId as string;
      const userId = parseInt(userIdStr);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user has completed assessment, generate personality insights
      let personalityInsight = user.personalityInsight;
      if (user.personalityType && !personalityInsight) {
        const assessment = await storage.getAssessmentByUserId(userId);
        if (assessment) {
          personalityInsight = await generatePersonalityInsight(
            user.personalityType,
            user.partnerName,
            assessment.responses
          );
          
          // Save generated insight to user profile
          await storage.updateUser(userId, { personalityInsight });
        }
      }
      
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        partnerName: user.partnerName,
        relationshipDuration: user.relationshipDuration,
        personalityType: user.personalityType,
        personalityInsight,
        preferences: user.preferences,
        location: user.location
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Assessment routes - simplified without authentication middleware
  app.post("/api/assessment/responses", async (req, res) => {
    try {
      const { userId, responses, personalityType } = req.body;
      
      // Validate userId
      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const assessmentData = {
        userId: parseInt(userId),
        responses,
        personalityType: personalityType || "Unknown", // Provide fallback
        completedAt: new Date()
      };

      const assessment = await storage.saveAssessmentResponse(assessmentData);
      
      // Update user's personality type
      await storage.updateUser(parseInt(userId), { 
        personalityType: personalityType || "Unknown"
      });

      res.json({
        id: assessment.id,
        userId: assessment.userId,
        personalityType: assessment.personalityType,
        completedAt: assessment.completedAt
      });
    } catch (error) {
      console.error("Error saving assessment:", error);
      res.status(500).json({ error: "Failed to save assessment" });
    }
  });

  // Keep guest assessment endpoint for backwards compatibility
  app.post("/api/assessment/guest", async (req, res) => {
    try {
      const { responses, personalityType, onboardingData } = req.body;
      
      // Just return the processed data for guest users
      res.json({
        personalityType,
        responses,
        onboardingData
      });
    } catch (error) {
      console.error("Error processing guest assessment:", error);
      res.status(500).json({ error: "Failed to process guest assessment" });
    }
  });



  // User preferences route - simplified without authentication
  app.post("/api/user/preferences", async (req, res) => {
    try {
      const { userId, preferences, location } = req.body;
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

  // Activities route
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Update the remaining routes to remove authenticateToken middleware
  app.get("/api/recommendations/activities", async (req, res) => {
    try {
      const userIdStr = req.query.userId as string;
      const userId = parseInt(userIdStr);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      const assessment = await storage.getAssessmentByUserId(userId);
      
      if (!user || !assessment) {
        return res.status(404).json({ error: "User or assessment not found" });
      }

      const recommendationContext: RecommendationContext = {
        userName: user.name,
        partnerName: user.partnerName,
        personalityType: user.personalityType,
        relationshipDuration: user.relationshipDuration,
        assessmentResponses: assessment.responses
      };

      const activities = await generateActivityRecommendations(recommendationContext, 8);
      
      res.json(activities);
    } catch (error) {
      console.error("Error generating activity recommendations:", error);
      res.status(500).json({ error: "Failed to generate activity recommendations" });
    }
  });

  app.get("/api/recommendations/location-based", async (req, res) => {
    try {
      const userIdStr = req.query.userId as string;
      const userId = parseInt(userIdStr);
      const { radius = 25 } = req.query;
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      const assessment = await storage.getAssessmentByUserId(userId);
      
      if (!user || !assessment) {
        return res.status(404).json({ error: "User or assessment not found" });
      }

      if (!user.location) {
        return res.status(400).json({ error: "Location not set. Please complete preferences first." });
      }

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
        parseInt(radius as string),
        12
      );
      
      res.json({ activities });
    } catch (error) {
      console.error("Error generating location-based recommendations:", error);
      res.status(500).json({ error: "Failed to generate location-based recommendations" });
    }
  });

  // Calendar Provider Routes
  app.get("/api/calendar/providers", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const providers = await calendarProviderManager.getProviders(userId);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching calendar providers:", error);
      res.status(500).json({ error: "Failed to fetch calendar providers" });
    }
  });

  app.post("/api/calendar/connect/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const authUrl = await calendarProviderManager.generateAuthUrl(providerId, userId);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error connecting calendar provider:", error);
      res.status(500).json({ error: error.message || "Failed to connect calendar provider" });
    }
  });

  app.get("/api/calendar/callback/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).send("Missing code or state parameter");
      }
      
      const [userId] = (state as string).split(':');
      
      try {
        await calendarProviderManager.exchangeCodeForToken(providerId, code as string, userId);
        
        // Send success message to parent window
        res.send(`
          <script>
            window.opener.postMessage({
              type: 'calendar-auth-success',
              provider: { id: '${providerId}' }
            }, '${process.env.BASE_URL || 'http://localhost:5000'}');
            window.close();
          </script>
        `);
      } catch (error) {
        console.error("Token exchange error:", error);
        res.send(`
          <script>
            window.opener.postMessage({
              type: 'calendar-auth-error',
              error: '${error.message}'
            }, '${process.env.BASE_URL || 'http://localhost:5000'}');
            window.close();
          </script>
        `);
      }
    } catch (error) {
      console.error("Calendar callback error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/calendar/disconnect/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      await calendarProviderManager.disconnectProvider(providerId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting calendar provider:", error);
      res.status(500).json({ error: error.message || "Failed to disconnect calendar provider" });
    }
  });

  app.get("/api/calendar/events/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const { userId, startDate, endDate } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const events = await calendarProviderManager.getEvents(
        providerId,
        userId as string,
        startDate as string,
        endDate as string
      );
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: error.message || "Failed to fetch calendar events" });
    }
  });

  // User events route - return user's calendar events from database
  app.get("/api/events/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const events = await storage.getUserEvents(parseInt(userId));
      res.json(events);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ error: "Failed to fetch user events" });
    }
  });

  // Create new event route
  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertCalendarEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      
      // Increment events created counter
      if (eventData.userId) {
        await storage.incrementEventsCreated(parseInt(eventData.userId));
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // User statistics routes
  app.get("/api/user/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = await storage.getUserStats(parseInt(userId));
      
      if (!stats) {
        // Return default stats if none exist
        return res.json({ eventsCreated: 0 });
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  });



  // AI-powered recommendations endpoint
  app.post("/api/recommendations/ai-powered", async (req: any, res) => {
    try {
      const { userId, category, location, preferences } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's assessment for personality context
      const assessment = await storage.getAssessmentByUserId(parseInt(userId));
      
      // Generate AI-powered recommendations
      const recommendations = await generateAIPoweredRecommendations({
        user,
        assessment,
        category,
        location: location || user.location,
        preferences: preferences || user.preferences,
        radius: 25
      });

      // Store or update activities in the database
      // For now, we'll return them directly to the frontend
      return res.json({ 
        success: true, 
        recommendations,
        message: "AI recommendations generated successfully" 
      });
    } catch (error) {
      console.error("Error generating AI-powered recommendations:", error);
      res.status(500).json({ error: "Failed to generate AI recommendations" });
    }
  });

  // Message Generation Routes
  app.post("/api/messages/generate", async (req, res) => {
    try {
      const { userId, category, timeOfDay, recentContext, specialOccasion } = req.body;
      
      if (!userId || !category) {
        return res.status(400).json({ 
          success: false, 
          error: "User ID and category are required" 
        });
      }

      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: "User not found" 
        });
      }

      const request: GenerateMessageRequest = {
        userId: userId.toString(),
        category,
        timeOfDay,
        recentContext,
        specialOccasion
      };

      const result = await generatePersonalizedMessages(request, user);
      res.json(result);

    } catch (error) {
      console.error("Error generating messages:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to generate messages" 
      });
    }
  });

  app.get("/api/messages/categories", async (req, res) => {
    try {
      const categories = getMessageCategories();
      res.json({
        success: true,
        categories
      });
    } catch (error) {
      console.error("Error fetching message categories:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch message categories" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions
function calculatePersonalityScores(responses: any) {
  // Simple scoring algorithm based on responses
  const scores = {
    thoughtful: 0,
    practical: 0,
    emotional: 0,
    independent: 0,
    social: 0,
    quiet: 0,
    adventurous: 0,
    nurturing: 0
  };

  // Process responses and calculate scores
  Object.entries(responses).forEach(([question, answer]) => {
    const answerKey = (answer as string).toLowerCase();
    
    // Map answers to personality traits
    if (answerKey.includes('plan') || answerKey.includes('detail')) {
      scores.thoughtful += 1;
    }
    if (answerKey.includes('simple') || answerKey.includes('practical')) {
      scores.practical += 1;
    }
    if (answerKey.includes('understanding') || answerKey.includes('perspective')) {
      scores.emotional += 1;
    }
    if (answerKey.includes('direct') || answerKey.includes('immediately')) {
      scores.independent += 1;
    }
    if (answerKey.includes('new') || answerKey.includes('trying')) {
      scores.adventurous += 1;
    }
    if (answerKey.includes('partner') || answerKey.includes('loves')) {
      scores.nurturing += 1;
    }
  });

  return scores;
}

function determinePersonalityType(scores: any): string {
  // Find the highest scoring trait
  const maxScore = Math.max(...Object.values(scores));
  const topTrait = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];

  // Map traits to personality types
  const traitToType = {
    thoughtful: "Thoughtful Harmonizer",
    practical: "Practical Supporter", 
    emotional: "Emotional Connector",
    independent: "Independent Thinker",
    social: "Social Butterfly",
    quiet: "Quiet Confidant",
    adventurous: "Adventure Seeker",
    nurturing: "Nurturing Caregiver"
  };

  return traitToType[topTrait] || "Thoughtful Harmonizer";
}