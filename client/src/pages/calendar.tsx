import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Clock, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { CalendarProviders } from "@/components/calendar-providers";



export default function Calendar() {
  const [, setLocation] = useLocation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showProviders, setShowProviders] = useState(false);
  const userId = localStorage.getItem("userId");

  type UIEvent = { id: number; title: string; eventType: string; startTime: string; location: string | null; description: string | null };
  const { data: events = [], isLoading } = useQuery<UIEvent[]>({
    queryKey: [`/api/events/user/${userId}`],
    enabled: !!userId,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === 0) return "Today";
    if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
    return formatDate(dateString);
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'date': return 'bg-pink-500';
      case 'activity': return 'bg-green-500';
      case 'special': return 'bg-purple-500';
      case 'reminder': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Simple calendar grid generation
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 min-h-screen pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Relationship Calendar</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowProviders(!showProviders)}
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          {showProviders ? 'Hide' : 'Connect'} Calendar
        </Button>
      </div>
      
      {/* Calendar Providers */}
      {showProviders && (
        <div className="mb-6">
          {userId && (
            <CalendarProviders 
              userId={userId} 
              onProviderConnected={() => setShowProviders(false)}
            />
          )}
        </div>
      )}
      
      {/* Calendar Header */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{monthYear}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="control-btn p-2 rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="control-btn p-2 rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
          
          {/* Mini Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-muted-foreground py-2 font-medium">{day}</div>
            ))}
            
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const hasEvent = events.some((event) => 
                new Date(event.startTime).toDateString() === day.toDateString()
              );
              
              return (
                <div
                  key={index}
                  className={`py-2 ${
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  } ${isToday ? 'bg-primary text-white rounded-full' : ''} ${
                    hasEvent && !isToday ? 'bg-success text-white rounded-full' : ''
                  }`}
                >
                  {day.getDate()}
                </div>
              );
            })}
          </div>
      </div>
      
      {/* Upcoming Events */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {isLoading ? (
            <div className="glass-card rounded-2xl p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-3 bg-white/10 rounded mb-1"></div>
                <div className="h-3 bg-white/10 rounded w-3/4"></div>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-60" />
              <p className="text-muted-foreground text-lg font-medium mb-2">No Upcoming Events</p>
              <p className="text-muted-foreground text-sm">Start planning your next date by adding an event below</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 ${getEventTypeColor(event.eventType)} rounded-full mr-3 shadow-lg`}></div>
                    <span className="font-semibold">{event.title}</span>
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">{getRelativeDate(event.startTime)}</span>
                </div>
                <p className="text-muted-foreground text-sm mb-2">
                  {formatDate(event.startTime)} at {formatTime(event.startTime)}
                </p>
                {event.location && (
                  <p className="text-muted-foreground text-sm mb-2">📍 {event.location}</p>
                )}
                {event.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed">{event.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      
    </div>
  );
}
