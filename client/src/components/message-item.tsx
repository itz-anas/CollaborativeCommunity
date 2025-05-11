import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageWithUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { MoreHorizontal, Copy, Reply, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessageItemProps {
  message: MessageWithUser;
  isCurrentUser: boolean;
}

export default function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/messages/${message.id}`, undefined);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups', message.groupId, 'messages'] });
      toast({
        title: "Message deleted",
        description: "Your message has been deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Copy message to clipboard
  const copyMessage = () => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: "Copied to clipboard",
      description: "Message content copied to clipboard",
    });
  };
  
  // Format timestamp
  const formatTimestamp = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  // Handle delete message
  const handleDeleteMessage = () => {
    if (isCurrentUser) {
      deleteMessageMutation.mutate();
    }
  };
  
  // Get message bubble class based on user and AI status
  const getMessageBubbleClass = () => {
    if (message.isAI) {
      return "bg-purple-100 border border-purple-200 rounded-lg p-3";
    } else if (isCurrentUser) {
      return "bg-primary p-3 rounded-lg text-white message-bubble-user";
    } else {
      return "bg-gray-100 p-3 rounded-lg message-bubble-other";
    }
  };
  
  return (
    <div className={`flex items-start ${isCurrentUser ? 'justify-end' : ''}`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
          <AvatarFallback className={message.isAI ? "bg-purple-500 text-white" : ""}>
            {message.isAI ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8" />
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <path d="M2 12h20" />
                <path d="M2 16h20" />
                <path d="M2 20h20" />
              </svg>
            ) : (
              getInitials(message.user.displayName)
            )}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex-1 max-w-2xl ${isCurrentUser ? 'text-right' : ''}`}>
        <div className={`flex items-baseline ${isCurrentUser ? 'justify-end' : ''}`}>
          {!isCurrentUser && (
            <span className="font-medium text-sm text-gray-900 mr-2">
              {message.isAI ? "AI Assistant" : message.user.displayName}
            </span>
          )}
          <span className={`text-xs ${isCurrentUser ? 'text-gray-200 mr-2' : 'text-gray-500 ml-2'}`}>
            {formatTimestamp(message.createdAt)}
          </span>
          {isCurrentUser && (
            <span className="font-medium text-sm text-gray-900">You</span>
          )}
        </div>
        
        <div className="flex items-start mt-1">
          <div className={`${getMessageBubbleClass()} ${isCurrentUser ? 'ml-auto' : ''}`}>
            <p className={`text-sm ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
              {message.content}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
              <DropdownMenuItem onClick={copyMessage}>
                <Copy className="h-4 w-4 mr-2" />
                <span>Copy message</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Reply className="h-4 w-4 mr-2" />
                <span>Reply</span>
              </DropdownMenuItem>
              {isCurrentUser && (
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={handleDeleteMessage}
                  disabled={deleteMessageMutation.isPending}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  <span>{deleteMessageMutation.isPending ? "Deleting..." : "Delete message"}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {message.isAI && (
          <div className="mt-1 flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              className="text-xs px-3 py-1 rounded-full border border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Yes, generate summary
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              No thanks
            </Button>
          </div>
        )}
      </div>
      
      {isCurrentUser && (
        <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
          <AvatarFallback className="bg-primary-100 text-primary-700">
            {user ? getInitials(user.displayName) : "U"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
