import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupWebSocketServer } from "./websocket";
import { setupAIRoutes } from "./ai";
import { randomBytes } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server
  setupWebSocketServer(httpServer);

  // Group routes
  app.get("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const groups = await storage.getGroupsForUser(req.user.id);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { name, description, avatar, isPublic, initialMemberEmails } = req.body;
      
      // Create the group
      const group = await storage.createGroup({
        name,
        description,
        avatar: avatar || "",
        ownerId: req.user.id,
        inviteCode: randomBytes(6).toString('hex'),
        isPublic,
        createdAt: new Date()
      });
      
      // Add initial members if provided
      if (initialMemberEmails && initialMemberEmails.length > 0) {
        for (const email of initialMemberEmails) {
          const user = await storage.getUserByEmail(email);
          if (user) {
            await storage.addGroupMember({
              groupId: group.id,
              userId: user.id,
              role: "member",
              joinedAt: new Date()
            });
            
            // Create notification for the invited user
            await storage.createNotification({
              userId: user.id,
              type: "group",
              content: `You were added to ${group.name}`,
              entityId: group.id,
              entityType: "group",
              isRead: false,
              createdAt: new Date()
            });
          }
        }
      }
      
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getGroupWithMemberCount(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Check if user is a member of the group
      const membership = await storage.getGroupMember(groupId, req.user.id);
      if (!membership && !group.isPublic) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  // Group messages routes
  app.get("/api/groups/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const groupId = parseInt(req.params.id);
      
      // Check if user is a member of the group
      const membership = await storage.getGroupMember(groupId, req.user.id);
      const group = await storage.getGroup(groupId);
      
      if (!membership && (!group || !group.isPublic)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      const messages = await storage.getMessages(groupId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/groups/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const groupId = parseInt(req.params.id);
      
      // Check if user is a member of the group
      const membership = await storage.getGroupMember(groupId, req.user.id);
      const group = await storage.getGroup(groupId);
      
      if (!membership && (!group || !group.isPublic)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      const message = await storage.createMessage({
        groupId,
        userId: req.user.id,
        content: content.trim(),
        isAI: false,
        createdAt: new Date()
      });
      
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Document routes
  app.get("/api/groups/:id/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const groupId = parseInt(req.params.id);
      
      // Check if user is a member of the group
      const membership = await storage.getGroupMember(groupId, req.user.id);
      const group = await storage.getGroup(groupId);
      
      if (!membership && (!group || !group.isPublic)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      const documents = await storage.getDocuments(groupId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/groups/:id/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const groupId = parseInt(req.params.id);
      
      // Check if user is a member of the group
      const membership = await storage.getGroupMember(groupId, req.user.id);
      const group = await storage.getGroup(groupId);
      
      if (!membership && (!group || !group.isPublic)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      const { title, content } = req.body;
      
      if (!title || !title.trim()) {
        return res.status(400).json({ message: "Document title is required" });
      }
      
      const document = await storage.createDocument({
        groupId,
        title: title.trim(),
        content: content || "<p>New document</p>",
        createdBy: req.user.id,
        lastEditedBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user is a member of the group
      const membership = await storage.getGroupMember(document.groupId, req.user.id);
      const group = await storage.getGroup(document.groupId);
      
      if (!membership && (!group || !group.isPublic)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user is a member of the group
      const membership = await storage.getGroupMember(document.groupId, req.user.id);
      const group = await storage.getGroup(document.groupId);
      
      if (!membership && (!group || !group.isPublic)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      const { title, content } = req.body;
      
      if ((!title || !title.trim()) && (!content || !content.trim())) {
        return res.status(400).json({ message: "Title or content is required" });
      }
      
      const updatedDocument = await storage.updateDocument(documentId, {
        title: title?.trim() || document.title,
        content: content?.trim() || document.content,
        lastEditedBy: req.user.id,
        updatedAt: new Date()
      });
      
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // File routes
  app.get("/api/groups/:id/files", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const groupId = parseInt(req.params.id);
      
      // Check if user is a member of the group
      const membership = await storage.getGroupMember(groupId, req.user.id);
      const group = await storage.getGroup(groupId);
      
      if (!membership && (!group || !group.isPublic)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      const files = await storage.getFiles(groupId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/files/upload", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      // In a real implementation, this would use a library like multer to handle file uploads
      // For now, just simulate the file upload process
      const { groupId, name, size, type, data } = req.body;
      
      if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
      }
      
      // Check if user is a member of the group
      const membership = await storage.getGroupMember(parseInt(groupId), req.user.id);
      const group = await storage.getGroup(parseInt(groupId));
      
      if (!membership && (!group || !group.isPublic)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      const file = await storage.createFile({
        groupId: parseInt(groupId),
        name: name || "Untitled File",
        size: size || 0,
        type: type || "application/octet-stream",
        data: data || "",
        uploadedBy: req.user.id,
        createdAt: new Date()
      });
      
      res.status(201).json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/files/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const files = await storage.getRecentFiles(10);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent files" });
    }
  });

  app.get("/api/files/:id/download", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check if user is a member of the group
      const membership = await storage.getGroupMember(file.groupId, req.user.id);
      const group = await storage.getGroup(file.groupId);
      
      if (!membership && (!group || !group.isPublic)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      // In a real implementation, we would stream the file or serve it from storage
      // For now, just return the data as a base64 string
      res.setHeader("Content-Type", file.type);
      res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
      
      // Decode base64 data
      const buffer = Buffer.from(file.data, "base64");
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check if user is a member of the group
      const membership = await storage.getGroupMember(file.groupId, req.user.id);
      const group = await storage.getGroup(file.groupId);
      
      if (!membership && (!group || !group.isPublic)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      // Check if user is the owner of the file or an admin
      if (file.uploadedBy !== req.user.id && membership?.role !== "owner" && membership?.role !== "admin") {
        return res.status(403).json({ message: "You don't have permission to delete this file" });
      }
      
      await storage.deleteFile(fileId);
      res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Message routes
  app.delete("/api/messages/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check if user is the author of the message
      if (message.userId !== req.user.id) {
        // Check if user is admin/owner of the group
        const membership = await storage.getGroupMember(message.groupId, req.user.id);
        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
          return res.status(403).json({ message: "You don't have permission to delete this message" });
        }
      }
      
      await storage.deleteMessage(messageId);
      res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Activity routes
  app.get("/api/activity", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const activity = await storage.getRecentActivity(req.user.id);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const notifications = await storage.getNotificationsForUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  app.post("/api/notifications/:id/mark-read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to access this notification" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // AI routes
  setupAIRoutes(app);
  
  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    if (!req.user.isAdmin) return res.status(403).json({ message: "Not authorized" });
    
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/admin/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    if (!req.user.isAdmin) return res.status(403).json({ message: "Not authorized" });
    
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  return httpServer;
}
