import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  MapPin, 
  Star, 
  ExternalLink, 
  Settings, 
  Navigation, 
  Loader2,
  RefreshCw,
  Coffee,
  Utensils,
  TreePine,
  Palette,
  Zap,
  Wine,
  Sparkles,
  Clock,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Activity categories with specialized icons and colors
const activityCategories = [
  { id: "recommended", label: "Recommended", icon: Sparkles, color: "text-blue-600" },
  { id: "near_me", label: "Near Me", icon: Navigation, color: "text-green-600" },
  { id: "dining", label: "Dining", icon: Utensils, color: "text-orange-600" },
  { id: "outdoor", label: "Outdoor", icon: TreePine, color: "text-emerald-600" },
  { id: "cultural", label: "Cultural", icon: Palette, color: "text-purple-600" },
  { id: "active", label: "Active", icon: Zap, color: "text-red-600" },
  { id: "drinks", label: "Drinks", icon: Wine, color: "text-amber-600" }
];

// Drink preferences with ordering
const drinkPreferences = [
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "tea", label: "Tea", icon: Coffee },
  { id: "alcohol", label: "Alcohol", icon: Wine },
  { id: "non_alcohol", label: "Non-Alcohol", icon: Coffee },
  { id: "boba", label: "Boba", icon: Coffee },
  { id: "other", label: "Other", icon: Coffee }
];

interface ActivityRecommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  distance: number;
  price: string;
  address: string;
  phone?: string;
  website?: string;
  specialties?: string[];
  atmosphere?: string;
  estimatedCost: string;
  recommendedTime: string;
  personalityMatch: string;
}

export default function Activities() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("recommended");
  const [activeDrinkTab, setActiveDrinkTab] = useState("coffee");
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [radius, setRadius] = useState([25]);
  const [recommendations, setRecommendations] = useState<ActivityRecommendation[]>([]);
  const [drinkRecommendations, setDrinkRecommendations] = useState<{[key: string]: ActivityRecommendation[]}>({});
  const [canGenerateMore, setCanGenerateMore] = useState(true);
  const [generationsRemaining, setGenerationsRemaining] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<"granted" | "denied" | "prompt">("prompt");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem("userId");

  // Get user profile for preferences
  const { data: user } = useQuery({
    queryKey: ["/api/user/profile", userId],
    enabled: !!userId,
  });

  // Detect user location on component mount
  useEffect(() => {
    detectLocation();
  }, []);

  // Reverse geocode coordinates to get city and state
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      
      if (data.city && data.principalSubdivision) {
        return `${data.city}, ${data.principalSubdivision}`;
      } else if (data.locality && data.principalSubdivision) {
        return `${data.locality}, ${data.principalSubdivision}`;
      } else if (data.principalSubdivision) {
        return data.principalSubdivision;
      } else {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location detection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      setUserLocation(location);
      setLocationPermissionStatus("granted");
      
      // Get readable location name
      const locationName = await reverseGeocode(location.latitude, location.longitude);
      setLocationName(locationName);

    } catch (error) {
      setLocationPermissionStatus("denied");
      toast({
        title: "Location access denied",
        description: "Please enable location access or enter your location manually.",
        variant: "destructive",
      });
    }
  };

  const handleGetRecommendations = async (resetAlgorithm = false) => {
    if (!userLocation || !userId) {
      toast({
        title: "Setup required",
        description: "Please enable location access and ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      let response;
      
      if (activeCategory === "drinks") {
        // Generate drink recommendations
        const drinkPrefs = (user as any)?.preferences?.drinkPreferences || ["coffee", "tea", "alcohol"];
        
        response = await apiRequest("POST", "/api/recommendations/drinks", {
          userId: parseInt(userId),
          location: userLocation,
          radius: radius[0],
          drinkPreferences: drinkPrefs,
          personalityType: (user as any)?.personalityType,
          resetAlgorithm
        });
        
        const result = await response.json();
        
        if (result.success) {
          setDrinkRecommendations(result.recommendations);
          setCanGenerateMore(result.canGenerateMore);
          setGenerationsRemaining(result.generationsRemaining);
          
          toast({
            title: "Drink recommendations generated!",
            description: `Found great spots for your drink preferences.`,
          });
        }
      } else {
        // Generate activity recommendations
        response = await apiRequest("POST", "/api/recommendations/location-based", {
          userId: parseInt(userId),
          location: userLocation,
          radius: radius[0],
          category: activeCategory,
          preferences: (user as any)?.preferences,
          personalityType: (user as any)?.personalityType,
          resetAlgorithm
        });
        
        const result = await response.json();
        
        if (result.success) {
          setRecommendations(result.recommendations);
          setCanGenerateMore(result.canGenerateMore);
          setGenerationsRemaining(result.generationsRemaining);
          
          // Format category name for display
          const categoryDisplayName = activeCategory === "near_me" 
            ? "Near Me" 
            : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
          
          toast({
            title: "Recommendations generated!",
            description: `Found ${result.recommendations.length} ${categoryDisplayName} suggestions near you.`,
          });
        }
      }
      
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMore = () => {
    handleGetRecommendations(false);
  };

  const handleScheduleActivity = (activityName: string) => {
    toast({
      title: "Activity scheduled!",
      description: `Added "${activityName}" to your calendar.`,
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setRecommendations([]);
    setDrinkRecommendations({});
    setCanGenerateMore(true);
    setGenerationsRemaining(2);
  };

  const getCurrentRecommendations = () => {
    if (activeCategory === "drinks") {
      return drinkRecommendations[activeDrinkTab] || [];
    }
    return recommendations;
  };

  const hasLocationPreferences = userLocation && (user as any)?.preferences;

  return (
    <div className="p-6 min-h-screen pb-24">
      <div className="flex items-center mb-6">
        <h2 className="text-xl font-semibold">Date Activities</h2>
      </div>
      
      {/* Location Status & Controls */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center min-w-0 flex-1 mr-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center mr-3 shadow-lg flex-shrink-0">
              {userLocation ? (
                <Navigation className="w-4 h-4 text-white" />
              ) : (
                <MapPin className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">
                {userLocation ? "Location-Based Recommendations" : "Setup Location"}
              </h3>
              {userLocation && locationName && (
                <p className="text-xs text-muted-foreground truncate">
                  {locationName}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-1 flex-shrink-0">
            {userLocation && (
              <Button
                variant="outline"
                size="sm"
                onClick={detectLocation}
                className="px-2 py-1 text-xs whitespace-nowrap"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Update
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/preferences")}
              className="px-2 py-1 text-xs whitespace-nowrap"
            >
              <Settings className="w-3 h-3 mr-1" />
              {userLocation ? "Prefs" : "Setup"}
            </Button>
          </div>
        </div>
        
        {/* Radius Control */}
        {userLocation && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Search Radius</label>
              <span className="text-sm text-primary font-semibold">{radius[0]} miles</span>
            </div>
            <Slider
              value={radius}
              onValueChange={setRadius}
              max={50}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 mile</span>
              <span>50 miles</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Activity Categories */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {activityCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(category.id)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap flex items-center ${
                activeCategory === category.id 
                  ? "bg-primary text-white shadow-lg" 
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <IconComponent className={`w-4 h-4 mr-2 ${category.color}`} />
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* Drink Preference Tabs (only shown when drinks category is active) */}
      {activeCategory === "drinks" && (
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {drinkPreferences.map((drink) => {
            const IconComponent = drink.icon;
            return (
              <Button
                key={drink.id}
                variant={activeDrinkTab === drink.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveDrinkTab(drink.id)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap flex items-center ${
                  activeDrinkTab === drink.id 
                    ? "bg-amber-500 text-white" 
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                <IconComponent className="w-3 h-3 mr-1" />
                {drink.label}
              </Button>
            );
          })}
        </div>
      )}
      
      {/* Generation Controls */}
      {userLocation && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-3">
            <Button 
              onClick={() => handleGetRecommendations(true)}
              disabled={isGenerating}
              className="bg-gradient-to-r from-primary to-blue-400 text-white shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Recommendations
                </>
              )}
            </Button>
            
            {canGenerateMore && getCurrentRecommendations().length > 0 && (
              <Button 
                variant="outline"
                onClick={handleGenerateMore}
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate More ({generationsRemaining} left)
              </Button>
            )}
          </div>
          
          {getCurrentRecommendations().length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {getCurrentRecommendations().length} recommendations
            </Badge>
          )}
        </div>
      )}
      
      {/* Recommendations Display */}
      {getCurrentRecommendations().length > 0 && (
        <div className="space-y-4">
          {getCurrentRecommendations().map((activity, index) => (
            <Card key={activity.id} className="glass-card hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground mb-1">{activity.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{activity.rating}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-blue-500 mr-1" />
                        <span className="text-sm">{activity.distance} miles</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm">{activity.estimatedCost}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-purple-500 mr-1" />
                        <span className="text-sm">{activity.recommendedTime}</span>
                      </div>
                    </div>
                    
                    {activity.specialties && activity.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {activity.specialties.map((specialty, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs py-0 px-2">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      <p><strong>Address:</strong> {activity.address}</p>
                      {activity.atmosphere && <p><strong>Atmosphere:</strong> {activity.atmosphere}</p>}
                      <p><strong>Why it's perfect:</strong> {activity.personalityMatch}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleScheduleActivity(activity.name)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-3 py-1"
                    >
                      Schedule
                    </Button>
                    {activity.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(activity.website, '_blank')}
                        className="text-xs px-3 py-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {index === 0 && (
                  <div className="bg-primary/10 rounded-lg p-2 mt-3">
                    <p className="text-xs text-primary font-medium">
                      🎯 Local recommendation - This is a nearby gem perfect for you!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Empty States */}
      {!userLocation && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Enable Location Access</h3>
          <p className="text-muted-foreground mb-4">
            Allow location access to get personalized activity recommendations near you.
          </p>
          <Button onClick={detectLocation} className="bg-primary text-white">
            <Navigation className="w-4 h-4 mr-2" />
            Enable Location
          </Button>
        </div>
      )}
      
      {userLocation && getCurrentRecommendations().length === 0 && !isGenerating && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to Discover</h3>
          <p className="text-muted-foreground mb-4">
            Click "Get Recommendations" to find amazing {activeCategory} activities near you within {radius[0]} miles.
          </p>
        </div>
      )}
    </div>
  );
}