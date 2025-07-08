import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Heart, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const activityCategories = [
  { id: "recommended", label: "Recommended", active: true },
  { id: "dining", label: "Dining", active: false },
  { id: "outdoor", label: "Outdoor", active: false },
  { id: "cultural", label: "Cultural", active: false },
  { id: "active", label: "Active", active: false },
];

export default function Activities() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("recommended");
  const { toast } = useToast();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  const handleScheduleDate = (activityName: string) => {
    toast({
      title: "Date scheduled!",
      description: `Added "${activityName}" to your calendar.`,
    });
  };

  const filteredActivities = activities.filter((activity: any) => {
    if (activeCategory === "recommended") return true;
    return activity.category === activeCategory;
  });

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/dashboard")}
          className="mr-4 p-2 rounded-full bg-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-semibold">Date Activities</h2>
      </div>
      
      {/* Location Status */}
      <Card className="p-4 mb-6">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">San Francisco, CA</h3>
                <p className="text-muted-foreground text-xs">{activities.length} recommendations nearby</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">
              Change
            </Button>
          </div>
        </CardContent>
      </Card>
      
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
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading activities...</p>
          </div>
        ) : (
          filteredActivities.map((activity: any) => (
            <Card key={activity.id} className="activity-card">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <img 
                  src={activity.imageUrl} 
                  alt={activity.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{activity.name}</h3>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-warning mr-1" fill="currentColor" />
                    <span className="text-sm">{activity.rating}</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-3">{activity.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-success text-sm">{activity.personalityMatch}</span>
                  <span className="text-muted-foreground text-sm">{activity.distance}</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleScheduleDate(activity.name)}
                    className="flex-1 bg-primary text-white hover:bg-primary/90"
                  >
                    Schedule Date
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 bg-muted"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {filteredActivities.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No activities found</h3>
          <p className="text-muted-foreground">
            Activities for this category will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
