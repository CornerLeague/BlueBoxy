import OpenAI from "openai";
import type { User } from "@shared/schema";

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
    // Initialize OpenAI client with current environment variable
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const category = MESSAGE_CATEGORIES[request.category];
    const personalityType = user.personalityType || "Thoughtful Harmonizer";
    const personalityTrait = PERSONALITY_TYPES[personalityType as keyof typeof PERSONALITY_TYPES];
    const partnerName = user.partnerName || "your partner";
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
          content: `You are an expert relationship counselor and communication specialist with deep knowledge of psychological assessment frameworks including:

1. Five Love Languages (Dr. Gary Chapman):
   - Words of Affirmation: Verbal expressions of love, appreciation, and encouragement
   - Quality Time: Undivided attention and meaningful shared experiences
   - Physical Touch: Appropriate physical contact that communicates love and security
   - Acts of Service: Helpful actions that demonstrate care and support
   - Receiving Gifts: Thoughtful gifts as symbols of love and consideration

2. Personality Psychology Principles:
   - Nurturing Connectors respond to warm, emotionally expressive communication
   - Devoted Caregivers appreciate acknowledgment of their service-oriented nature
   - Thoughtful Analysts value intellectual depth and meaningful conversations
   - Practical Partners prefer straightforward, solution-focused communication
   - Independent Achievers appreciate encouraging, goal-oriented messages
   - Adventure Companions love energetic, spontaneous, fun communication
   - Selective Intimates value private, deep, emotionally selective expressions
   - Loyal Supporters respond to steady, supportive encouragement

3. Attachment Theory Insights:
   - Messages should create secure emotional connections
   - Balance between independence and togetherness
   - Consistent emotional availability and responsiveness
   - Validation of feelings and experiences

Generate messages that integrate these frameworks naturally, making the partner feel understood, valued, and emotionally connected. Messages should sound authentic and personal, not clinical or theoretical. Respond with JSON only.`
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
    return {
      success: false,
      messages: [],
      context: {
        category: MESSAGE_CATEGORIES[request.category].label,
        personalityType: user.personalityType || "Thoughtful Harmonizer",
        partnerName: user.partnerName || "your partner"
      },
      error: "Sorry, I was unable to give you a message at this time."
    };
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

Psychological Framework Guidelines for ${categoryInfo.label}:
${getCategoryGuidelines(category)}

Core Requirements:
- Generate exactly 3 unique messages that integrate psychological principles naturally
- Apply Five Love Languages framework: Consider how different love languages (Words of Affirmation, Quality Time, Physical Touch, Acts of Service, Receiving Gifts) would resonate with this personality type
- Match the ${personalityType} personality type's communication style, values, and preferences
- Create secure attachment through consistent emotional availability and validation
- Make messages feel authentic, warm, and personal - never clinical or overly theoretical
- Vary the tone, approach, and love language emphasis across the 3 messages
- Keep messages concise (1-3 sentences) but emotionally meaningful
- Use the partner's name naturally when it enhances connection
- Ensure each message would make the partner feel truly understood and valued

Message Crafting Strategy:
1. First message: Lead with their primary personality strength/value
2. Second message: Integrate a different love language or emotional need
3. Third message: Combine elements for deeper connection

Response Format (JSON):
{
  "messages": [
    {
      "content": "The actual message text here - authentic and emotionally resonant",
      "tone": "warm|playful|supportive|romantic|encouraging|intimate|energetic",
      "impact": "high|medium|low"
    }
  ]
}`;

  return basePrompt;
}

function getCategoryGuidelines(category: keyof typeof MESSAGE_CATEGORIES): string {
  switch (category) {
    case "daily_checkins":
      return `Psychological Framework Integration:
- Apply Quality Time principles: Show undivided attention and genuine interest in their day
- Use Words of Affirmation: Express care through verbal acknowledgment and encouragement
- Create secure attachment: Demonstrate consistent emotional availability and responsiveness
- Match personality style: Adapt communication depth and warmth to their type
- Nurturing Connectors/Devoted Caregivers: Warm, emotionally expressive check-ins
- Thoughtful Analysts: Meaningful questions that invite deeper conversation
- Practical Partners: Straightforward, genuine interest in their activities
- Independent Achievers/Adventure Companions: Encouraging, energetic tone
- Selective Intimates/Loyal Supporters: Respectful, steady presence`;

    case "appreciation":
      return `Psychological Framework Integration:
- Words of Affirmation focus: Be specific about qualities, efforts, and positive impact
- Acts of Service recognition: Acknowledge helpful actions and care they provide
- Receiving Gifts mindset: Frame appreciation as a verbal gift of recognition
- Build secure attachment: Validate their contributions and emotional value
- Match personality expression:
  * Nurturing Connectors: Appreciate their emotional warmth and care
  * Devoted Caregivers: Acknowledge their service-oriented actions specifically
  * Thoughtful Analysts: Recognize their intellectual contributions and insights
  * Practical Partners: Value their reliability and problem-solving
  * Independent Achievers: Celebrate their accomplishments and drive
  * Adventure Companions: Appreciate their energy and spontaneity
  * Selective Intimates: Honor their emotional depth and selectivity
  * Loyal Supporters: Recognize their steadfast support and encouragement`;

    case "support": 
      return `Psychological Framework Integration:
- Words of Affirmation: Offer genuine encouragement and belief in their capabilities
- Acts of Service reference: Offer to help practically when appropriate
- Secure attachment principles: Be emotionally available, responsive, and validating
- Balance independence and togetherness: Support without smothering
- Personality-specific support:
  * Nurturing Connectors: Warm emotional reassurance and affirmation
  * Devoted Caregivers: Acknowledge their tendency to care for others, remind them they deserve support too
  * Thoughtful Analysts: Logical validation along with emotional support
  * Practical Partners: Solution-focused encouragement with practical offers
  * Independent Achievers: Respect their autonomy while offering partnership
  * Adventure Companions: Energizing, optimistic encouragement
  * Selective Intimates: Private, deep emotional validation
  * Loyal Supporters: Mirror their steady support back to them`;

    case "romantic":
      return `Psychological Framework Integration:
- Physical Touch language: Reference physical connection appropriately (hugs, closeness, holding hands)
- Words of Affirmation: Express deep feelings authentically and specifically
- Quality Time: Reference shared moments and desire for meaningful togetherness
- Secure attachment: Create emotional safety, intimacy, and commitment signals
- Personality-appropriate romance:
  * Nurturing Connectors: Warm, emotionally expressive declarations of love
  * Devoted Caregivers: Appreciate their caring nature as part of why you love them
  * Thoughtful Analysts: Deep, meaningful expressions of what makes them special
  * Practical Partners: Sincere, straightforward expressions of love and commitment
  * Independent Achievers: Admiration-based romance that respects their strength
  * Adventure Companions: Exciting, spontaneous romantic expressions
  * Selective Intimates: Private, intimate expressions that honor their emotional selectivity
  * Loyal Supporters: Steady, committed declarations of lasting love`;

    case "playful":
      return `Psychological Framework Integration:
- Quality Time emphasis: Create moments of joy and shared laughter
- Reduce stress and strengthen bond through lightheartedness
- Secure attachment: Playfulness creates safety and emotional closeness
- Personality-matched playfulness:
  * Nurturing Connectors: Sweet, affectionate teasing with warmth
  * Devoted Caregivers: Playfully acknowledge their caring nature
  * Thoughtful Analysts: Clever, witty humor that engages their mind
  * Practical Partners: Light humor balanced with sincerity
  * Independent Achievers: Confident, fun banter
  * Adventure Companions: High-energy, spontaneous, adventurous fun
  * Selective Intimates: Private jokes and gentle, intimate humor
  * Loyal Supporters: Encouraging, cheerful messages that bring smiles`;

    default:
      return "Create meaningful, personalized messages that strengthen your relationship using psychological principles.";
  }
}

export function getMessageCategories() {
  return Object.values(MESSAGE_CATEGORIES);
}