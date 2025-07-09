import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Lightbulb, MessageSquare, MapPin, ArrowRight } from "lucide-react";

export default function GetStarted() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-6 min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center mb-8 animate-float">
          <Heart className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Welcome to BlueBoxy</h1>
        <p className="text-muted-foreground text-lg mb-8 px-4">
          Your AI-powered relationship assistant that helps you become a more thoughtful, attentive partner
        </p>
        
        <div className="w-full space-y-4 mb-8">
          <Card className="p-4">
            <CardContent className="flex items-center p-0">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-4">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Smart Insights</h3>
                <p className="text-muted-foreground text-sm">Get personalized recommendations based on your partner's personality</p>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardContent className="flex items-center p-0">
              <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center mr-4">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Thoughtful Messages</h3>
                <p className="text-muted-foreground text-sm">AI-generated messages that match your partner's communication style</p>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardContent className="flex items-center p-0">
              <div className="w-10 h-10 bg-warning rounded-full flex items-center justify-center mr-4">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Perfect Dates</h3>
                <p className="text-muted-foreground text-sm">Discover activities and locations that align with your partner's interests</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full space-y-4">
          <Button
            onClick={() => setLocation("/login")}
            className="w-full bg-gradient-to-r from-primary to-blue-400 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <p className="text-muted-foreground">
              Have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-semibold"
                onClick={() => setLocation("/login")}
              >
                Login here
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}