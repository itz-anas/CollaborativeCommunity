import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { createWebSocketConnection, sendWebSocketMessage } from "@/lib/websocket";
import { WebSocketMessage, UserWithoutPassword } from "@shared/schema";
import { useToast } from "./use-toast";
import { queryClient } from "@/lib/queryClient";

interface WebSocketContextType {
  connected: boolean;
  sendMessage: (type: string, payload: any) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  
  // Get user from query client cache directly to avoid circular dependencies
  const user = queryClient.getQueryData<UserWithoutPassword | null>(["/api/user"]);

  // Setup WebSocket connection when user is authenticated
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Create new WebSocket connection
    const socket = createWebSocketConnection();
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      console.log("WebSocket connected");
    };

    socket.onclose = () => {
      setConnected(false);
      console.log("WebSocket disconnected");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    return () => {
      socket.close();
    };
  }, [user]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log("Received message:", message);

    switch (message.type) {
      case "NEW_MESSAGE":
        // Invalidate messages query for the specific group
        queryClient.invalidateQueries({ queryKey: ['/api/groups', message.payload.groupId, 'messages'] });
        
        // Show notification if message is not from current user
        if (message.payload.userId !== user?.id) {
          toast({
            title: "New message",
            description: `${message.payload.user.displayName}: ${message.payload.content.substring(0, 50)}${message.payload.content.length > 50 ? '...' : ''}`,
          });
        }
        break;
        
      case "NEW_DOCUMENT":
      case "DOCUMENT_UPDATED":
        queryClient.invalidateQueries({ queryKey: ['/api/groups', message.payload.groupId, 'documents'] });
        toast({
          title: message.type === "NEW_DOCUMENT" ? "New document created" : "Document updated",
          description: `"${message.payload.title}" has been ${message.type === "NEW_DOCUMENT" ? "created" : "updated"} by ${message.payload.user.displayName}`,
        });
        break;
        
      case "NEW_FILE":
        queryClient.invalidateQueries({ queryKey: ['/api/groups', message.payload.groupId, 'files'] });
        toast({
          title: "New file uploaded",
          description: `"${message.payload.name}" has been uploaded by ${message.payload.user.displayName}`,
        });
        break;
        
      case "USER_JOINED":
      case "USER_LEFT":
        queryClient.invalidateQueries({ queryKey: ['/api/groups', message.payload.groupId] });
        toast({
          title: message.type === "USER_JOINED" ? "User joined" : "User left",
          description: `${message.payload.user.displayName} has ${message.type === "USER_JOINED" ? "joined" : "left"} the group`,
        });
        break;
        
      case "GROUP_CREATED":
      case "GROUP_UPDATED":
        queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
        break;
        
      case "NOTIFICATION":
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        break;
    }
  };

  const send = (type: string, payload: any) => {
    return sendWebSocketMessage(socketRef.current, type, payload);
  };

  return (
    <WebSocketContext.Provider value={{ connected, sendMessage: send }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
