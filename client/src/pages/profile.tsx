import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, User, Edit, RefreshCw, Bell, Lock, ChevronRight } from "lucide-react";

export default function Profile() {
  const [, setLocation] = useLocation();
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");

  const { data: user } = useQuery({
    queryKey: [`/api/user/profile`, userId],
    queryFn: () => fetch(`/api/user/profile?userId=${userId}`).then(res => res.json()),
    enabled: !!userId,
  });

  const { data: assessment } = useQuery({
    queryKey: [`/api/assessments/user/${userId}`],
    enabled: !!userId,
  });

  const { data: userStats } = useQuery({
    queryKey: [`/api/user/stats`, userId],
    queryFn: () => fetch(`/api/user/stats/${userId}`).then(res => res.json()),
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
          <Button onClick={() => setLocation("/onboarding")} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/dashboard")}
          className="mr-4 p-2 rounded-full bg-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-semibold">Profile</h2>
      </div>
      
      {/* User Profile */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{user.name}</h3>
            <p className="text-muted-foreground">In a relationship for {user.relationshipDuration}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{userStats?.messagesCopied || 0}</div>
            <div className="text-muted-foreground text-sm">Messages Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{userStats?.eventsCreated || 0}</div>
            <div className="text-muted-foreground text-sm">Dates Planned</div>
          </div>
        </div>
      </div>
      
      {/* Partner Profile */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{user.partnerName}'s Profile</h3>
          <button className="control-btn px-3 py-1 rounded-lg text-primary text-sm font-medium flex items-center hover:bg-[var(--hover-subtle)] hover:text-[var(--hover-text)] transition-colors">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
        </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Personality Type</span>
              <span className="text-primary font-semibold">{user.personalityType || "Thoughtful Harmonizer"}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Love Language</span>
              <span>Quality Time</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Preferred Communication</span>
              <span>Evening check-ins</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stress Response</span>
              <span>Needs processing time</span>
            </div>
          </div>
          
          {/* Personality Insights */}
          <div className="mt-6 p-4 bg-black/20 rounded-xl border border-white/10">
            <h4 className="font-semibold mb-2">Key Insights</h4>
            <ul className="text-muted-foreground text-sm space-y-1">
              <li>• Appreciates thoughtful gestures over grand displays</li>
              <li>• Values deep, meaningful conversations</li>
              <li>• Prefers peaceful, intimate settings</li>
              <li>• Responds well to emotional support</li>
            </ul>
          </div>
      </div>
      
      {/* Relationship Analytics */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Relationship Analytics</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Communication Score</span>
              <span className="font-semibold">85%</span>
            </div>
            <Progress value={85} className="w-full" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Thoughtfulness Index</span>
              <span className="font-semibold">92%</span>
            </div>
            <Progress value={92} className="w-full" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Quality Time</span>
              <span className="font-semibold">78%</span>
            </div>
            <Progress value={78} className="w-full" />
          </div>
        </div>
      </div>
      
      {/* Settings */}
      <div className="space-y-3">
        <button 
          className="w-full control-btn p-4 rounded-2xl flex items-center justify-between border-0 hover:bg-[var(--hover-subtle)] hover:text-[var(--hover-text)] transition-colors"
          onClick={() => setLocation("/assessment")}
        >
          <div className="flex items-center">
            <RefreshCw className="w-5 h-5 mr-3" />
            <span>Retake Assessment</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <button className="w-full control-btn p-4 rounded-2xl flex items-center justify-between border-0">
          <div className="flex items-center">
            <Bell className="w-5 h-5 mr-3" />
            <span>Notification Settings</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <button className="w-full control-btn p-4 rounded-2xl flex items-center justify-between border-0">
          <div className="flex items-center">
            <Lock className="w-5 h-5 mr-3" />
            <span>Privacy & Security</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
