import { PersonalityType, getPersonalityProfile } from "./personality-types";

export interface Recommendation {
  type: "message" | "activity" | "reminder";
  category: string;
  content: string;
  priority: "high" | "medium" | "low";
  personalityMatch: string;
}

export function generateRecommendations(personalityType: PersonalityType): Recommendation[] {
  const profile = getPersonalityProfile(personalityType);
  
  const recommendations: Recommendation[] = [];
  
  // Generate message recommendations
  const messageTemplates = {
    "Thoughtful Harmonizer": [
      "Good morning beautiful! I know you have that important meeting today. You've got this - I believe in you completely! ☀️",
      "I was just thinking about how grateful I am to have you in my life. Your thoughtfulness never goes unnoticed. 💙",
      "How was your day, love? I'd love to hear all about it when you have a moment. You're always on my mind. 🌟"
    ],
    "Practical Supporter": [
      "I picked up groceries on my way home and started dinner prep. One less thing for you to worry about today! 🏠",
      "I noticed you mentioned being stressed about your project. How can I help make things easier for you? 💪",
      "I've organized your schedule for tomorrow morning. You've got this, and I'm here to support you! 📅"
    ],
    "Emotional Connector": [
      "I love you more than words can express. Your heart is so beautiful, and I'm grateful every day to be yours. ❤️",
      "I can tell you've been feeling overwhelmed lately. I'm here to listen whenever you need to talk. You're not alone. 🤗",
      "Your strength inspires me every day. I see how hard you work, and I admire you so much. You're amazing! ✨"
    ],
  };
  
  const messages = messageTemplates[personalityType as keyof typeof messageTemplates] || messageTemplates["Thoughtful Harmonizer"];
  
  messages.forEach((message: string, index: number) => {
    recommendations.push({
      type: "message",
      category: index === 0 ? "daily_checkin" : index === 1 ? "appreciation" : "support",
      content: message,
      priority: index === 0 ? "high" : "medium",
      personalityMatch: personalityType,
    });
  });
  
  // Generate activity recommendations
  const activityTemplates = {
    "Thoughtful Harmonizer": [
      "Plan a quiet dinner at that cozy restaurant you both love. Perfect for meaningful conversation and connection.",
      "Take a peaceful walk in the park together. The change of scenery will help you both relax and reconnect.",
    ],
    "Practical Supporter": [
      "Work on that home project together. They'll appreciate the teamwork and practical results.",
      "Plan a productive day trip to tackle your shared to-do list. Make it fun with good music and treats.",
    ],
    "Emotional Connector": [
      "Write them a heartfelt letter expressing your feelings. They'll treasure this emotional gesture.",
      "Plan a romantic evening at home with candles, their favorite music, and deep conversation.",
    ],
  };
  
  const activities = activityTemplates[personalityType as keyof typeof activityTemplates] || activityTemplates["Thoughtful Harmonizer"];
  
  activities.forEach((activity: string, index: number) => {
    recommendations.push({
      type: "activity",
      category: "date_idea",
      content: activity,
      priority: index === 0 ? "high" : "medium",
      personalityMatch: personalityType,
    });
  });
  
  // Generate reminder recommendations
  recommendations.push({
    type: "reminder",
    category: "quality_time",
    content: `Remember to give ${profile.loveLanguage.toLowerCase()} today. ${profile.description}`,
    priority: "high",
    personalityMatch: personalityType,
  });
  
  return recommendations;
}
