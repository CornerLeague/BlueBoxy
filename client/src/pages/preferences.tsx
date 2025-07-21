import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { preferenceQuestions, getScaleLabel, type PreferenceResponse } from "@/lib/preferences";
import { getCurrentLocation } from "@/lib/geolocation";
import { ArrowRight, MapPin, Loader2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

export default function Preferences() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, PreferenceResponse>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const currentQuestion = preferenceQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === preferenceQuestions.length - 1;
  const hasAnswered = (() => {
    const response = responses[currentQuestion.id];
    if (!response) {
      // For scale and boolean questions, they have default values
      if (currentQuestion.type === 'scale' || currentQuestion.type === 'boolean') {
        return true;
      }
      return false;
    }
    
    if (currentQuestion.type === 'multi-select') {
      return Array.isArray(response.value) && response.value.length > 0;
    }
    
    return response.value !== undefined && response.value !== null;
  })();

  const handleLocationRequest = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    try {
      const location = await getCurrentLocation();
      setUserLocation({
        latitude: location.latitude,
        longitude: location.longitude
      });
      
      toast({
        title: "Location accessed",
        description: "We'll use your location to find nearby date ideas!"
      });
    } catch (error: any) {
      setLocationError(error.message);
      toast({
        title: "Location access failed",
        description: "We'll still provide great recommendations without location data.",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleAnswer = (value: string | number | boolean) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        value
      }
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const preferencesData = {
        preferences: Object.values(responses),
        location: userLocation
      };

      const userId = localStorage.getItem("userId");
      const userData = JSON.parse(localStorage.getItem("userData") || "null");
      const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
      
      if (isAuthenticated && userId && userData) {
        // Save to server for authenticated users
        const response = await fetch("/api/user/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: parseInt(userId),
            preferences: responses,
            location: userLocation
          })
        });

        if (!response.ok) {
          throw new Error("Failed to save preferences");
        }

        // Update localStorage
        const updatedUserData = {
          ...userData,
          preferences: responses,
          location: userLocation
        };
        localStorage.setItem("userData", JSON.stringify(updatedUserData));
      } else {
        // Save to localStorage for guests
        const guestData = JSON.parse(localStorage.getItem("guestAssessmentResults") || "{}");
        const updatedGuestData = {
          ...guestData,
          preferences: responses,
          location: userLocation
        };
        localStorage.setItem("guestAssessmentResults", JSON.stringify(updatedGuestData));
      }

      toast({
        title: "Preferences saved!",
        description: "Your personalized date recommendations are ready."
      });
      
      setLocation("/activities");
    } catch (error) {
      toast({
        title: "Error saving preferences",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = () => {
    const currentResponse = responses[currentQuestion.id];
    
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={currentResponse?.value as string || ''}
            onValueChange={(value) => handleAnswer(value)}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option} className="text-sm cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'multi-select':
        const selectedValues = (currentResponse?.value as string[]) || [];
        const handleMultiSelectChange = (option: string, checked: boolean) => {
          let newSelected = [...selectedValues];
          
          // Handle "None of these" logic
          if (option === "None of these") {
            if (checked) {
              // If "None of these" is selected, clear all other selections
              newSelected = ["None of these"];
            } else {
              newSelected = [];
            }
          } else {
            // If any other option is selected, remove "None of these"
            if (checked && newSelected.includes("None of these")) {
              newSelected = newSelected.filter(item => item !== "None of these");
            }
            
            if (checked) {
              if (!newSelected.includes(option)) {
                newSelected.push(option);
              }
            } else {
              newSelected = newSelected.filter(item => item !== option);
            }
          }
          
          handleAnswer(newSelected);
        };

        const handleCustomInputChange = (value: string) => {
          setCustomInputs(prev => ({
            ...prev,
            [currentQuestion.id]: value
          }));
          
          // Update the selected values to include the custom input
          if (value.trim() && selectedValues.includes("Others")) {
            const updatedValues = selectedValues.filter(v => !v.startsWith("Others:"));
            updatedValues.push(`Others: ${value.trim()}`);
            handleAnswer(updatedValues);
          }
        };
        
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <div key={option} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={selectedValues.includes(option) || (option === "Others" && selectedValues.some(v => v.startsWith("Others:")))}
                    onCheckedChange={(checked) => handleMultiSelectChange(option, checked as boolean)}
                  />
                  <Label htmlFor={option} className="text-sm cursor-pointer">
                    {option}
                  </Label>
                </div>
                {option === "Others" && (selectedValues.includes("Others") || selectedValues.some(v => v.startsWith("Others:"))) && (
                  <div className="ml-6">
                    <Input
                      placeholder="Please specify..."
                      value={customInputs[currentQuestion.id] || ''}
                      onChange={(e) => handleCustomInputChange(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      
      case 'scale':
        const scaleValue = (currentResponse?.value as number) || 3;
        // Set default value if not already set
        if (!currentResponse) {
          handleAnswer(3);
        }
        return (
          <div className="space-y-4">
            <div className="px-3">
              <Slider
                value={[scaleValue]}
                onValueChange={([value]) => handleAnswer(value)}
                max={currentQuestion.max || 5}
                min={currentQuestion.min || 1}
                step={1}
                className="w-full"
              />
            </div>
            <div className="text-center text-sm text-gray-400">
              {getScaleLabel(scaleValue, currentQuestion.id)}
            </div>
          </div>
        );
      
      case 'boolean':
        const booleanValue = (currentResponse?.value as boolean) ?? false;
        // Set default value if not already set
        if (!currentResponse) {
          handleAnswer(false);
        }
        return (
          <div className="flex items-center space-x-3">
            <Switch
              checked={booleanValue}
              onCheckedChange={(checked) => handleAnswer(checked)}
            />
            <Label className="text-sm">
              {booleanValue ? 'Yes' : 'No'}
            </Label>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (currentQuestionIndex === 0 && !userLocation && !locationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#ffffff0a] backdrop-blur-sm border-white/20 text-white">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <BackButton className="bg-white/10 hover:bg-white/20" />
              <div className="flex-1" />
            </div>
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Personalized Date Recommendations
            </CardTitle>
            <CardDescription className="text-gray-300">
              We'll ask you a few questions to create the perfect date recommendations based on your preferences and location.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-300">
                First, we'd like to access your location to find nearby date spots within your preferred radius.
              </p>
              <Button
                onClick={handleLocationRequest}
                disabled={isGettingLocation}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Allow Location Access
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(1)}
                className="w-full border-white/20 hover:bg-white/10"
              >
                Skip Location (Continue Without)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-[#ffffff0a] backdrop-blur-sm border-white/20 text-white">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <BackButton className="bg-white/10 hover:bg-white/20" />
            <div className="flex-1" />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              Question {currentQuestionIndex + 1} of {preferenceQuestions.length}
            </div>
            <div className="text-sm text-gray-300 capitalize">
              {currentQuestion.category}
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / preferenceQuestions.length) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <CardTitle className="text-xl mb-4">
              {currentQuestion.question}
            </CardTitle>
            {renderQuestionInput()}
          </div>
          
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="border-white/20 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!hasAnswered || isSubmitting}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isLastQuestion ? (
                "Complete Setup"
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}