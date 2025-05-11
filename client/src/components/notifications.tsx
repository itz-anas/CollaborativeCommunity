import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Notification } from "@shared/schema";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-mobile";

export default function Notifications() {
  const [location, navigate] = useLocation();
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const [open, setOpen] = useState(false);
  
  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });
  
  // Get unread count
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  
  // Mark all as read
  const markAllAsRead = async () => {
    await apiRequest("POST", "/api/notifications/mark-all-read", {});
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await apiRequest("POST", `/api/notifications/${notification.id}/mark-read`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
    
    // Navigate based on notification type and entity
    if (notification.entityType === "group" && notification.entityId) {
      navigate(`/group/${notification.entityId}`);
    } else if (notification.entityType === "document" && notification.entityId) {
      navigate(`/document/${notification.entityId}`);
    }
    
    // Close the popover/sheet
    setOpen(false);
  };
  
  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>;
      case "document":
        return <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>;
      case "file":
        return <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        </div>;
      case "user":
        return <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>;
      case "ai":
        return <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <path d="M2 12h20" />
            <path d="M2 16h20" />
            <path d="M2 20h20" />
          </svg>
        </div>;
      default:
        return <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>;
    }
  };
  
  // Render notification content based on device
  const renderNotificationContent = () => (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Notifications</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={markAllAsRead}
        >
          Mark all as read
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <p>No notifications yet</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0 ml-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{notification.content.split(':')[0]}</p>
                    {!notification.isRead && (
                      <Badge variant="default" className="ml-2">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {notification.content.includes(':') 
                      ? notification.content.split(':').slice(1).join(':').trim() 
                      : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      )}
      
      <div className="p-4 border-t border-gray-200 text-center">
        <Button variant="link" onClick={() => navigate("/notifications")}>
          View all notifications
        </Button>
      </div>
    </>
  );
  
  return isMobile ? (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        {renderNotificationContent()}
      </SheetContent>
    </Sheet>
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {renderNotificationContent()}
      </PopoverContent>
    </Popover>
  );
}
