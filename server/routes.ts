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
import { grokAIService } from "./grok-ai";
import { calendarProviderManager } from "./calendar-providers";

// Remove JWT authentication - use simple session management

export async function registerRoutes(app: Express) {
  
// Helper middleware: resolves a local user from request context
  const ensureLocalUser = async (req: any, res: any, next: any) => {
    try {
      const candidate = (req.body?.userId ?? req.query?.userId ?? (req.params && (req.params as any).userId) ?? req.headers['x-user-id']) as any;
      const parsed = typeof candidate === 'string' ? parseInt(candidate, 10) : candidate;
      if (parsed && !Number.isNaN(parsed)) {
        const user = await storage.getUser(parsed);
        if (user) {
          req.localUser = user;
          return next();
        }
      }
      return res.status(401).json({ error: "Unauthorized" });
    } catch (err) {
      console.error("ensureLocalUser error:", err);
      res.status(500).json({ error: "Failed to resolve local user" });
    }
  };

// Soft resolver: derive local user purely from request
  const resolveLocalUserSoft = async (req: any, res: any, next: any) => {
    try {
      const candidate = (req.body?.userId ?? req.query?.userId ?? (req.params && (req.params as any).userId) ?? req.headers['x-user-id']) as any;
      const parsed = typeof candidate === 'string' ? parseInt(candidate, 10) : candidate;
      if (parsed && !Number.isNaN(parsed)) {
        const user = await storage.getUser(parsed);
        if (user) {
          req.localUser = user;
          return next();
        }
      }
      return res.status(401).json({ error: "Unauthorized" });
    } catch (err) {
      console.error("resolveLocalUserSoft error:", err);
      res.status(500).json({ error: "Failed to resolve local user" });
    }
  };

// Simple auth resolver for legacy/local auth: fetch by userId
  app.get("/api/auth/me", ensureLocalUser, async (req: any, res) => {
    try {
      const user = req.localUser;
      return res.json({ user: {
        id: user.id,
        email: user.email,
        name: user.name,
        partnerName: user.partnerName,
        relationshipDuration: user.relationshipDuration,
        personalityType: user.personalityType,
        personalityInsight: user.personalityInsight,
        preferences: user.preferences,
        location: user.location,
      }});
    } catch (error: any) {
      console.error("/api/auth/me error:", error);
      return res.status(500).json({ error: "Failed to fetch authenticated user" });
    }
  });

  // Authentication routes - simplified without JWT (local auth is primary)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, partnerName, relationshipDuration, partnerAge } = req.body;
      
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
        partnerAge: partnerAge ? parseInt(partnerAge, 10) : null,
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
          partnerAge: (user as any).partnerAge,
          personalityType: user.personalityType,
          personalityInsight: user.personalityInsight,
          preferences: user.preferences,
          location: user.location
        }
      });
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // User profile route
  app.get("/api/user/profile", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const userId = req.localUser.id as number;
      let user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Ensure personalityType reflects the most recent assessment (self-healing)
      const latestAssessment = await storage.getAssessmentByUserId(userId);
      if (latestAssessment?.personalityType && latestAssessment.personalityType !== user.personalityType) {
        user = await storage.updateUser(userId, { personalityType: latestAssessment.personalityType } as any);
      }

      // If personalityType exists but no stored insight, generate it lazily
      let personalityInsight = user.personalityInsight;
      if (user.personalityType && !personalityInsight && latestAssessment) {
        personalityInsight = await generatePersonalityInsight(
          user.personalityType,
          user.partnerName || "",
          latestAssessment.responses as Record<string, string>
        );
        await storage.updateUser(userId, { personalityInsight });
      }
      
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        partnerName: user.partnerName,
        relationshipDuration: user.relationshipDuration,
        partnerAge: (user as any).partnerAge,
        personalityType: user.personalityType,
        personalityInsight,
        preferences: user.preferences,
        location: user.location
      });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Assessment routes - secured; derive userId from local request context
app.post("/api/assessment/responses", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const { responses, personalityType } = req.body;
      const userId = req.localUser.id as number;
      
      const assessmentData = {
        userId,
        responses,
        personalityType: personalityType || "Unknown",
        completedAt: new Date()
      };

      const assessment = await storage.saveAssessmentResponse(assessmentData);
      
      // Update user's personality type
      await storage.updateUser(userId, { 
        personalityType: personalityType || "Unknown"
      });

      res.json({
        id: assessment.id,
        userId: assessment.userId,
        personalityType: assessment.personalityType,
        completedAt: assessment.completedAt
      });
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Error processing guest assessment:", error);
      res.status(500).json({ error: "Failed to process guest assessment" });
    }
  });



  // User preferences route - secured; derive userId
app.post("/api/user/preferences", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const { preferences, location, partnerAge } = req.body;
      const userId = req.localUser.id as number;
      // If partnerAge provided, persist alongside preferences
      if (partnerAge !== undefined) {
        await storage.updateUser(userId, { partnerAge: parseInt(partnerAge, 10) } as any);
      }
      const user = await storage.updateUserPreferences(userId, preferences, location);
      
      res.json({ 
        message: "Preferences saved successfully",
        user: {
          id: user.id,
          name: user.name,
          preferences: user.preferences,
          location: user.location
        }
      });
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  // Activities route (public)
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error: any) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Recommendations: activities - secured; derive userId
app.get("/api/recommendations/activities", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const userId = req.localUser.id as number;
      const user = await storage.getUser(userId);
      const assessment = await storage.getAssessmentByUserId(userId);
      
      if (!user || !assessment) {
        return res.status(404).json({ error: "User or assessment not found" });
      }

      const recommendationContext: RecommendationContext = {
        userName: user.name,
        partnerName: user.partnerName || "",
        personalityType: user.personalityType || "Unknown",
        relationshipDuration: user.relationshipDuration || "",
        assessmentResponses: assessment.responses as Record<string, string>
      };

      const activities = await generateActivityRecommendations(recommendationContext, 8);
      
      res.json(activities);
    } catch (error: any) {
      console.error("Error generating activity recommendations:", error);
      res.status(500).json({ error: "Failed to generate activity recommendations" });
    }
  });

app.get("/api/recommendations/location-based", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const userId = req.localUser.id as number;
      const { radius = 25 } = req.query;
      
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
        partnerName: user.partnerName || "",
        personalityType: user.personalityType || "Unknown",
        relationshipDuration: user.relationshipDuration || "",
        assessmentResponses: assessment.responses as Record<string, string>
      };

      const activities = await generateLocationBasedRecommendations(
        recommendationContext,
        user.location as any,
        user.preferences,
        parseInt(radius as string),
        12
      );
      
      res.json({ activities });
    } catch (error: any) {
      console.error("Error generating location-based recommendations:", error);
      res.status(500).json({ error: "Failed to generate location-based recommendations" });
    }
  });

  // New Grok AI Location-Based Recommendation Endpoints
app.post("/api/recommendations/location-based", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const { location, radius, category, preferences, personalityType, resetAlgorithm } = req.body;
      const userId = req.localUser.id as number;
      
      if (!location || !radius || !category) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      if (resetAlgorithm) {
        grokAIService.resetAlgorithm(userId, category);
      }
      
      const result = await grokAIService.generateActivityRecommendations(
        userId,
        location,
        radius,
        category,
        preferences,
        personalityType
      );
      
      res.json({
        success: true,
        recommendations: result.recommendations,
        canGenerateMore: result.canGenerateMore,
        generationsRemaining: result.generationsRemaining,
        category,
        radius
      });
    } catch (error: any) {
      console.error("Error generating location-based recommendations:", error);
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to generate location-based recommendations" 
      });
    }
  });

app.post("/api/recommendations/drinks", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const { location, radius, drinkPreferences, personalityType, resetAlgorithm } = req.body;
      const userId = req.localUser.id as number;
      
      if (!location || !radius || !drinkPreferences) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      if (resetAlgorithm) {
        grokAIService.resetAlgorithm(userId, "drinks");
      }
      
      const result = await grokAIService.generateDrinkRecommendations(
        userId,
        location,
        radius,
        drinkPreferences,
        personalityType
      );
      
      res.json({
        success: true,
        recommendations: result.recommendations,
        canGenerateMore: result.canGenerateMore,
        generationsRemaining: result.generationsRemaining
      });
    } catch (error: any) {
      console.error("Error generating drink recommendations:", error);
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to generate drink recommendations" 
      });
    }
  });

  app.get("/api/recommendations/categories", async (req, res) => {
    try {
      res.json({
        success: true,
        categories: [
          { id: "recommended", label: "Recommended", icon: "⭐", color: "blue" },
          { id: "near_me", label: "Near Me", icon: "📍", color: "green" },
          { id: "dining", label: "Dining", icon: "🍽️", color: "orange" },
          { id: "outdoor", label: "Outdoor", icon: "🌳", color: "emerald" },
          { id: "cultural", label: "Cultural", icon: "🎭", color: "purple" },
          { id: "active", label: "Active", icon: "⚡", color: "red" },
          { id: "drinks", label: "Drinks", icon: "🍹", color: "amber" }
        ],
        drinkPreferences: [
          { id: "coffee", label: "Coffee", icon: "☕" },
          { id: "tea", label: "Tea", icon: "🍵" },
          { id: "alcohol", label: "Alcohol", icon: "🍷" },
          { id: "non_alcohol", label: "Non-Alcohol", icon: "🥤" },
          { id: "boba", label: "Boba", icon: "🧋" },
          { id: "other", label: "Other", icon: "🥛" }
        ]
      });
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch categories" 
      });
    }
  });

  // Update user preferences endpoint to include drink preferences
app.put("/api/user/preferences", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const { preferences } = req.body;
      const userId = req.localUser.id as number;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        preferences: { ...(user.preferences || {}), ...(preferences || {}) }
      });
      
      res.json({
        success: true,
        user: updatedUser,
        preferences: updatedUser.preferences
      });
    } catch (error: any) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to update preferences" 
      });
    }
  });

  // Calendar Provider Routes
app.get("/api/calendar/providers", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const userId = String(req.localUser.id);
      const providers = await calendarProviderManager.getProviders(userId);
      res.json(providers);
    } catch (error: any) {
      console.error("Error fetching calendar providers:", error);
      res.status(500).json({ error: "Failed to fetch calendar providers" });
    }
  });

app.post("/api/calendar/connect/:providerId", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const { providerId } = req.params;
      const userId = String(req.localUser.id);
      
      const authUrl = await calendarProviderManager.generateAuthUrl(providerId, userId);
      res.json({ authUrl });
    } catch (error: any) {
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
      } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Error disconnecting calendar provider:", error);
      res.status(500).json({ error: error.message || "Failed to disconnect calendar provider" });
    }
  });

app.get("/api/calendar/events/:providerId", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const { providerId } = req.params;
      const { startDate, endDate } = req.query;
      const userId = String(req.localUser.id);
      
      const events = await calendarProviderManager.getEvents(
        providerId,
        userId,
        startDate as string,
        endDate as string
      );
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: error.message || "Failed to fetch calendar events" });
    }
  });

  // User events route - return user's calendar events from database
app.get("/api/events/user/:userId", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const localUserId = req.localUser.id as number;
      const events = await storage.getUserEvents(localUserId);
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ error: "Failed to fetch user events" });
    }
  });

  // Create new event route
app.post("/api/events", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const injected = { ...req.body, userId: req.localUser.id };
      const eventData = insertCalendarEventSchema.parse(injected);
      const event = await storage.createEvent(eventData);
      
      // Increment events created counter
      if (eventData.userId) {
        await storage.incrementEventsCreated(eventData.userId);
      }
      
      res.json(event);
    } catch (error: any) {
      console.error("Error creating event:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Delete event route
  app.delete("/api/events/:eventId", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const userId = req.localUser.id as number;
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) return res.status(400).json({ error: "Invalid event id" });

      const deleted = await storage.deleteEvent(eventId, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      await storage.decrementEventsCreated(userId, 1);
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // User statistics routes
app.get("/api/user/stats/:userId", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const userId = req.localUser.id as number;
      const stats = await storage.getUserStats(userId);
      
      if (!stats) {
        return res.json({ eventsCreated: 0 });
      }
      
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  });



  // AI-powered recommendations endpoint
app.post("/api/recommendations/ai-powered", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const { category, location, preferences } = req.body;
      
      const user = await storage.getUser(req.localUser.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's assessment for personality context
      const assessment = await storage.getAssessmentByUserId(req.localUser.id);
      
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
    } catch (error: any) {
      console.error("Error generating AI-powered recommendations:", error);
      res.status(500).json({ error: "Failed to generate AI recommendations" });
    }
  });

  // Message Generation Routes
app.post("/api/messages/generate", resolveLocalUserSoft, async (req: any, res) => {
    try {
      const { category, timeOfDay, recentContext, specialOccasion } = req.body;
      
      if (!category) {
        return res.status(400).json({ 
          success: false, 
          error: "Category is required" 
        });
      }

      const user = await storage.getUser(req.localUser.id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: "User not found" 
        });
      }

      const request: GenerateMessageRequest = {
        userId: (req.localUser.id as number).toString(),
        category,
        timeOfDay,
        recentContext,
        specialOccasion
      };

      const result = await generatePersonalizedMessages(request, user);
      res.json(result);

    } catch (error: any) {
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
    } catch (error: any) {
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
  const values = Object.values(scores) as number[];
  const maxScore = Math.max(...values);
  const topTrait = (Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || "thoughtful") as string;

  // Map traits to personality types
  const traitToType: Record<string, string> = {
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