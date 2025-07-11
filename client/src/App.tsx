import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import GetStarted from "@/pages/get-started";
import Onboarding from "@/pages/onboarding";
import Login from "@/pages/login";
import Assessment from "@/pages/assessment";
import Dashboard from "@/pages/dashboard";
import Messages from "@/pages/messages";
import Activities from "@/pages/activities";
import Calendar from "@/pages/calendar";
import Profile from "@/pages/profile";
import Preferences from "@/pages/preferences";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const showNavigation = !['/', '/onboarding', '/login', '/assessment', '/preferences'].includes(location);

  return (
    <div className="relative">
      <Switch>
        <Route path="/" component={GetStarted} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/login" component={Login} />
        <Route path="/assessment" component={Assessment} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/messages" component={Messages} />
        <Route path="/activities" component={Activities} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/profile" component={Profile} />
        <Route path="/preferences" component={Preferences} />
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
