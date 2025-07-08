import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Clock, ChevronLeft, ChevronRight } from "lucide-react";

const mockEvents = [
  {
    id: 1,
    title: "Coffee Date at Garden Café",
    description: "Reminder: Ask about her presentation",
    date: "2024-12-14T14:00:00",
    type: "date",
    color: "bg-primary",
  },
  {
    id: 2,
    title: "Golden Gate Park Walk",
    description: "Weather looks perfect for outdoor activities",
    date: "2024-12-20T10:00:00",
    type: "activity",
    color: "bg-success",
  },
  {
    id: 3,
    title: "Christmas Eve Dinner",
    description: "Special romantic dinner planned",
    date: "2024-12-24T19:00:00",
    type: "special",
    color: "bg-warning",
  },
];

export default function Calendar() {
  const [, setLocation] = useLocation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const userId = localStorage.getItem("userId");

  const { data: events = mockEvents } = useQuery({
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
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/dashboard")}
          className="mr-4 p-2 rounded-full bg-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-semibold">Relationship Calendar</h2>
      </div>
      
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
              const hasEvent = events.some((event: any) => 
                new Date(event.date).toDateString() === day.toDateString()
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
          {events.map((event: any) => (
            <div key={event.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`w-3 h-3 ${event.color} rounded-full mr-3 shadow-lg`}></div>
                  <span className="font-semibold">{event.title}</span>
                </div>
                <span className="text-muted-foreground text-sm font-medium">{getRelativeDate(event.date)}</span>
              </div>
              <p className="text-muted-foreground text-sm mb-2">
                {formatDate(event.date)} at {formatTime(event.date)}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">{event.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-gradient-to-r from-primary to-blue-500 text-white p-4 rounded-2xl flex flex-col items-center h-auto shadow-lg transition-all duration-200 hover:shadow-xl">
          <Plus className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">Add Event</span>
        </button>
        
        <button className="control-btn text-foreground p-4 rounded-2xl flex flex-col items-center h-auto">
          <Clock className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">Set Reminder</span>
        </button>
      </div>
    </div>
  );
}
