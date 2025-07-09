import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
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
  const { toast } = useToast();

  const userId = localStorage.getItem("userId");

  const saveAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      const response = await apiRequest("POST", "/api/assessment/responses", assessmentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Complete!",
        description: "We've analyzed your partner's personality and are generating personalized recommendations.",
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

  const handleNext = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Complete assessment
      saveAssessmentMutation.mutate({
        responses,
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
            onClick={() => setLocation("/")}
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
