import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Share2, MessageSquare, MapPin, Clock } from "lucide-react";

interface RecommendationCardProps {
  recommendation: {
    id: number;
    type: string;
    category: string;
    content: string;
    priority: string;
    personalityMatch: string;
  };
  onCopyMessage: (message: string) => void;
}

export function RecommendationCard({ recommendation, onCopyMessage }: RecommendationCardProps) {
  const getIcon = () => {
    switch (recommendation.type) {
      case "message":
        return MessageSquare;
      case "activity":
        return MapPin;
      case "reminder":
        return Clock;
      default:
        return MessageSquare;
    }
  };

  const getIconColor = () => {
    switch (recommendation.priority) {
      case "high":
        return "bg-gradient-to-br from-primary to-blue-400";
      case "medium":
        return "bg-gradient-to-br from-success to-green-400";
      case "low":
        return "bg-gradient-to-br from-warning to-yellow-400";
      default:
        return "bg-gradient-to-br from-primary to-blue-400";
    }
  };

  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case "high":
        return "text-primary";
      case "medium":
        return "text-success";
      case "low":
        return "text-warning";
      default:
        return "text-primary";
    }
  };

  const getActionLabel = () => {
    switch (recommendation.type) {
      case "message":
        return "Copy Message";
      case "activity":
        return "Schedule Date";
      case "reminder":
        return "Set Reminder";
      default:
        return "Copy Message";
    }
  };

  const IconComponent = getIcon();

  return (
    <Card className="recommendation-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`w-8 h-8 ${getIconColor()} rounded-full flex items-center justify-center mr-3`}>
              <IconComponent className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm capitalize">{recommendation.category.replace('_', ' ')}</h3>
              <p className="text-muted-foreground text-xs">Recommended for {recommendation.personalityMatch}</p>
            </div>
          </div>
          <span className={`text-xs ${getPriorityColor()} capitalize`}>{recommendation.priority} Priority</span>
        </div>
        <p className="text-muted-foreground text-sm mb-3">{recommendation.content}</p>
        <div className="flex space-x-2">
          <Button
            onClick={() => onCopyMessage(recommendation.content)}
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            size="sm"
          >
            {getActionLabel()}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-4 py-2 bg-muted"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
