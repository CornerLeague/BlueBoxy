import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Copy, Heart, Sun, Zap, Clock, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";

const messageCategories = [
  { id: "daily", label: "Daily Check-ins", active: true },
  { id: "appreciation", label: "Appreciation", active: false },
  { id: "support", label: "Support", active: false },
  { id: "romantic", label: "Romantic", active: false },
  { id: "playful", label: "Playful", active: false },
];

const sampleMessages = [
  {
    id: 1,
    category: "daily",
    title: "Morning Energy",
    content: "Good morning, beautiful! I woke up thinking about your smile and how it brightens my entire day. Hope you have an amazing day ahead! ☀️💙",
    personalityMatch: "Perfect for Harmonizers",
    icon: Sun,
    iconColor: "bg-gradient-to-br from-primary to-blue-400",
  },
  {
    id: 2,
    category: "support",
    title: "Motivation Boost",
    content: "You've been working so hard lately, and I'm incredibly proud of your dedication. Remember, you're capable of amazing things! I believe in you completely. 💪",
    personalityMatch: "High Impact",
    icon: Zap,
    iconColor: "bg-gradient-to-br from-success to-green-400",
  },
  {
    id: 3,
    category: "daily",
    title: "Thoughtful Check-in",
    content: "How was your day, love? I've been thinking about you and would love to hear all about it when you have a moment. You're always on my mind. 💙",
    personalityMatch: "Evening",
    icon: Clock,
    iconColor: "bg-gradient-to-br from-warning to-yellow-400",
  },
];

export default function Messages() {
  const [, setLocation] = useLocation();
  const { goBack } = useNavigationHistory();
  const [activeCategory, setActiveCategory] = useState("daily");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem("userId");

  const incrementMessageMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await apiRequest("POST", "/api/user/stats/message-copied", { userId: parseInt(userId) });
    },
    onSuccess: () => {
      // Invalidate user stats to refresh the profile page
      queryClient.invalidateQueries({ queryKey: [`/api/user/stats`, userId] });
    },
  });

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({
      title: "Message copied!",
      description: "The message has been copied to your clipboard.",
    });
    
    // Track the copy action
    incrementMessageMutation.mutate();
  };

  const filteredMessages = sampleMessages.filter(msg => msg.category === activeCategory);

  return (
    <div className="p-6 min-h-screen pb-24">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Thoughtful Messages</h2>
      </div>
      
      {/* Categories */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {messageCategories.map((category) => (
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
