import { WebSocketServer } from "ws";
import { Server } from "http";
import { WebSocketMessage } from "@shared/schema";
import { storage } from "./storage";
import WebSocket from "ws";

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Keep track of connected clients
  const clients: Map<number, WebSocket> = new Map();

  wss.on('connection', (ws, req) => {
    let userId: number | null = null;
    console.log('WebSocket client connected');

    ws.on('message', async (message) => {
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message.toString());
        console.log('Received message:', parsedMessage.type);

        // Handle different message types
        switch (parsedMessage.type) {
          case 'NEW_MESSAGE': {
            const { groupId, messageId, userId: msgUserId } = parsedMessage.payload;
            
            if (msgUserId) {
              userId = msgUserId;
              clients.set(userId, ws);
            }
            
            // Broadcast to all clients in the group except sender
            broadcastToGroup(groupId, parsedMessage, msgUserId);
            
            // Store notification for offline users
            const groupMembers = await storage.getGroupMembers(groupId);
            const sender = await storage.getUser(msgUserId);
            const message = await storage.getMessage(messageId);
            
            if (sender && message) {
              for (const member of groupMembers) {
                if (member.userId !== msgUserId) {
                  // Check if user is online
                  const isOnline = clients.has(member.userId);
                  
                  if (!isOnline) {
                    // Create notification for offline user
                    await storage.createNotification({
                      userId: member.userId,
                      type: "message",
                      content: `New message from ${sender.displayName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
                      entityId: groupId,
                      entityType: "group",
                      isRead: false,
                      createdAt: new Date()
                    });
                  }
                }
              }
            }
            break;
          }
            
          case 'DOCUMENT_UPDATED':
          case 'NEW_DOCUMENT': {
            const { groupId, documentId, userId: docUserId, title } = parsedMessage.payload;
            
            if (docUserId) {
              userId = docUserId;
              clients.set(userId, ws);
            }
            
            // Broadcast to all clients in the group except sender
            broadcastToGroup(groupId, parsedMessage, docUserId);
            
            // Store notification for offline users
            const groupMembers = await storage.getGroupMembers(groupId);
            const sender = await storage.getUser(docUserId);
            
            if (sender) {
              for (const member of groupMembers) {
                if (member.userId !== docUserId) {
                  // Check if user is online
                  const isOnline = clients.has(member.userId);
                  
                  if (!isOnline) {
                    // Create notification for offline user
                    await storage.createNotification({
                      userId: member.userId,
                      type: "document",
                      content: `${parsedMessage.type === 'NEW_DOCUMENT' ? 'New document created' : 'Document updated'}: "${title}" by ${sender.displayName}`,
                      entityId: documentId,
                      entityType: "document",
                      isRead: false,
                      createdAt: new Date()
                    });
                  }
                }
              }
            }
            break;
          }
            
          case 'NEW_FILE': {
            const { groupId, fileId, userId: fileUserId, name } = parsedMessage.payload;
            
            if (fileUserId) {
              userId = fileUserId;
              clients.set(userId, ws);
            }
            
            // Broadcast to all clients in the group except sender
            broadcastToGroup(groupId, parsedMessage, fileUserId);
            
            // Store notification for offline users
            const groupMembers = await storage.getGroupMembers(groupId);
            const sender = await storage.getUser(fileUserId);
            
            if (sender) {
              for (const member of groupMembers) {
                if (member.userId !== fileUserId) {
                  // Check if user is online
                  const isOnline = clients.has(member.userId);
                  
                  if (!isOnline) {
                    // Create notification for offline user
                    await storage.createNotification({
                      userId: member.userId,
                      type: "file",
                      content: `New file uploaded: "${name}" by ${sender.displayName}`,
                      entityId: fileId,
                      entityType: "file",
                      isRead: false,
                      createdAt: new Date()
                    });
                  }
                }
              }
            }
            break;
          }
            
          case 'USER_JOINED':
          case 'USER_LEFT': {
            const { groupId, userId: eventUserId } = parsedMessage.payload;
            
            if (eventUserId) {
              userId = eventUserId;
              clients.set(userId, ws);
            }
            
            // Broadcast to all clients in the group
            broadcastToGroup(groupId, parsedMessage);
            break;
          }
            
          case 'GROUP_CREATED':
          case 'GROUP_UPDATED': {
            // Handled by client-side invalidation
            console.log('Group event, no server action required');
            break;
          }
            
          case 'NOTIFICATION': {
            // This is for direct notifications to specific users
            const { targetUserId } = parsedMessage.payload;
            
            if (targetUserId && clients.has(targetUserId)) {
              const targetWs = clients.get(targetUserId);
              if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify(parsedMessage));
              }
            }
            break;
          }
            
          default:
            console.log('Unknown message type:', parsedMessage.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  // Function to broadcast messages to all clients in a group
  async function broadcastToGroup(groupId: number, message: WebSocketMessage, excludeUserId?: number) {
    try {
      // Get all members of the group
      const members = await storage.getGroupMembers(groupId);
      
      // Send message to all online members except the sender
      for (const member of members) {
        if (excludeUserId && member.userId === excludeUserId) continue;
        
        const client = clients.get(member.userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      }
    } catch (error) {
      console.error('Error broadcasting to group:', error);
    }
  }

  // Heartbeat to keep connections alive
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  console.log('WebSocket server set up');
  return wss;
}
