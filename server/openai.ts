import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    console.error("Error generating personality insight:", error);
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
    console.error("Error generating personalized messages:", error);
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
    console.error("Error generating activity recommendations:", error);
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
  count: number = 10
): Promise<any[]> {
  const prompt = `Generate ${count} location-based date recommendations for ${context.userName} and ${context.partnerName} near latitude ${userLocation.latitude}, longitude ${userLocation.longitude} within a ${radius}km radius.

Context:
- Partner's personality type: ${context.personalityType}
- Relationship duration: ${context.relationshipDuration}
- Assessment responses: ${JSON.stringify(context.assessmentResponses)}
- User preferences: ${JSON.stringify(preferences)}

Based on their location and preferences, suggest specific real types of venues and activities they could find in their area. Include variety across all categories: dining, outdoor, entertainment, active, creative, and cultural.

Please respond with JSON in this format:
{
  "activities": [
    {
      "id": number,
      "title": "Activity/Venue Name",
      "description": "Detailed description why this is perfect for them",
      "category": "dining|outdoor|entertainment|active|creative|cultural",
      "venueType": "Specific type of venue to look for",
      "location": "General area description",
      "duration": "Expected duration",
      "budget": "low|medium|high",
      "personalityMatch": "How this matches their personality and preferences",
      "specialNotes": "What to look for or how to enhance the experience",
      "timeOfDay": "best|morning|afternoon|evening|night",
      "seasonality": "year-round|spring|summer|fall|winter",
      "distance": "estimated distance category: very close|close|moderate|far"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are a local relationship expert who creates location-based date recommendations. Always respond with valid JSON and suggest real types of venues that exist in most areas." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.activities || [];
  } catch (error) {
    console.error("Error generating location-based recommendations:", error);
    return [];
  }
}