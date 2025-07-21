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
              <p className="text-muted-foreground text-xs">
                {hasLocationPreferences 
                  ? `${activities.length} recommendations available`
                  : "Get personalized local date ideas"
                }
              </p>
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
      
      {/* Activity Cards */}
      <div className="space-y-4">
        {activeCategory === "location-based" && !hasLocationPreferences ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Setup Location Preferences</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Get personalized date recommendations based on your location and preferences. 
              We'll suggest activities within your preferred radius.
            </p>
            <Button 
              onClick={() => setLocation("/preferences")}
              className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
            >
              Setup Preferences
            </Button>
          </div>
        ) : (isLoading || (activeCategory === "location-based" && isLoadingLocation)) ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Recommendations</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Get personalized AI-powered date recommendations based on your location, preferences, and personality.
            </p>
            <Button 
              onClick={() => generateAIRecommendations()}
              disabled={isGeneratingAI}
              className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
            >
              {isGeneratingAI ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                "Get Recommendations"
              )}
            </Button>
          </div>
        ) : (
          filteredActivities.map((activity: any) => (
            <div key={activity.id} className="glass-card rounded-2xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <img 
                  src={activity.imageUrl} 
                  alt={activity.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{activity.name}</h3>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-warning mr-1" fill="currentColor" />
                    <span className="text-sm font-medium">{activity.rating}</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{activity.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-success text-sm font-medium">{activity.personalityMatch}</span>
                  <span className="text-muted-foreground text-sm">{activity.distance}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleScheduleDate(activity.name)}
                    className="flex-1 bg-gradient-to-r from-primary to-blue-500 text-white hover:from-primary/90 hover:to-blue-500/90 px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-200"
                  >
                    Schedule Date
                  </button>
                  <button className="control-btn px-4 py-2 rounded-xl">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      
    </div>
  );
}
