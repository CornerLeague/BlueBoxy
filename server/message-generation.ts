import OpenAI from "openai";
import type { User } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Message Categories
export const MESSAGE_CATEGORIES = {
  daily_checkins: {
    id: "daily_checkins",
    label: "Daily Check-ins",
    description: "Show daily care and maintain connection"
  },
  appreciation: {
    id: "appreciation", 
    label: "Appreciation",
    description: "Express gratitude and acknowledge partner's value"
  },
  support: {
    id: "support",
    label: "Support", 
    description: "Provide emotional support during challenges"
  },
  romantic: {
    id: "romantic",
    label: "Romantic",
    description: "Express love and romantic feelings"
  },
  playful: {
    id: "playful",
    label: "Playful",
    description: "Add fun and lightness to the relationship"
  }
} as const;

// Personality Types
export const PERSONALITY_TYPES = {
  "Nurturing Connector": "Warm, emotionally expressive, caring",
  "Devoted Caregiver": "Thoughtful, service-oriented, attentive", 
  "Thoughtful Analyst": "Intellectual, detailed, meaningful conversations",
  "Practical Partner": "Straightforward, solution-focused, reliable",
  "Independent Achiever": "Confident, goal-oriented, encouraging",
  "Adventure Companion": "Energetic, spontaneous, fun-loving",
  "Selective Intimate": "Private, deep, selective with emotions",
  "Loyal Supporter": "Steady, supportive, encouraging"
} as const;

export interface GenerateMessageRequest {
  userId: string;
  category: keyof typeof MESSAGE_CATEGORIES;
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
  recentContext?: string;
  specialOccasion?: string;
}

export interface GeneratedMessage {
  id: string;
  content: string;
  category: string;
  personalityMatch: string;
  tone: string;
  estimatedImpact: "high" | "medium" | "low";
}

export interface MessageGenerationResponse {
  success: boolean;
  messages: GeneratedMessage[];
  context: {
    category: string;
    personalityType: string;
    partnerName: string;
  };
  error?: string;
}

export async function generatePersonalizedMessages(
  request: GenerateMessageRequest,
  user: User
): Promise<MessageGenerationResponse> {
  try {
    const category = MESSAGE_CATEGORIES[request.category];
    const personalityType = user.personalityType || "Thoughtful Harmonizer";
    const personalityTrait = PERSONALITY_TYPES[personalityType as keyof typeof PERSONALITY_TYPES];
    const partnerName = user.partnerName;
    const timeOfDay = request.timeOfDay || "any time";

    const prompt = buildPromptForCategory(
      request.category,
      personalityType,
      personalityTrait,
      partnerName,
      timeOfDay,
      request.recentContext,
      request.specialOccasion
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert relationship counselor and communication specialist. Generate thoughtful, personalized messages that sound natural and authentic. Respond with JSON only."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.messages || !Array.isArray(result.messages)) {
      throw new Error("Invalid response format from OpenAI");
    }

    const messages: GeneratedMessage[] = result.messages.map((msg: any, index: number) => ({
      id: `${request.category}_${Date.now()}_${index}`,
      content: msg.content,
      category: request.category,
      personalityMatch: personalityType,
      tone: msg.tone || "warm",
      estimatedImpact: msg.impact || "medium"
    }));

    return {
      success: true,
      messages,
      context: {
        category: category.label,
        personalityType,
        partnerName
      }
    };

  } catch (error) {
    console.error("Error generating messages:", error);
    return generateFallbackMessages(request, user);
  }
}

function buildPromptForCategory(
  category: keyof typeof MESSAGE_CATEGORIES,
  personalityType: string,
  personalityTrait: string,
  partnerName: string,
  timeOfDay: string,
  recentContext?: string,
  specialOccasion?: string
): string {
  const categoryInfo = MESSAGE_CATEGORIES[category];
  
  const basePrompt = `Generate 3 thoughtful, personalized messages for the "${categoryInfo.label}" category.

Partner Details:
- Name: ${partnerName}
- Personality Type: ${personalityType}
- Traits: ${personalityTrait}
- Time of Day: ${timeOfDay}
${recentContext ? `- Recent Context: ${recentContext}` : ''}
${specialOccasion ? `- Special Occasion: ${specialOccasion}` : ''}

Category Purpose: ${categoryInfo.description}

Guidelines for ${categoryInfo.label}:
${getCategoryGuidelines(category)}

Requirements:
- Generate exactly 3 unique messages
- Tailor each message to the ${personalityType} personality type
- Make messages feel authentic and personal
- Vary the tone and approach across the 3 messages
- Keep messages concise but meaningful
- Use the partner's name naturally when appropriate

Response Format (JSON):
{
  "messages": [
    {
      "content": "The actual message text here",
      "tone": "warm|playful|supportive|romantic|encouraging",
      "impact": "high|medium|low"
    }
  ]
}`;

  return basePrompt;
}

function getCategoryGuidelines(category: keyof typeof MESSAGE_CATEGORIES): string {
  switch (category) {
    case "daily_checkins":
      return `- Show genuine interest in their day
- Express care and connection
- Ask thoughtful questions
- Share your own experiences
- Keep tone warm and attentive`;

    case "appreciation":
      return `- Be specific about what you appreciate
- Acknowledge their efforts and qualities
- Express genuine gratitude
- Highlight their positive impact
- Make them feel valued and seen`;

    case "support": 
      return `- Offer encouragement and belief in them
- Provide emotional reassurance
- Show you're there for them
- Acknowledge their strength
- Be empathetic and understanding`;

    case "romantic":
      return `- Express deep feelings authentically
- Share what makes them special to you
- Create intimate, loving connection
- Be vulnerable and genuine
- Focus on your bond and future together`;

    case "playful":
      return `- Add humor and lightness
- Create fun and joy
- Use inside jokes if appropriate
- Be spontaneous and cheerful
- Make them smile and laugh`;

    default:
      return "Create meaningful, personalized messages that strengthen your relationship.";
  }
}

function generateFallbackMessages(
  request: GenerateMessageRequest,
  user: User
): MessageGenerationResponse {
  const category = MESSAGE_CATEGORIES[request.category];
  const fallbackMessages = getFallbackMessagesForCategory(request.category, user.partnerName);

  return {
    success: true,
    messages: fallbackMessages.map((content, index) => ({
      id: `${request.category}_fallback_${Date.now()}_${index}`,
      content,
      category: request.category,
      personalityMatch: user.personalityType || "Thoughtful Harmonizer",
      tone: "warm",
      estimatedImpact: "medium" as const
    })),
    context: {
      category: category.label,
      personalityType: user.personalityType || "Thoughtful Harmonizer", 
      partnerName: user.partnerName
    }
  };
}

function getFallbackMessagesForCategory(
  category: keyof typeof MESSAGE_CATEGORIES,
  partnerName: string
): string[] {
  const name = partnerName || "love";
  
  switch (category) {
    case "daily_checkins":
      return [
        `Good morning ${name}! Hope you have a wonderful day ahead. 💕`,
        `Hey ${name}, just wanted to check in and see how you're doing today.`,
        `Thinking of you and hoping your day is going well, ${name}! ❤️`
      ];

    case "appreciation":
      return [
        `${name}, I'm so grateful to have you in my life. Thank you for being amazing.`,
        `Just wanted to say how much I appreciate everything you do, ${name}. You're incredible! 💖`,
        `${name}, you make my world brighter just by being in it. Thank you for being you.`
      ];

    case "support":
      return [
        `${name}, I believe in you and know you can handle anything that comes your way. 💪`,
        `You've got this, ${name}! I'm here for you no matter what.`,
        `${name}, you're stronger than you know. I'm proud of you and here to support you always. ❤️`
      ];

    case "romantic":
      return [
        `${name}, you mean the world to me. I love you more every day. 💕`,
        `I can't imagine my life without you, ${name}. You're my everything. ❤️`,
        `${name}, loving you is the best thing that ever happened to me. Forever yours. 💖`
      ];

    case "playful":
      return [
        `Hey ${name}, you're pretty awesome... I guess I'll keep you around! 😄`,
        `${name}, you make me smile even on the toughest days. Thanks for being my sunshine! ☀️`,
        `Just wanted to remind you that you're stuck with me, ${name}! Lucky you! 😉💕`
      ];

    default:
      return [
        `${name}, you're amazing and I'm lucky to have you. ❤️`,
        `Hope you know how special you are to me, ${name}! 💕`,
        `${name}, you make everything better just by being you. 💖`
      ];
  }
}

export function getMessageCategories() {
  return Object.values(MESSAGE_CATEGORIES);
}