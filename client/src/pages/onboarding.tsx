import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Lightbulb, MessageSquare, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  partnerName: z.string().min(2, "Partner name must be at least 2 characters"),
  relationshipDuration: z.string().min(1, "Please specify relationship duration"),
});

type UserForm = z.infer<typeof userSchema>;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: UserForm) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: (user) => {
      localStorage.setItem("userId", user.id.toString());
      toast({
        title: "Welcome to BlueBoxy!",
        description: "Let's get to know your partner better.",
      });
      setLocation("/assessment");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserForm) => {
    createUserMutation.mutate(data);
  };

  if (step === 1) {
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
          
          <div className="w-full space-y-4">
            <Card className="p-4">
              <CardContent className="flex items-center p-0">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-4">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Personalized Insights</h3>
                  <p className="text-muted-foreground text-sm">AI recommendations based on your partner's personality</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardContent className="flex items-center p-0">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-4">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Thoughtful Messages</h3>
                  <p className="text-muted-foreground text-sm">Perfect words for any situation</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardContent className="flex items-center p-0">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-4">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Activity Suggestions</h3>
                  <p className="text-muted-foreground text-sm">Local recommendations tailored to your relationship</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Button 
          onClick={() => setStep(2)}
          className="w-full bg-gradient-to-r from-primary to-blue-400 text-white py-4 rounded-xl font-semibold text-lg mt-8"
        >
          Get Started
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <button 
          onClick={() => setStep(1)}
          className="mb-4 p-2 rounded-full bg-secondary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 className="text-xl font-semibold">Tell us about yourself</h2>
        <p className="text-muted-foreground mt-2">
          We'll use this information to personalize your experience
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Your Name</Label>
          <Input 
            id="name"
            {...register("name")}
            placeholder="Enter your name"
            className="bg-card border-border"
          />
          {errors.name && <p className="text-sm text-error">{errors.name.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email"
            type="email"
            {...register("email")}
            placeholder="Enter your email"
            className="bg-card border-border"
          />
          {errors.email && <p className="text-sm text-error">{errors.email.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="partnerName">Partner's Name</Label>
          <Input 
            id="partnerName"
            {...register("partnerName")}
            placeholder="Enter your partner's name"
            className="bg-card border-border"
          />
          {errors.partnerName && <p className="text-sm text-error">{errors.partnerName.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="relationshipDuration">How long have you been together?</Label>
          <Input 
            id="relationshipDuration"
            {...register("relationshipDuration")}
            placeholder="e.g., 2 years, 6 months"
            className="bg-card border-border"
          />
          {errors.relationshipDuration && <p className="text-sm text-error">{errors.relationshipDuration.message}</p>}
        </div>
        
        <Button 
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-blue-400 text-white py-4 rounded-xl font-semibold text-lg"
          disabled={createUserMutation.isPending}
        >
          {createUserMutation.isPending ? "Creating Account..." : "Continue"}
        </Button>
      </form>
    </div>
  );
}
