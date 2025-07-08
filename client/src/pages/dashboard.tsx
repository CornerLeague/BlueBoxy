import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { MessageSquare, MapPin, Calendar, User, Copy, Share2 } from "lucide-react";
import { PersonalityCircle } from "@/components/personality-circle";
import { RecommendationCard } from "@/components/recommendation-card";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = localStorage.getItem("userId");

  const { data: user } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: [`/api/recommendations/user/${userId}`],
    enabled: !!userId,
  });

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({
      title: "Message copied!",
      description: "The message has been copied to your clipboard.",
    });
  };

  if (!user) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Setting up your personalized dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Good morning, {user.name}</h1>
            <p className="text-muted-foreground">Here's how to make {user.partnerName} smile today</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Personality Insight Card */}
        <Card className="glass-effect rounded-xl p-4 mb-6 personality-glow">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{user.partnerName}'s Personality</h3>
              <span className="text-xs bg-primary px-2 py-1 rounded-full text-white">
                {user.personalityType || "Thoughtful Harmonizer"}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {user.partnerName} values meaningful connections and appreciates thoughtful gestures. 
              They respond well to quality time and words of affirmation.
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success rounded-full mr-2"></div>
                <span className="text-sm">Compatibility: 92%</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-warning rounded-full mr-2"></div>
                <span className="text-sm">Needs attention</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Today's Recommendations */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today's Recommendations</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            See All
          </Button>
        </div>
        
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onCopyMessage={handleCopyMessage}
            />
          ))}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => setLocation("/messages")}
            variant="outline"
            className="bg-secondary p-4 rounded-xl flex flex-col items-center h-auto"
          >
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-2">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium">Messages</span>
          </Button>
          
          <Button 
            onClick={() => setLocation("/activities")}
            variant="outline"
            className="bg-secondary p-4 rounded-xl flex flex-col items-center h-auto"
          >
            <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center mb-2">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium">Activities</span>
          </Button>
          
          <Button 
            onClick={() => setLocation("/calendar")}
            variant="outline"
            className="bg-secondary p-4 rounded-xl flex flex-col items-center h-auto"
          >
            <div className="w-12 h-12 bg-warning rounded-full flex items-center justify-center mb-2">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium">Calendar</span>
          </Button>
          
          <Button 
            onClick={() => setLocation("/profile")}
            variant="outline"
            className="bg-secondary p-4 rounded-xl flex flex-col items-center h-auto"
          >
            <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center mb-2">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
