import axios from 'axios';

// Activity recommendation interface
export interface ActivityRecommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  distance: number;
  price: string;
  address: string;
  phone?: string;
  website?: string;
  specialties?: string[];
  atmosphere?: string;
  estimatedCost: string;
  recommendedTime: string;
  personalityMatch: string;
}

// Location interface
export interface Location {
  latitude: number;
  longitude: number;
}

// Activity categories with specialized handling
export const ACTIVITY_CATEGORIES = {
  recommended: { id: 'recommended', label: 'Recommended', icon: '⭐', color: 'blue' },
  near_me: { id: 'near_me', label: 'Near Me', icon: '📍', color: 'green' },
  dining: { id: 'dining', label: 'Dining', icon: '🍽️', color: 'orange' },
  outdoor: { id: 'outdoor', label: 'Outdoor', icon: '🌳', color: 'emerald' },
  cultural: { id: 'cultural', label: 'Cultural', icon: '🎭', color: 'purple' },
  active: { id: 'active', label: 'Active', icon: '⚡', color: 'red' },
  drinks: { id: 'drinks', label: 'Drinks', icon: '🍹', color: 'amber' }
};

// Drink preferences with ordering
export const DRINK_PREFERENCES = {
  coffee: { id: 'coffee', label: 'Coffee', icon: '☕' },
  tea: { id: 'tea', label: 'Tea', icon: '🍵' },
  alcohol: { id: 'alcohol', label: 'Alcohol', icon: '🍷' },
  non_alcohol: { id: 'non_alcohol', label: 'Non-Alcohol', icon: '🥤' },
  boba: { id: 'boba', label: 'Boba', icon: '🧋' },
  other: { id: 'other', label: 'Other', icon: '🥛' }
};

// Recommendation algorithm with generation limits
class RecommendationAlgorithm {
  private generationCounts: Map<string, number> = new Map();
  private excludedRecommendations: Set<string> = new Set();
  
  canGenerateMore(sessionKey: string): boolean {
    const count = this.generationCounts.get(sessionKey) || 0;
    return count < 2; // Maximum 2 additional generations
  }
  
  incrementGeneration(sessionKey: string): void {
    const current = this.generationCounts.get(sessionKey) || 0;
    this.generationCounts.set(sessionKey, current + 1);
  }
  
  getGenerationsRemaining(sessionKey: string): number {
    const current = this.generationCounts.get(sessionKey) || 0;
    return Math.max(0, 2 - current);
  }
  
  addExcluded(recommendation: string): void {
    this.excludedRecommendations.add(recommendation);
  }
  
  resetSession(sessionKey: string): void {
    this.generationCounts.delete(sessionKey);
    this.excludedRecommendations.clear();
  }
}

export class GrokAIService {
  private apiKey: string;
  private algorithm = new RecommendationAlgorithm();
  
  constructor() {
    this.apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Grok AI API key not found. Fallback recommendations will be used.');
    }
  }
  
  // Generate location-based activity recommendations
  async generateActivityRecommendations(
    userId: number,
    location: Location,
    radius: number,
    category: string,
    preferences: any,
    personalityType?: string
  ): Promise<{
    recommendations: ActivityRecommendation[];
    canGenerateMore: boolean;
    generationsRemaining: number;
  }> {
    const sessionKey = `${userId}_${category}`;
    
    try {
      // Check if AI service is available
      if (!this.apiKey) {
        return this.getFallbackRecommendations(category, location);
      }
      
      const prompt = this.buildActivityPrompt(category, location, radius, preferences, personalityType);
      const response = await this.callGrokAPI(prompt);
      const recommendations = this.parseActivityResponse(response, category, location);
      
      // Update algorithm state
      this.algorithm.incrementGeneration(sessionKey);
      
      return {
        recommendations: this.sortByLocalAndRadius(recommendations, location, radius),
        canGenerateMore: this.algorithm.canGenerateMore(sessionKey),
        generationsRemaining: this.algorithm.getGenerationsRemaining(sessionKey)
      };
      
    } catch (error) {
      console.error('Grok AI error:', error);
      return this.getFallbackRecommendations(category, location);
    }
  }
  
  // Generate drink-specific recommendations
  async generateDrinkRecommendations(
    userId: number,
    location: Location,
    radius: number,
    drinkPreferences: string[],
    personalityType?: string
  ): Promise<{
    recommendations: { [key: string]: ActivityRecommendation[] };
    canGenerateMore: boolean;
    generationsRemaining: number;
  }> {
    const sessionKey = `${userId}_drinks`;
    const results: { [key: string]: ActivityRecommendation[] } = {};
    
    try {
      // Generate recommendations for each drink preference
      for (const preference of drinkPreferences) {
        const prompt = this.buildDrinkPrompt(preference, location, radius, personalityType);
        const response = await this.callGrokAPI(prompt);
        const recommendations = this.parseActivityResponse(response, 'drinks', location);
        results[preference] = recommendations.slice(0, 3); // Max 3 per preference
      }
      
      // Update algorithm state
      this.algorithm.incrementGeneration(sessionKey);
      
      return {
        recommendations: results,
        canGenerateMore: this.algorithm.canGenerateMore(sessionKey),
        generationsRemaining: this.algorithm.getGenerationsRemaining(sessionKey)
      };
      
    } catch (error) {
      console.error('Grok AI drink recommendations error:', error);
      return this.getFallbackDrinkRecommendations(drinkPreferences, location);
    }
  }
  
  // Build activity-specific prompts
  private buildActivityPrompt(
    category: string,
    location: Location,
    radius: number,
    preferences: any,
    personalityType?: string
  ): string {
    const basePrompt = `Generate 3 real, specific ${category} recommendations for a couple's date within ${radius} miles of coordinates ${location.latitude}, ${location.longitude}.`;
    
    const categoryPrompts = {
      recommended: `Focus on highly-rated, personality-matched activities based on ${personalityType} personality type.`,
      near_me: `Prioritize proximity and quality. Include the closest high-quality options.`,
      dining: `Include restaurants, cafes, and unique food experiences. Consider cuisine variety and ambiance.`,
      outdoor: `Focus on parks, hiking trails, and outdoor activities suitable for couples.`,
      cultural: `Include museums, galleries, theaters, and enriching cultural experiences.`,
      active: `Focus on fitness activities, sports, and active pursuits suitable for couples.`,
      drinks: `Include bars, cafes, and beverage-focused venues with great atmospheres.`
    };
    
    return `${basePrompt} ${categoryPrompts[category as keyof typeof categoryPrompts] || categoryPrompts.recommended}
    
    Return a JSON array with exactly this structure for each recommendation:
    {
      "id": "unique_id",
      "name": "Establishment Name",
      "description": "Brief engaging description",
      "category": "${category}",
      "rating": 4.5,
      "distance": 2.3,
      "price": "$20-40 per person",
      "address": "Full street address",
      "phone": "phone number",
      "website": "website if available",
      "specialties": ["specialty1", "specialty2"],
      "atmosphere": "atmosphere description",
      "estimatedCost": "cost estimate",
      "recommendedTime": "best time to visit",
      "personalityMatch": "why this matches ${personalityType} personality"
    }
    
    Ensure all locations are real and within the specified radius. Return only the JSON array.`;
  }
  
  // Build drink-specific prompts
  private buildDrinkPrompt(
    drinkType: string,
    location: Location,
    radius: number,
    personalityType?: string
  ): string {
    const drinkPrompts = {
      coffee: 'coffee shops, specialty coffee roasters, cozy cafes with artisan coffee',
      tea: 'tea houses, bubble tea shops, specialty tea cafes with traditional and modern tea experiences',
      alcohol: 'bars, restaurants with excellent drink menus, cocktail lounges, mix of dining and drinking establishments',
      non_alcohol: 'juice bars, smoothie shops, cafes with creative non-alcoholic beverages',
      boba: 'bubble tea shops, boba cafes, Asian tea houses with authentic boba experiences',
      other: 'unique beverage spots, specialty drink establishments, innovative beverage experiences'
    };
    
    return `Generate 3 real, specific ${drinkType} venue recommendations for a couple's date within ${radius} miles of coordinates ${location.latitude}, ${location.longitude}.
    
    Focus on: ${drinkPrompts[drinkType as keyof typeof drinkPrompts]}
    
    Return a JSON array with the same structure as activity recommendations, emphasizing drink specialties and atmosphere.`;
  }
  
  // Call Grok AI API
  private async callGrokAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Grok API key not available');
    }
    
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'grok-3-mini',
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  }
  
  // Parse AI response into recommendations
  private parseActivityResponse(
    response: string,
    category: string,
    location: Location
  ): ActivityRecommendation[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getFallbackRecommendations(category, location).recommendations;
    }
  }
  
  // Sort recommendations by local priority and radius
  private sortByLocalAndRadius(
    recommendations: ActivityRecommendation[],
    location: Location,
    radius: number
  ): ActivityRecommendation[] {
    // Ensure first recommendation is local (within 2-3 miles)
    const local = recommendations.filter(r => r.distance <= 3);
    const withinRadius = recommendations.filter(r => r.distance > 3 && r.distance <= radius);
    
    // Sort by rating and distance
    local.sort((a, b) => b.rating - a.rating);
    withinRadius.sort((a, b) => b.rating - a.rating || a.distance - b.distance);
    
    return [...local.slice(0, 1), ...withinRadius.slice(0, 2)];
  }
  
  // Fallback recommendations when AI is unavailable
  private getFallbackRecommendations(category: string, location: Location): {
    recommendations: ActivityRecommendation[];
    canGenerateMore: boolean;
    generationsRemaining: number;
  } {
    const fallbackData: ActivityRecommendation[] = [
      {
        id: `fallback_${category}_1`,
        name: `Local ${category} Spot`,
        description: `Great ${category} location for couples`,
        category,
        rating: 4.2,
        distance: 1.5,
        price: '$15-30 per person',
        address: 'Local area near you',
        specialties: ['Great atmosphere', 'Couple-friendly'],
        atmosphere: 'Romantic and welcoming',
        estimatedCost: '$25 per person',
        recommendedTime: 'Evening',
        personalityMatch: 'Perfect for any personality type'
      },
      {
        id: `fallback_${category}_2`,
        name: `${category} Experience`,
        description: `Popular ${category} destination`,
        category,
        rating: 4.0,
        distance: 3.2,
        price: '$20-40 per person',
        address: 'Nearby location',
        specialties: ['Quality service', 'Great reviews'],
        atmosphere: 'Cozy and intimate',
        estimatedCost: '$35 per person',
        recommendedTime: 'Afternoon',
        personalityMatch: 'Appeals to thoughtful couples'
      },
      {
        id: `fallback_${category}_3`,
        name: `Premium ${category} Venue`,
        description: `High-quality ${category} experience`,
        category,
        rating: 4.4,
        distance: 5.0,
        price: '$30-50 per person',
        address: 'Quality location nearby',
        specialties: ['Premium experience', 'Special occasions'],
        atmosphere: 'Elegant and memorable',
        estimatedCost: '$45 per person',
        recommendedTime: 'Weekend evening',
        personalityMatch: 'Perfect for celebrating together'
      }
    ];
    
    return {
      recommendations: fallbackData,
      canGenerateMore: false,
      generationsRemaining: 0
    };
  }
  
  // Fallback drink recommendations
  private getFallbackDrinkRecommendations(
    drinkPreferences: string[],
    location: Location
  ): {
    recommendations: { [key: string]: ActivityRecommendation[] };
    canGenerateMore: boolean;
    generationsRemaining: number;
  } {
    const results: { [key: string]: ActivityRecommendation[] } = {};
    
    drinkPreferences.forEach(preference => {
      results[preference] = [
        {
          id: `fallback_${preference}_1`,
          name: `Local ${preference} Spot`,
          description: `Great ${preference} location`,
          category: 'drinks',
          rating: 4.1,
          distance: 2.0,
          price: '$8-15 per drink',
          address: 'Local area',
          specialties: [preference, 'cozy atmosphere'],
          atmosphere: 'Relaxed and friendly',
          estimatedCost: '$12 per person',
          recommendedTime: 'Afternoon',
          personalityMatch: 'Perfect for any couple'
        }
      ];
    });
    
    return {
      recommendations: results,
      canGenerateMore: false,
      generationsRemaining: 0
    };
  }
  
  // Reset generation algorithm for new session
  resetAlgorithm(userId: number, category: string): void {
    this.algorithm.resetSession(`${userId}_${category}`);
  }
}

// Export singleton instance
export const grokAIService = new GrokAIService();