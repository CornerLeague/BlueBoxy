import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, MessageSquare, MapPin, Calendar, User } from "lucide-react";

export function Navigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/activities", icon: MapPin, label: "Activities" },
    { path: "/calendar", icon: Calendar, label: "Calendar" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Button
            key={path}
            variant="ghost"
            size="sm"
            onClick={() => setLocation(path)}
            className={`flex flex-col items-center p-2 ${
              location === path ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
