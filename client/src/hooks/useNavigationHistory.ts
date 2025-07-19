import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const navigationHistory: string[] = [];

export function useNavigationHistory() {
  const [location, setLocation] = useLocation();
  const previousLocation = useRef<string>("/dashboard");

  useEffect(() => {
    // Track navigation history
    if (navigationHistory.length === 0 || navigationHistory[navigationHistory.length - 1] !== location) {
      if (navigationHistory.length > 0) {
        previousLocation.current = navigationHistory[navigationHistory.length - 1];
      }
      navigationHistory.push(location);
      
      // Keep only last 10 pages to avoid memory issues
      if (navigationHistory.length > 10) {
        navigationHistory.shift();
      }
    }
  }, [location]);

  const goBack = () => {
    if (navigationHistory.length > 1) {
      // Remove current page
      navigationHistory.pop();
      // Get previous page
      const previousPage = navigationHistory[navigationHistory.length - 1] || "/dashboard";
      setLocation(previousPage);
    } else {
      // Default fallback to dashboard
      setLocation("/dashboard");
    }
  };

  return {
    goBack,
    canGoBack: navigationHistory.length > 1,
    previousPage: previousLocation.current
  };
}