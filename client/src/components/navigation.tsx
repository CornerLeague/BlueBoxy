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
    <nav className="fixed bottom-0 left-0 right-0 glass-card border-t border-white/10 z-50">
      <div className="max-w-md mx-auto flex items-center justify-around py-3 pb-6">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => setLocation(path)}
            className={`nav-item flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
              location === path 
                ? "text-primary bg-primary/10 scale-105" 
                : "text-muted-foreground hover:text-primary/70 hover:bg-[var(--hover-subtle)]"
            }`}
          >
            <Icon className={`w-5 h-5 mb-1 ${location === path ? 'drop-shadow-lg' : ''}`} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
