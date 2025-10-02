import { Express } from "express";
import { createServer } from "http";
import { 
  generatePersonalityInsight, 
  generatePersonalizedMessages, 
  generateActivityRecommendations,
  generateLocationBasedRecommendations,
  type RecommendationContext 
} from "./openai";

// Simple data storage for the session
const sessionData = {
  users: new Map(),
  assessments: new Map(),
  recommendations: new Map(),
  activities: new Map(),
  currentUserId: 1,
  currentAssessmentId: 1,
  currentRecommendationId: 1,
  currentActivityId: 1
};

// Initialize with sample activities
const sampleActivities = [
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
  },
  {
    id: 4,
    name: "Cooking Class for Couples",
    description: "Learn to cook a romantic dinner together in this hands-on class.",
    category: "creative",
    rating: 4.6,
    personalityMatch: "90% match",
    distance: "1.5 miles",
    imageUrl: "/api/placeholder/400/300"
  },
  {
    id: 5,
    name: "Rock Climbing Adventure",
    description: "Challenge yourselves with indoor rock climbing followed by a smoothie.",
    category: "active",
    rating: 4.4,
    personalityMatch: "78% match",
    distance: "2.1 miles",
    imageUrl: "/api/placeholder/400/300"
  }
];

sampleActivities.forEach(activity => {
  sessionData.activities.set(activity.id, activity);
});

export async function registerRoutes(app: Express) {
  
  // Authentication routes (simplified - no JWT)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, partnerName, relationshipDuration } = req.body;
      
      // Simple user creation
      const user = {
        id: sessionData.currentUserId++,
        email,
        password, // In a real app, this would be hashed
        name,
        partnerName,
        relationshipDuration,
        personalityType: null,
        personalityInsight: null,
        preferences: null,
        location: null,
        createdAt: new Date()
      };
      
      sessionData.users.set(user.id, user);
      
      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          partnerName: user.partnerName,
          relationshipDuration: user.relationshipDuration
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to create account' });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      let user: any = null;
      const usersArray = Array.from(sessionData.users.values()) as any[];
      for (const u of usersArray) {
        if (u.email === email && u.password === password) {
          user = u;
          break;
        }
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
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
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  // User profile routes
  app.get("/api/user/profile", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const user = sessionData.users.get(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate personality insights if available
      let personalityInsight = user.personalityInsight;
      if (user.personalityType && !personalityInsight) {
        const assessment = sessionData.assessments.get(userId);
        if (assessment) {
          personalityInsight = await generatePersonalityInsight(
            user.personalityType,
            user.partnerName,
            assessment.responses
          );
          
          // Update user with generated insight
          user.personalityInsight = personalityInsight;
          sessionData.users.set(userId, user);
        }
      }
      
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        partnerName: user.partnerName,
        relationshipDuration: user.relationshipDuration,
        personalityType: user.personalityType,
        personalityInsight: personalityInsight,
        preferences: user.preferences,
        location: user.location
      });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Assessment routes
  app.post("/api/assessment/responses", async (req, res) => {
    try {
      const { userId, responses, personalityType } = req.body;
      
      const assessment = {
        id: sessionData.currentAssessmentId++,
        userId: parseInt(userId),
        responses,
        personalityType,
        completedAt: new Date()
      };
      
      sessionData.assessments.set(parseInt(userId), assessment);
      
      // Update user with personality type
      const user = sessionData.users.get(parseInt(userId));
      if (user) {
        user.personalityType = personalityType;
        sessionData.users.set(parseInt(userId), user);
      }
      
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

  // Guest assessment route
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

  // Recommendations routes
  app.get("/api/recommendations/messages", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const user = sessionData.users.get(userId);
      const assessment = sessionData.assessments.get(userId);
      
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

      const messages = await generatePersonalizedMessages(recommendationContext, 5);
      
      // Convert to recommendation format
      const recommendations = messages.map((message, index) => ({
        id: sessionData.currentRecommendationId++,
        userId: userId,
        type: "message",
        category: "daily",
        content: message,
        priority: index === 0 ? "high" : "medium",
        personalityMatch: "AI-generated",
        isRead: false,
        createdAt: new Date()
      }));

      res.json(recommendations);
    } catch (error) {
      console.error("Error generating message recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  app.get("/api/recommendations/activities", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const user = sessionData.users.get(userId);
      const assessment = sessionData.assessments.get(userId);
      
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
      const userId = parseInt(req.query.userId as string);
      const { radius = 25 } = req.query;
      
      const user = sessionData.users.get(userId);
      const assessment = sessionData.assessments.get(userId);
      
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

  // User preferences route
  app.post("/api/user/preferences", async (req, res) => {
    try {
      const { userId, preferences, location } = req.body;
      const user = sessionData.users.get(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      user.preferences = preferences;
      user.location = location;
      sessionData.users.set(parseInt(userId), user);
      
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
      const activities = Array.from(sessionData.activities.values());
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}