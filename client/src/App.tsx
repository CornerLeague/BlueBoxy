import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import Onboarding from "@/pages/onboarding";
import Assessment from "@/pages/assessment";
import Dashboard from "@/pages/dashboard";
import Messages from "@/pages/messages";
import Activities from "@/pages/activities";
import Calendar from "@/pages/calendar";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const showNavigation = !['/', '/assessment'].includes(location);

  return (
    <div className="relative">
      <Switch>
        <Route path="/" component={Onboarding} />
        <Route path="/assessment" component={Assessment} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/messages" component={Messages} />
        <Route path="/activities" component={Activities} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
      {showNavigation && <Navigation />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="mobile-container">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
