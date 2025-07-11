import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    partnerName: "",
    relationshipDuration: ""
  });

  const steps = [
    {
      title: "What's your name?",
      description: "Let's start by getting to know you better",
      field: "name",
      placeholder: "Enter your first name",
      type: "text"
    },
    {
      title: "What's your partner's name?",
      description: "This helps us personalize your experience",
      field: "partnerName",
      placeholder: "Enter your partner's name",
      type: "text"
    },
    {
      title: "How long have you been together?",
      description: "This helps us understand your relationship stage",
      field: "relationshipDuration",
      placeholder: "e.g., 6 months, 2 years, etc.",
      type: "text"
    }
  ];

  const currentStepData = steps[currentStep];

  const handleInputChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      [currentStepData.field]: value
    }));
  };

  const handleNext = () => {
    const currentValue = formData[currentStepData.field as keyof typeof formData];
    if (!currentValue.trim()) {
      toast({
        title: "Please fill in this field",
        description: "This information helps us personalize your experience.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Save onboarding data to localStorage
      localStorage.setItem("onboardingData", JSON.stringify(formData));
      
      // Navigate to assessment
      setLocation("/assessment");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      setLocation("/");
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-blue-50/20 p-6">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto pt-16">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center mb-4 mx-auto animate-float">
            <Heart className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Form Card */}
        <Card className="backdrop-blur-sm bg-card/50 border-muted">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {currentStepData.title}
            </CardTitle>
            <p className="text-muted-foreground">
              {currentStepData.description}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor={currentStepData.field} className="text-sm font-medium">
                {currentStepData.title}
              </Label>
              <Input
                id={currentStepData.field}
                type={currentStepData.type}
                placeholder={currentStepData.placeholder}
                value={formData[currentStepData.field as keyof typeof formData]}
                onChange={(e) => handleInputChange(e.target.value)}
                className="h-12 bg-[#ffffff24]"
                autoFocus
              />
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="flex-1"
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-primary to-blue-400 text-white"
                disabled={!formData[currentStepData.field as keyof typeof formData].trim()}
              >
                {currentStep === steps.length - 1 ? "Start Assessment" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}