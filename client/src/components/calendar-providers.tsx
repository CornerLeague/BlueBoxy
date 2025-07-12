import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Check, Plus, Settings, RefreshCw, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CalendarProvider {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  description: string;
  isConnected: boolean;
  authUrl?: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: string;
  errorMessage?: string;
}

interface CalendarProvidersProps {
  userId: string;
  onProviderConnected?: (provider: CalendarProvider) => void;
}

export function CalendarProviders({ userId, onProviderConnected }: CalendarProvidersProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["/api/calendar/providers", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/calendar/providers?userId=${userId}`);
      return response.json();
    },
    enabled: !!userId,
  });

  const connectMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const response = await apiRequest("POST", `/api/calendar/connect/${providerId}`, { userId });
      return response.json();
    },
    onSuccess: (data, providerId) => {
      if (data.authUrl) {
        // Open OAuth flow in new window
        window.open(data.authUrl, "calendar-auth", "width=600,height=600");
        setConnectingProvider(providerId);
        
        // Listen for OAuth completion
        window.addEventListener("message", handleOAuthComplete);
      } else {
        toast({
          title: "Connected successfully",
          description: "Your calendar has been connected to BlueBoxy.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/calendar/providers", userId] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection failed",
        description: error.message || "Unable to connect to calendar provider.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const response = await apiRequest("POST", `/api/calendar/disconnect/${providerId}`, { userId });
      return response.json();
    },
    onSuccess: (data, providerId) => {
      toast({
        title: "Disconnected",
        description: "Calendar has been disconnected from BlueBoxy.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/providers", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection failed",
        description: error.message || "Unable to disconnect calendar provider.",
        variant: "destructive",
      });
    },
  });

  const handleOAuthComplete = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === "calendar-auth-success") {
      setConnectingProvider(null);
      window.removeEventListener("message", handleOAuthComplete);
      
      toast({
        title: "Connected successfully",
        description: "Your calendar has been connected to BlueBoxy.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/providers", userId] });
      
      if (onProviderConnected) {
        onProviderConnected(event.data.provider);
      }
    } else if (event.data.type === "calendar-auth-error") {
      setConnectingProvider(null);
      window.removeEventListener("message", handleOAuthComplete);
      
      toast({
        title: "Connection failed",
        description: event.data.error || "Authentication was cancelled or failed.",
        variant: "destructive",
      });
    }
  };

  const handleConnect = (provider: CalendarProvider) => {
    connectMutation.mutate(provider.id);
  };

  const handleDisconnect = (provider: CalendarProvider) => {
    disconnectMutation.mutate(provider.id);
  };

  const getProviderIcon = (provider: CalendarProvider) => {
    switch (provider.id) {
      case 'google':
        return '🔍';
      case 'outlook':
        return '📅';
      case 'apple':
        return '🍎';
      case 'yahoo':
        return '🌐';
      default:
        return '📅';
    }
  };

  const getStatusBadge = (provider: CalendarProvider) => {
    switch (provider.status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Calendar Providers</h3>
          <p className="text-sm text-muted-foreground">
            Connect your calendars to automatically sync date events
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/calendar/providers", userId] })}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {providers.map((provider: CalendarProvider) => (
          <Card key={provider.id} className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-white text-lg">
                    {getProviderIcon(provider)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{provider.displayName}</CardTitle>
                    <CardDescription className="text-sm">
                      {provider.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(provider)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {provider.status === 'connected' && provider.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(provider.lastSync).toLocaleString()}
                    </p>
                  )}
                  {provider.status === 'error' && provider.errorMessage && (
                    <p className="text-xs text-red-600">
                      Error: {provider.errorMessage}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {provider.status === 'connected' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(provider)}
                        disabled={disconnectMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* Handle settings */}}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnect(provider)}
                      disabled={connectMutation.isPending || connectingProvider === provider.id}
                      size="sm"
                    >
                      {connectingProvider === provider.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card border-dashed">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium mb-2">Need another calendar?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              We support Google Calendar, Outlook, Apple Calendar, and more
            </p>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Request Provider
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}