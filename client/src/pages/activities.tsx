import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Heart, ExternalLink, Settings, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";
import { apiRequest } from "@/lib/queryClient";

const activityCategories = [
  { id: "recommended", label: "Recommended", active: true },
  { id: "location-based", label: "Near Me", active: false },
  { id: "dining", label: "Dining", active: false },
  { id: "outdoor", label: "Outdoor", active: false },
  { id: "cultural", label: "Cultural", active: false },
  { id: "active", label: "Active", active: false },
];

export default function Activities() {
  const [, setLocation] = useLocation();
  const { goBack } = useNavigationHistory();
  const [activeCategory, setActiveCategory] = useState("recommended");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  const userId = localStorage.getItem("userId");
  
  const { data: user } = useQuery({
    queryKey: ["/api/user/profile", userId],
    queryFn: () => fetch(`/api/user/profile?userId=${userId}`).then(res => res.json()),
    enabled: !!userId,
  });

  const { data: locationActivities = [], isLoading: isLoadingLocation } = useQuery({
    queryKey: ["/api/recommendations/location-based", userId],
    queryFn: () => fetch(`/api/recommendations/location-based?userId=${userId}&radius=25`).then(res => res.json()),
    enabled: activeCategory === "location-based" && !!userId && !!user?.location,
  });

  const handleScheduleDate = (activityName: string) => {
    toast({
      title: "Date scheduled!",
      description: `Added "${activityName}" to your calendar.`,
    });
  };

  const generateAIRecommendations = async () => {
    if (!userId || !user) {
      toast({
        title: "Error",
        description: "Please log in to generate recommendations.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingAI(true);
    try {
      console.log("Generating AI recommendations for user:", userId);
      const response = await apiRequest("POST", "/api/recommendations/ai-powered", {
        userId: parseInt(userId),
        category: activeCategory,
        location: user.location,
        preferences: user.preferences
      });
      
      console.log("AI recommendations response:", response);
      
      // Update activities with AI recommendations
      if (response.recommendations?.activities) {
        // Set the AI recommendations as the new filtered activities
        setAIRecommendations(response.recommendations.activities);
        
        // Also invalidate queries to refresh other data
        queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
        queryClient.invalidateQueries({ queryKey: ["/api/recommendations/location-based", userId] });
        
        toast({
          title: "Recommendations Generated!",
          description: "Fresh AI-powered date ideas are now available.",
        });
      } else {
        toast({
          title: "No Recommendations",
          description: "Unable to generate recommendations at this time.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      toast({
        title: "Error",
        description: `Failed to generate recommendations: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const filteredActivities = activeCategory === "location-based" 
    ? locationActivities?.activities || [] 
    : aiRecommendations.length > 0 && activeCategory === "recommended"
    ? aiRecommendations
    : activities.filter((activity: any) => {
        if (activeCategory === "recommended") return true;
        return activity.category === activeCategory;
      });

  const hasLocationPreferences = user?.location && user?.preferences;

  return (
    <div className="p-6 min-h-screen pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="mr-4 p-2 rounded-full bg-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-semibold">Date Activities</h2>
      </div>
      
      {/* Location Status */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
              {hasLocationPreferences ? (
                <Navigation className="w-4 h-4 text-white" />
              ) : (
                <MapPin className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {hasLocationPreferences ? "Location-Based Recommendations" : "Setup Location Preferences"}
              </h3>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/preferences")}
            className="px-3 py-1 rounded-lg text-primary text-sm font-medium"
          >
            {hasLocationPreferences ? (
              <>
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </>
            ) : (
              "Setup"
            )}
          </Button>
        </div>
      </div>
      
      {/* Activity Categories */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {activityCategories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeCategory === category.id 
                ? "bg-primary text-white" 
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {category.label}
          </Button>
        ))}
      </div>
      
      
      
      
    </div>
  );
}
