import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { determinePersonalityType } from "@/lib/personality-types";

const assessmentQuestions = [
  {
    id: 1,
    question: "When your partner is feeling stressed or overwhelmed, what do they typically prefer?",
    options: [
      { value: "alone_time", label: "Time alone to process and decompress" },
      { value: "talk_through", label: "Talking through the situation with you" },
      { value: "physical_comfort", label: "Physical comfort and affection" },
      { value: "distraction", label: "Distraction through fun activities" },
    ],
  },
  {
    id: 2,
    question: "How does your partner prefer to receive love and affection?",
    options: [
      { value: "words_affirmation", label: "Words of affirmation and compliments" },
      { value: "quality_time", label: "Quality time and undivided attention" },
      { value: "physical_touch", label: "Physical touch and closeness" },
      { value: "acts_service", label: "Acts of service and helpful gestures" },
    ],
  },
  {
    id: 3,
    question: "When making decisions, your partner usually:",
    options: [
      { value: "thinks_logically", label: "Thinks through options logically" },
      { value: "goes_with_gut", label: "Goes with their gut feeling" },
      { value: "asks_for_input", label: "Asks for your input and advice" },
      { value: "takes_time", label: "Takes time to consider all angles" },
    ],
  },
  {
    id: 4,
    question: "In social situations, your partner is most comfortable:",
    options: [
      { value: "small_groups", label: "In small, intimate groups" },
      { value: "large_gatherings", label: "In large, energetic gatherings" },
      { value: "one_on_one", label: "In one-on-one conversations" },
      { value: "observing", label: "Observing rather than participating" },
    ],
  },
  {
    id: 5,
    question: "Your partner shows they care by:",
    options: [
      { value: "thoughtful_gestures", label: "Thoughtful gestures and surprises" },
      { value: "being_present", label: "Being present and attentive" },
      { value: "solving_problems", label: "Helping solve problems" },
      { value: "emotional_support", label: "Providing emotional support" },
    ],
  },
  // Add more questions as needed
];

export default function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [, setLocation] = useLocation();
  const { goBack } = useNavigationHistory();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userId = localStorage.getItem("userId");
  const userData = JSON.parse(localStorage.getItem("userData") || "null");

  // Detect retake mode via query param
  const searchParams = new URLSearchParams(window.location.search);
  const isRetake = searchParams.get("retake") === "1";
  
  // Redirect to dashboard if user already has completed assessment, unless retaking
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  useEffect(() => {
    if (!isRetake && isAuthenticated && userData && userData.personalityType) {
      setLocation("/dashboard");
    }
  }, [isRetake, isAuthenticated, userData, setLocation]);

  const saveAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      if (userId && userData) {
        // Save to server for authenticated users
        const userIdNumber = parseInt(userId);
        
        // Validate userId before sending
        if (isNaN(userIdNumber)) {
          console.error("Invalid userId:", userId);
          throw new Error("Invalid user ID");
        }
        
        const response = await fetch('/api/assessment/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userIdNumber,
            responses: assessmentData.responses,
            personalityType: assessmentData.personalityType
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save assessment');
        }

        // Update localStorage with new data
        const updatedUserData = {
          ...userData,
          personalityType: assessmentData.personalityType,
          assessmentCompleted: true,
          assessmentResponses: assessmentData.responses
        };
        localStorage.setItem("userData", JSON.stringify(updatedUserData));

        return response.json();
      } else {
        // Guest user - save to localStorage only
        const onboardingData = JSON.parse(localStorage.getItem("onboardingData") || "{}");
        const guestResults = {
          personalityType: assessmentData.personalityType,
          responses: assessmentData.responses,
          onboardingData: onboardingData,
          completedAt: new Date().toISOString()
        };
        localStorage.setItem("guestAssessmentResults", JSON.stringify(guestResults));
        return guestResults;
      }
    },
    onSuccess: (data, variables) => {
      // Update cached profile so UI reflects the new personality type immediately
      const uid = localStorage.getItem("userId");
      if (uid) {
        queryClient.setQueryData<any>(["/api/user/profile", uid], (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            personalityType: variables?.personalityType || prev.personalityType,
          };
        });
        // Request a fresh profile from the server as well
        queryClient.invalidateQueries({ queryKey: ["/api/user/profile", uid] });
        queryClient.invalidateQueries({ queryKey: ["/api/assessments/user/" + uid] });
      }

      toast({
        title: "Assessment Complete!",
        description: "Your personality analysis is ready! View your personalized recommendations.",
      });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnswer = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [assessmentQuestions[currentQuestion].id]: value
    }));
  };

  const calculatePersonalityType = (responses: Record<number, string>): string => {
    // Simple personality type calculation based on responses
    const values = Object.values(responses);
    
    // Count traits based on responses
    const traits = {
      thoughtful: 0,
      emotional: 0,
      practical: 0,
      social: 0,
      independent: 0,
      nurturing: 0,
      adventurous: 0,
      quiet: 0
    };
    
    values.forEach(value => {
      switch(value) {
        case 'talk_through':
        case 'thoughtful_gestures':
        case 'small_groups':
          traits.thoughtful++;
          break;
        case 'physical_touch':
        case 'emotional_support':
        case 'being_present':
          traits.emotional++;
          break;
        case 'asks_for_input':
        case 'solving_problems':
          traits.practical++;
          break;
        case 'large_gatherings':
          traits.social++;
          break;
        case 'observing':
          traits.quiet++;
          break;
        default:
          traits.thoughtful++;
      }
    });
    
    // Determine dominant trait
    type TraitKey = keyof typeof traits;
    const keys = Object.keys(traits) as TraitKey[];
    const maxTrait = keys.reduce((a: TraitKey, b: TraitKey) => (traits[a] > traits[b] ? a : b), keys[0]);
    
    // Map traits to personality types
    const personalityMap: Record<TraitKey, string> = {
      thoughtful: "Thoughtful Harmonizer",
      emotional: "Emotional Connector", 
      practical: "Practical Supporter",
      social: "Social Butterfly",
      independent: "Independent Thinker",
      nurturing: "Nurturing Caregiver",
      adventurous: "Adventure Seeker",
      quiet: "Quiet Confidant"
    };
    
    return personalityMap[maxTrait] || "Thoughtful Harmonizer";
  };

  const handleNext = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Complete assessment
      const personalityType = calculatePersonalityType(responses);
      saveAssessmentMutation.mutate({
        responses,
        personalityType,
        assessmentType: "user"
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;
  const question = assessmentQuestions[currentQuestion];
  const currentAnswer = responses[question.id];

  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => goBack()}
            className="mr-4 p-2 rounded-full bg-secondary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 className="text-xl font-semibold">Partner Assessment</h2>
        </div>
        
        <Card className="p-4 mb-6">
          <CardContent className="p-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-semibold">{currentQuestion + 1}/{assessmentQuestions.length}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
        
        <RadioGroup value={currentAnswer} onValueChange={handleAnswer}>
          <div className="space-y-3">
            {question.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Card className="flex-1 cursor-pointer hover:bg-[var(--hover-subtle)] hover:text-[var(--hover-text)] transition-colors">
                  <Label htmlFor={option.value} className="cursor-pointer">
                    <CardContent className="flex items-center p-4">
                      <RadioGroupItem value={option.value} id={option.value} className="mr-4" />
                      <span>{option.label}</span>
                    </CardContent>
                  </Label>
                </Card>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
      
      <div className="flex space-x-4">
        <Button 
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          variant="outline"
          className="flex-1"
        >
          Previous
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!currentAnswer || saveAssessmentMutation.isPending}
          className="flex-1 bg-gradient-to-r from-primary to-blue-400"
        >
          {currentQuestion === assessmentQuestions.length - 1 
            ? (saveAssessmentMutation.isPending ? "Analyzing..." : "Complete Assessment")
            : "Next"
          }
        </Button>
      </div>
    </div>
  );
}
