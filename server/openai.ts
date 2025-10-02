import OpenAI, { type ClientOptions } from "openai";

export function getOpenAIClientOptions(): ClientOptions {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  const options: ClientOptions = {
    apiKey,
  };

  if (process.env.OPENAI_ORGANIZATION) {
    options.organization = process.env.OPENAI_ORGANIZATION;
  }

  if (process.env.OPENAI_PROJECT_ID) {
    options.project = process.env.OPENAI_PROJECT_ID;
  }

  return options;
}

function isOpenAIUnauthorizedError(error: unknown): error is { status: number } {
  return (
    !!error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as any).status === "number" &&
    (error as any).status === 401
  );
}

export function logOpenAIError(context: string, error: unknown) {
  if (isOpenAIUnauthorizedError(error)) {
    console.error(
      `OpenAI returned 401 Unauthorized while ${context}. ` +
        "Verify that OPENAI_API_KEY is correct and, if you're using a project-scoped key (sk-proj-...), set OPENAI_PROJECT_ID to the associated project.",
      error
    );
  } else {
    console.error(`Error ${context}:`, error);
  }
}

export function getOpenAIUserFacingError(error: unknown, fallbackMessage: string): string {
  if (isOpenAIUnauthorizedError(error)) {
    return "OpenAI rejected the API credentials. Verify OPENAI_API_KEY and, for project-scoped keys, OPENAI_PROJECT_ID.";
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    return (error as any).message;
  }

  return fallbackMessage;
}

const openai = new OpenAI(getOpenAIClientOptions());

export interface PersonalityInsight {
  description: string;
  loveLanguage: string;
  communicationStyle: string;
  idealActivities: string[];
  stressResponse: string;
}

export interface RecommendationContext {
  userName: string;
  partnerName: string;
  personalityType: string;
  relationshipDuration: string;
  assessmentResponses: Record<string, string>;
}

export async function generatePersonalityInsight(
  personalityType: string,
  partnerName: string,
  assessmentResponses: Record<string, string>
): Promise<PersonalityInsight> {
  const prompt = `Based on the personality type "${personalityType}" and these assessment responses: ${JSON.stringify(assessmentResponses)}, provide insights about ${partnerName}'s personality.

Please respond with JSON in this exact format:
{
  "description": "A personalized 2-sentence description of how ${partnerName} likely behaves and what they value",
  "loveLanguage": "Their primary love language based on the assessment",
  "communicationStyle": "How they prefer to communicate in relationships",
  "idealActivities": ["activity1", "activity2", "activity3"],
  "stressResponse": "How they typically handle stress in relationships"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a relationship psychology expert. Provide personalized insights based on personality assessments. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as PersonalityInsight;
  } catch (error) {
    logOpenAIError("generating personality insight", error);
    // Fallback insight
    return {
      description: `${partnerName} has a ${personalityType} personality and values meaningful connections.`,
      loveLanguage: "Quality Time",
      communicationStyle: "Direct and thoughtful",
      idealActivities: ["Deep conversations", "Shared hobbies", "Quiet time together"],
      stressResponse: "Prefers to talk through problems calmly"
    };
  }
}

export async function generatePersonalizedMessages(
  context: RecommendationContext,
  count: number = 5
): Promise<string[]> {
  const prompt = `Generate ${count} personalized message suggestions for ${context.userName} to send to their partner ${context.partnerName}.

Context:
- Partner's personality type: ${context.personalityType}
- Relationship duration: ${context.relationshipDuration}
- Assessment responses: ${JSON.stringify(context.assessmentResponses)}

Create messages that are:
1. Personalized to ${context.partnerName}'s personality
2. Appropriate for their relationship stage
3. Warm, genuine, and thoughtful
4. Varied in tone (some romantic, some appreciative, some playful)

Please respond with JSON in this format:
{
  "messages": ["message1", "message2", "message3", "message4", "message5"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a relationship expert who creates personalized message suggestions. Messages should be authentic, warm, and tailored to the recipient's personality."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.messages || [];
  } catch (error) {
    logOpenAIError("generating personalized messages", error);
    return [
      `Hey ${context.partnerName}, thinking of you and how much you mean to me! 💕`,
      `Just wanted to remind you how amazing you are, ${context.partnerName}. Hope you're having a great day!`,
      `You always know how to make me smile, ${context.partnerName}. Thank you for being you! ❤️`
    ];
  }
}

export async function generateActivityRecommendations(
  context: RecommendationContext,
  count: number = 5
): Promise<Array<{ title: string; description: string; category: string }>> {
  const prompt = `Generate ${count} personalized activity recommendations for ${context.userName} and ${context.partnerName}.

Context:
- Partner's personality type: ${context.personalityType}
- Relationship duration: ${context.relationshipDuration}
- Assessment responses: ${JSON.stringify(context.assessmentResponses)}

Create activities that:
1. Match ${context.partnerName}'s personality preferences
2. Are appropriate for their relationship stage
3. Encourage connection and bonding
4. Are varied (indoor/outdoor, active/relaxed, creative/social)

Please respond with JSON in this format:
{
  "activities": [
    {
      "title": "Activity name",
      "description": "Brief description of the activity and why it's good for them",
      "category": "romantic|fun|adventure|creative|relaxed"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a relationship expert who suggests personalized activities for couples based on personality types and relationship dynamics."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.activities || [];
  } catch (error) {
    logOpenAIError("generating activity recommendations", error);
    return [
      {
        title: "Cozy Movie Night",
        description: "Perfect for spending quality time together in a comfortable setting",
        category: "relaxed"
      },
      {
        title: "Local Adventure",
        description: "Explore a new part of your city or nearby area together",
        category: "adventure"
      }
    ];
  }
}

export async function generateLocationBasedRecommendations(
  context: RecommendationContext,
  userLocation: { latitude: number; longitude: number },
  preferences: any,
  radius: number = 25,
  count: number = 8
): Promise<any[]> {
  const prompt = `Generate ${count} location-based date recommendations for ${context.userName} and ${context.partnerName} near ${userLocation.latitude}, ${userLocation.longitude} within a ${radius}km radius.

Context:
- Personality type: ${context.personalityType}
- Relationship duration: ${context.relationshipDuration}
- User preferences: ${JSON.stringify(preferences)}

Create diverse recommendations across categories: dining, outdoor, entertainment, active, creative, cultural.

Respond with JSON format:
{
  "activities": [
    {
      "id": 1,
      "title": "Activity Name",
      "description": "Why this is perfect for them",
      "category": "dining|outdoor|entertainment|active|creative|cultural",
      "duration": "1-2 hours",
      "budget": "low|medium|high",
      "personalityMatch": "How this matches their personality"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are a local relationship expert. Create location-based date recommendations. Always respond with valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.activities || [];
  } catch (error) {
    logOpenAIError("generating location-based recommendations", error);
    // Return fallback recommendations if OpenAI fails
    return [
      {
        id: 1,
        title: "Cozy Coffee Shop Date",
        description: "Perfect for intimate conversations and getting to know each other better",
        category: "dining",
        duration: "1-2 hours",
        budget: "low",
        personalityMatch: "Great for thoughtful personalities who enjoy meaningful conversations"
      },
      {
        id: 2,
        title: "Local Art Gallery Visit",
        description: "Explore creativity together and discover new perspectives",
        category: "cultural",
        duration: "2-3 hours",
        budget: "medium",
        personalityMatch: "Ideal for couples who appreciate art and culture"
      },
      {
        id: 3,
        title: "Nature Walk in Local Park",
        description: "Connect with nature and each other in a peaceful setting",
        category: "outdoor",
        duration: "1-2 hours",
        budget: "low",
        personalityMatch: "Perfect for those who find peace in nature and outdoor activities"
      }
    ];
  }
}

export async function generateAIPoweredRecommendations({
  user,
  assessment,
  category,
  location,
  preferences,
  radius
}: {
  user: any;
  assessment: any;
  category: string;
  location: any;
  preferences: any;
  radius: number;
}) {
  const prompt = `Create personalized date recommendations for ${user.name} and ${user.partnerName}.

User Context:
- Personality Type: ${user.personalityType || "Thoughtful Harmonizer"}
- Relationship Duration: ${user.relationshipDuration}
- Location: ${location ? `${location.latitude}, ${location.longitude}` : "Location not provided"}
- Preferred Category: ${category}
- Search Radius: ${radius} miles

User Preferences:
${preferences ? JSON.stringify(preferences, null, 2) : "No specific preferences provided"}

Assessment Responses:
${assessment?.responses ? JSON.stringify(assessment.responses, null, 2) : "No assessment data"}

Please provide 4-6 specific, actionable date recommendations that are:
1. Within ${radius} miles of their location (if provided)
2. Tailored to their personality type and preferences
3. Focused on the "${category}" category
4. Include real places and activities when possible
5. Consider their relationship duration and stage

Respond with JSON in this exact format:
{
  "activities": [
    {
      "id": 1,
      "name": "Activity Name",
      "description": "Detailed description of the activity and why it's perfect for them",
      "category": "${category}",
      "rating": 4.5,
      "personalityMatch": "Why this matches their personality",
      "distance": "2.3 miles away",
      "imageUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      "location": "Specific address or area"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert relationship coach and local activity curator. Generate specific, personalized date recommendations based on user data, location, and preferences. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    logOpenAIError("generating AI-powered recommendations", error);
    throw error;
  }
}
