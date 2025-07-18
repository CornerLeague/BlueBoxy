export interface PreferenceQuestion {
  id: string;
  category: string;
  question: string;
  type: 'multiple-choice' | 'multi-select' | 'scale' | 'boolean';
  options?: string[];
  min?: number;
  max?: number;
}

export interface PreferenceResponse {
  questionId: string;
  value: string | number | boolean | string[];
}

export const preferenceQuestions: PreferenceQuestion[] = [
  // Dining Preferences
  {
    id: 'dining-cuisine',
    category: 'dining',
    question: 'What types of cuisine do you both enjoy? (Select all that apply)',
    type: 'multi-select',
    options: ['Italian', 'Asian', 'Mexican', 'American', 'Mediterranean', 'Indian', 'Thai', 'French', 'Fusion', 'Any cuisine']
  },
  {
    id: 'dining-atmosphere',
    category: 'dining',
    question: 'What dining atmospheres do you prefer? (Select all that apply)',
    type: 'multi-select',
    options: ['Fine dining', 'Casual restaurant', 'Cozy café', 'Outdoor patio', 'Rooftop dining', 'Food trucks', 'Home-style cooking', 'Trendy spots']
  },
  {
    id: 'dining-budget',
    category: 'dining',
    question: 'What\'s your preferred dining budget per person?',
    type: 'multiple-choice',
    options: ['Under $20', '$20-40', '$40-60', '$60-80', '$80-100', 'Over $100', 'Budget doesn\'t matter']
  },

  // Outdoor Preferences
  {
    id: 'outdoor-activity-level',
    category: 'outdoor',
    question: 'How active do you prefer your outdoor dates?',
    type: 'scale',
    min: 1,
    max: 5
  },
  {
    id: 'outdoor-type',
    category: 'outdoor',
    question: 'What types of outdoor activities do you enjoy? (Select all that apply)',
    type: 'multi-select',
    options: ['Hiking', 'Beach activities', 'Parks & gardens', 'Cycling', 'Water sports', 'Picnics', 'Outdoor festivals', 'Nature walks', 'Adventure sports']
  },
  {
    id: 'outdoor-weather',
    category: 'outdoor',
    question: 'Do you prefer outdoor dates regardless of weather?',
    type: 'boolean'
  },

  // Entertainment Preferences
  {
    id: 'entertainment-type',
    category: 'entertainment',
    question: 'What types of entertainment do you both enjoy? (Select all that apply)',
    type: 'multi-select',
    options: ['Movies', 'Live music', 'Theater', 'Comedy shows', 'Museums', 'Art galleries', 'Concerts', 'Dance performances', 'Sports events']
  },
  {
    id: 'entertainment-crowd',
    category: 'entertainment',
    question: 'Do you prefer intimate or lively entertainment venues? (Select all that apply)',
    type: 'multi-select',
    options: ['Intimate & quiet', 'Small groups', 'Moderate crowds', 'Large events', 'Doesn\'t matter', 'None of these', 'Others']
  },

  // Active Preferences
  {
    id: 'active-intensity',
    category: 'active',
    question: 'How intense do you like your physical activities?',
    type: 'scale',
    min: 1,
    max: 5
  },
  {
    id: 'active-type',
    category: 'active',
    question: 'What active dates interest you most? (Select all that apply)',
    type: 'multi-select',
    options: ['Gym/fitness', 'Dance classes', 'Sports', 'Rock climbing', 'Swimming', 'Yoga', 'Martial arts', 'Team activities', 'Individual challenges']
  },

  // Creative Preferences
  {
    id: 'creative-type',
    category: 'creative',
    question: 'What creative activities would you enjoy together? (Select all that apply)',
    type: 'multi-select',
    options: ['Art classes', 'Cooking workshops', 'Pottery', 'Photography', 'Music lessons', 'Writing', 'Crafts', 'DIY projects', 'Design activities']
  },
  {
    id: 'creative-skill',
    category: 'creative',
    question: 'Do you prefer beginner-friendly or advanced creative activities?',
    type: 'multiple-choice',
    options: ['Complete beginner', 'Some experience', 'Intermediate', 'Advanced', 'Mixed skill levels']
  },

  // Cultural Preferences
  {
    id: 'cultural-type',
    category: 'cultural',
    question: 'What cultural experiences interest you?',
    type: 'multiple-choice',
    options: ['Museums', 'Historical sites', 'Cultural festivals', 'Art exhibitions', 'Architecture tours', 'Local traditions', 'Language exchanges', 'Religious sites']
  },
  {
    id: 'cultural-learning',
    category: 'cultural',
    question: 'How much do you enjoy learning about new cultures?',
    type: 'scale',
    min: 1,
    max: 5
  },

  // General Preferences
  {
    id: 'general-time',
    category: 'general',
    question: 'When do you prefer to have dates?',
    type: 'multiple-choice',
    options: ['Morning', 'Afternoon', 'Evening', 'Late night', 'Weekend mornings', 'Weekend afternoons', 'Any time']
  },
  {
    id: 'general-duration',
    category: 'general',
    question: 'How long do you prefer your dates to last?',
    type: 'multiple-choice',
    options: ['1-2 hours', '2-4 hours', '4-6 hours', 'Half day', 'Full day', 'Weekend getaway', 'Flexible']
  },
  {
    id: 'general-novelty',
    category: 'general',
    question: 'How important is trying new experiences together?',
    type: 'scale',
    min: 1,
    max: 5
  }
];

export function getQuestionsByCategory(category: string): PreferenceQuestion[] {
  return preferenceQuestions.filter(q => q.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(preferenceQuestions.map(q => q.category))];
}

export function getScaleLabel(value: number, questionId: string): string {
  const scaleLabels: Record<string, string[]> = {
    'outdoor-activity-level': ['Very relaxed', 'Somewhat relaxed', 'Moderate', 'Fairly active', 'Very active'],
    'active-intensity': ['Very light', 'Light', 'Moderate', 'Intense', 'Very intense'],
    'cultural-learning': ['Not interested', 'Slightly interested', 'Moderately interested', 'Very interested', 'Extremely interested'],
    'general-novelty': ['Not important', 'Slightly important', 'Moderately important', 'Very important', 'Extremely important']
  };
  
  return scaleLabels[questionId]?.[value - 1] || `${value}/5`;
}