export type PersonalityType = 
  | "Thoughtful Harmonizer"
  | "Practical Supporter"
  | "Emotional Connector"
  | "Independent Thinker"
  | "Social Butterfly"
  | "Quiet Confidant"
  | "Adventure Seeker"
  | "Nurturing Caregiver";

export interface PersonalityProfile {
  type: PersonalityType;
  description: string;
  loveLanguage: string;
  communicationStyle: string;
  stressResponse: string;
  idealActivities: string[];
  messagePreferences: string[];
}

export const personalityProfiles: Record<PersonalityType, PersonalityProfile> = {
  "Thoughtful Harmonizer": {
    type: "Thoughtful Harmonizer",
    description: "Values meaningful connections and appreciates thoughtful gestures. Responds well to quality time and words of affirmation.",
    loveLanguage: "Quality Time",
    communicationStyle: "Evening check-ins",
    stressResponse: "Needs processing time",
    idealActivities: ["Cozy cafés", "Nature walks", "Art galleries", "Home cooking"],
    messagePreferences: ["Supportive", "Thoughtful", "Encouraging", "Gentle"],
  },
  "Practical Supporter": {
    type: "Practical Supporter",
    description: "Appreciates helpful actions and practical demonstrations of love. Values reliability and consistency.",
    loveLanguage: "Acts of Service",
    communicationStyle: "Direct and honest",
    stressResponse: "Likes solutions",
    idealActivities: ["Home projects", "Planning activities", "Practical workshops", "Organizing together"],
    messagePreferences: ["Practical", "Supportive", "Solution-focused", "Reliable"],
  },
  "Emotional Connector": {
    type: "Emotional Connector",
    description: "Thrives on emotional intimacy and deep conversations. Values empathy and understanding.",
    loveLanguage: "Words of Affirmation",
    communicationStyle: "Frequent emotional check-ins",
    stressResponse: "Needs emotional support",
    idealActivities: ["Deep conversations", "Romantic dinners", "Emotional movies", "Journaling together"],
    messagePreferences: ["Emotional", "Validating", "Empathetic", "Loving"],
  },
  "Independent Thinker": {
    type: "Independent Thinker",
    description: "Values personal space and intellectual stimulation. Appreciates thoughtful gifts and meaningful conversations.",
    loveLanguage: "Receiving Gifts",
    communicationStyle: "Thoughtful, less frequent",
    stressResponse: "Needs alone time",
    idealActivities: ["Museums", "Bookstores", "Lectures", "Solo activities together"],
    messagePreferences: ["Intellectual", "Respectful", "Thoughtful", "Space-giving"],
  },
  "Social Butterfly": {
    type: "Social Butterfly",
    description: "Enjoys social activities and group settings. Values fun experiences and shared adventures.",
    loveLanguage: "Quality Time",
    communicationStyle: "Frequent, enthusiastic",
    stressResponse: "Seeks social support",
    idealActivities: ["Group activities", "Parties", "Social events", "Adventure sports"],
    messagePreferences: ["Energetic", "Fun", "Social", "Enthusiastic"],
  },
  "Quiet Confidant": {
    type: "Quiet Confidant",
    description: "Prefers intimate, quiet settings and deep one-on-one connections. Values loyalty and trust.",
    loveLanguage: "Physical Touch",
    communicationStyle: "Quiet, meaningful",
    stressResponse: "Seeks comfort",
    idealActivities: ["Quiet dinners", "Home activities", "Reading together", "Gentle walks"],
    messagePreferences: ["Gentle", "Reassuring", "Intimate", "Loyal"],
  },
  "Adventure Seeker": {
    type: "Adventure Seeker",
    description: "Loves new experiences and physical activities. Values shared adventures and spontaneity.",
    loveLanguage: "Quality Time",
    communicationStyle: "Exciting, spontaneous",
    stressResponse: "Needs physical activity",
    idealActivities: ["Outdoor adventures", "Sports", "Travel", "New experiences"],
    messagePreferences: ["Exciting", "Adventurous", "Spontaneous", "Active"],
  },
  "Nurturing Caregiver": {
    type: "Nurturing Caregiver",
    description: "Focuses on caring for others and creating harmony. Values appreciation and gentle affection.",
    loveLanguage: "Acts of Service",
    communicationStyle: "Caring, attentive",
    stressResponse: "Needs appreciation",
    idealActivities: ["Caring activities", "Helping others", "Creating beauty", "Peaceful settings"],
    messagePreferences: ["Appreciative", "Gentle", "Caring", "Grateful"],
  },
};

export function determinePersonalityType(responses: Record<number, string>): PersonalityType {
  // Simple algorithm to determine personality type based on responses
  // In a real application, this would be more sophisticated
  
  const responseValues = Object.values(responses);
  
  // Count different response patterns
  const patterns = {
    thoughtful: responseValues.filter(r => 
      r.includes("talk_through") || r.includes("quality_time") || r.includes("thoughtful_gestures")
    ).length,
    practical: responseValues.filter(r => 
      r.includes("acts_service") || r.includes("thinks_logically") || r.includes("solving_problems")
    ).length,
    emotional: responseValues.filter(r => 
      r.includes("words_affirmation") || r.includes("emotional_support") || r.includes("physical_comfort")
    ).length,
    independent: responseValues.filter(r => 
      r.includes("alone_time") || r.includes("takes_time") || r.includes("observing")
    ).length,
    social: responseValues.filter(r => 
      r.includes("large_gatherings") || r.includes("asks_for_input") || r.includes("distraction")
    ).length,
  };
  
  // Determine dominant pattern
  const maxPattern = Object.keys(patterns).reduce((a, b) => 
    patterns[a as keyof typeof patterns] > patterns[b as keyof typeof patterns] ? a : b
  );
  
  switch (maxPattern) {
    case "thoughtful":
      return "Thoughtful Harmonizer";
    case "practical":
      return "Practical Supporter";
    case "emotional":
      return "Emotional Connector";
    case "independent":
      return "Independent Thinker";
    case "social":
      return "Social Butterfly";
    default:
      return "Thoughtful Harmonizer";
  }
}

export function getPersonalityProfile(type: PersonalityType): PersonalityProfile {
  return personalityProfiles[type];
}
