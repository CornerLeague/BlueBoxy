import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Heart, MessageSquare, Share2, Sparkles, Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface GeneratedMessage {
  id: string;
  content: string;
  category: string;
  personalityMatch: string;
  tone: string;
  estimatedImpact: "high" | "medium" | "low";
}

interface MessageCategory {
  id: string;
  label: string;
  description: string;
  icon: any;
}

const messageCategories: MessageCategory[] = [
  { id: "daily_checkins", label: "Daily Check-ins", description: "Show daily care and maintain connection", icon: MessageSquare },
  { id: "appreciation", label: "Appreciation", description: "Express gratitude and acknowledge partner's value", icon: Heart },
  { id: "support", label: "Support", description: "Provide emotional support during challenges", icon: Sparkles },
  { id: "romantic", label: "Romantic", description: "Express love and romantic feelings", icon: Heart },
  { id: "playful", label: "Playful", description: "Add fun and lightness to the relationship", icon: Share2 }
];

export default function Messages() {
  const [activeCategory, setActiveCategory] = useState("daily_checkins");
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [generationContext, setGenerationContext] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem("userId");

  // Load persisted messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("generatedMessages");
    const savedContext = localStorage.getItem("generationContext");
    
    if (savedMessages) {
      try {
        setGeneratedMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error("Error loading saved messages:", error);
      }
    }
    
    if (savedContext) {
      try {
        setGenerationContext(JSON.parse(savedContext));
      } catch (error) {
        console.error("Error loading saved context:", error);
      }
    }
  }, []);

  // Fetch message categories from API
  const { data: categoriesResponse } = useQuery({
    queryKey: ["/api/messages/categories"],
  });

  // Message generation mutation
  const generateMessagesMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!userId) {
        throw new Error("User ID not found");
      }

      const currentTime = new Date();
      const timeOfDay = 
        currentTime.getHours() < 12 ? "morning" :
        currentTime.getHours() < 17 ? "afternoon" :
        currentTime.getHours() < 21 ? "evening" : "night";

      const response = await apiRequest("POST", "/api/messages/generate", {
        userId: parseInt(userId),
        category: categoryId,
        timeOfDay
      });
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedMessages(data.messages);
        setGenerationContext(data.context);
        
        // Persist to localStorage
        localStorage.setItem("generatedMessages", JSON.stringify(data.messages));
        localStorage.setItem("generationContext", JSON.stringify(data.context));
        
        toast({
          title: "Messages Generated!",
          description: `Created ${data.messages.length} personalized messages for you.`,
        });
      } else {
        setGeneratedMessages([]);
        setGenerationContext(null);
        
        // Clear from localStorage on failure
        localStorage.removeItem("generatedMessages");
        localStorage.removeItem("generationContext");
        
        toast({
          title: "Generation Failed",
          description: data.error || "Sorry, I was unable to give you a message at this time.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Message generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate messages. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleGenerateMessages = (categoryId: string) => {
    generateMessagesMutation.mutate(categoryId);
  };

  const handleCopyMessage = async (message: GeneratedMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-green-600 bg-green-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "low": return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const activeMessageCategory = messageCategories.find(cat => cat.id === activeCategory);

  return (
    <div className="p-6 min-h-screen pb-24">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">AI Message Generator</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Generate personalized messages based on your partner's personality
        </p>
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
            <category.icon className="w-4 h-4 mr-2" />
            {category.label}
          </Button>
        ))}
      </div>

      {/* Category Description & Generate Button */}
      {activeMessageCategory && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{activeMessageCategory.label}</h3>
                <p className="text-muted-foreground text-sm">{activeMessageCategory.description}</p>
              </div>
              <Button 
                onClick={() => handleGenerateMessages(activeCategory)}
                disabled={generateMessagesMutation.isPending}
                className="bg-gradient-to-r from-primary to-blue-400 text-white"
              >
                {generateMessagesMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Messages
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Messages */}
      {generatedMessages.length > 0 && (
        <div className="space-y-4">
          {generationContext && (
            <div className="bg-primary/10 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-primary mb-2">Generated for: {generationContext.partnerName}</h4>
              <div className="text-sm text-muted-foreground">
                <p>Personality Type: <span className="font-medium text-primary">{generationContext.personalityType}</span></p>
                <p>Category: <span className="font-medium">{generationContext.category}</span></p>
              </div>
            </div>
          )}

          {generatedMessages.map((message) => (
            <Card key={message.id} className="glass-card hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(message.estimatedImpact)}`}>
                      {message.estimatedImpact} impact
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                      {message.tone}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyMessage(message)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <p className="text-foreground leading-relaxed mb-3">
                  {message.content}
                </p>
                
                <div className="text-xs text-muted-foreground">
                  Tailored for: {message.personalityMatch}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {generatedMessages.length === 0 && !generateMessagesMutation.isPending && (
        <div className="text-center py-12">
          <Wand2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to Generate Messages</h3>
          <p className="text-muted-foreground mb-4">
            Select a category above and click "Generate Messages" to create personalized messages for your partner.
          </p>
        </div>
      )}
    </div>
  );
}