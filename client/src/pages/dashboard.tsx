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
  const token = localStorage.getItem("authToken");
  const guestResults = localStorage.getItem("guestAssessmentResults");
  const onboardingData = localStorage.getItem("onboardingData");

  // Check if user is authenticated or has guest results
  const isAuthenticated = !!userId && !!token;
  const isGuest = !isAuthenticated && !!guestResults;

  const { data: user } = useQuery({
    queryKey: [`/api/user/profile`],
    enabled: isAuthenticated,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: [`/api/recommendations/messages`],
    enabled: isAuthenticated,
  });

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({
      title: "Message copied!",
      description: "The message has been copied to your clipboard.",
    });
  };

  // Handle guest user with assessment results
  if (isGuest) {
    const guestData = JSON.parse(guestResults!);
    const userData = guestData.onboardingData || JSON.parse(onboardingData || "{}");
    
    return (
      <div className="min-h-screen pb-20">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                Good morning{userData.name ? `, ${userData.name}` : ""}
              </h1>
              <p className="text-muted-foreground">
                {userData.partnerName 
                  ? `Here's how to make ${userData.partnerName} smile today`
                  : "Your personality analysis is ready!"
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {/* Create Account Banner */}
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-blue-400/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-primary">Save Your Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Create an account to save your assessment and get ongoing recommendations
                  </p>
                </div>
                <Button 
                  onClick={() => setLocation("/login")}
                  className="bg-gradient-to-r from-primary to-blue-400 text-white"
                >
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Personality Insight Card */}
          <div className="glass-card rounded-2xl p-6 mb-6 personality-glow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {userData.partnerName ? `${userData.partnerName}'s Personality` : "Your Personality"}
              </h3>
              <PersonalityCircle percentage={85} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-primary">{guestData.personalityType}</h4>
              <p className="text-muted-foreground text-sm">
                {guestData.personalityType === "Social Butterfly" 
                  ? "Outgoing, enthusiastic, and loves connecting with others. Thrives in social settings and enjoys being the center of attention."
                  : "A unique personality type with specific traits and preferences."
                }
              </p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => setLocation("/messages")}
            >
              <MessageSquare className="w-6 h-6 text-primary" />
              <span className="text-sm">Messages</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => setLocation("/activities")}
            >
              <MapPin className="w-6 h-6 text-primary" />
              <span className="text-sm">Activities</span>
            </Button>
          </div>

          {/* Sample Recommendations */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Sample Recommendations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create an account to unlock personalized recommendations based on your assessment
            </p>
            
            <RecommendationCard
              recommendation={{
                id: 1,
                type: "message",
                category: "appreciation",
                content: "Hey beautiful, I was just thinking about how lucky I am to have someone as amazing as you in my life. Your smile brightens my entire day! 💕",
                priority: "high",
                personalityMatch: guestData.personalityType
              }}
              onCopyMessage={handleCopyMessage}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please complete the assessment to view your dashboard.</p>
          <Button onClick={() => setLocation("/onboarding")} className="mt-4">
            Get Started
          </Button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Good morning, {user.name}</h1>
            <p className="text-muted-foreground">Here's how to make {user.partnerName?.split(' ')[0]} smile today</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Personality Insight Card */}
        <div className="glass-card rounded-2xl p-6 mb-6 personality-glow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">{user.partnerName}'s Personality</h3>
            <span className="mode-badge px-3 py-1 rounded-full text-xs font-medium text-primary">
              {user.personalityType || "Thoughtful Harmonizer"}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
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
              <span className="text-sm text-warning">Needs attention</span>
            </div>
          </div>
        </div>
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
          <button 
            onClick={() => setLocation("/messages")}
            className="control-btn p-4 rounded-2xl flex flex-col items-center h-auto border-0 hover:bg-[var(--hover-subtle)] hover:text-[var(--hover-text)] transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium">Messages</span>
          </button>
          
          <button 
            onClick={() => setLocation("/activities")}
            className="control-btn p-4 rounded-2xl flex flex-col items-center h-auto border-0 hover:bg-[var(--hover-subtle)] hover:text-[var(--hover-text)] transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium">Activities</span>
          </button>
          
          <button 
            onClick={() => setLocation("/calendar")}
            className="control-btn p-4 rounded-2xl flex flex-col items-center h-auto border-0 hover:bg-[var(--hover-subtle)] hover:text-[var(--hover-text)] transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium">Calendar</span>
          </button>
          
          <button 
            onClick={() => setLocation("/profile")}
            className="control-btn p-4 rounded-2xl flex flex-col items-center h-auto border-0 hover:bg-[var(--hover-subtle)] hover:text-[var(--hover-text)] transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
