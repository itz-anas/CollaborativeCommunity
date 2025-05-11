import { 
  users, 
  groups, 
  groupMembers, 
  messages, 
  documents, 
  files, 
  notifications,
  type User, 
  type InsertUser, 
  type Group, 
  type InsertGroup, 
  type GroupMember, 
  type InsertGroupMember, 
  type Message, 
  type InsertMessage, 
  type Document, 
  type InsertDocument, 
  type File, 
  type InsertFile, 
  type Notification, 
  type InsertNotification,
  type GroupWithMemberCount,
  type MessageWithUser,
  type UserWithoutPassword,
  type DocumentWithUsers,
  type FileWithUser
} from "@shared/schema";
import session from "express-session";
import memorystore from "memorystore";
import { randomBytes } from "crypto";

// Create a memory store for session
const MemoryStore = memorystore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Admin methods
  getAllUsers(): Promise<UserWithoutPassword[]>;
  getAllGroups(): Promise<GroupWithMemberCount[]>;
  
  // Group methods
  getGroup(id: number): Promise<Group | undefined>;
  getGroupWithMemberCount(id: number): Promise<GroupWithMemberCount | undefined>;
  getGroupsForUser(userId: number): Promise<GroupWithMemberCount[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined>;
  deleteGroup(id: number): Promise<boolean>;
  
  // Group member methods
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  removeGroupMember(groupId: number, userId: number): Promise<boolean>;
  updateGroupMemberRole(groupId: number, userId: number, role: string): Promise<GroupMember | undefined>;
  
  // Message methods
  getMessages(groupId: number): Promise<MessageWithUser[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<MessageWithUser>;
  updateMessage(id: number, content: string): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
  
  // Document methods
  getDocuments(groupId: number): Promise<Document[]>;
  getDocument(id: number): Promise<DocumentWithUsers | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // File methods
  getFiles(groupId: number): Promise<FileWithUser[]>;
  getFile(id: number): Promise<File | undefined>;
  getRecentFiles(limit?: number): Promise<FileWithUser[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
  
  // Notification methods
  getNotificationsForUser(userId: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  
  // Activity methods
  getRecentActivity(userId: number, limit?: number): Promise<any[]>;
  
  // Session store
  sessionStore: any; // Express session store
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private groupsMap: Map<number, Group>;
  private groupMembersMap: Map<string, GroupMember>; // key: `${groupId}-${userId}`
  private messagesMap: Map<number, Message>;
  private documentsMap: Map<number, Document>;
  private filesMap: Map<number, File>;
  private notificationsMap: Map<number, Notification>;
  
  currentId: { [key: string]: number } = {
    users: 1,
    groups: 1,
    groupMembers: 1,
    messages: 1,
    documents: 1,
    files: 1,
    notifications: 1
  };
  
  sessionStore: any; // Express session store

  constructor() {
    this.usersMap = new Map();
    this.groupsMap = new Map();
    this.groupMembersMap = new Map();
    this.messagesMap = new Map();
    this.documentsMap = new Map();
    this.filesMap = new Map();
    this.notificationsMap = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  // Group methods
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groupsMap.get(id);
  }
  
  async getGroupWithMemberCount(id: number): Promise<GroupWithMemberCount | undefined> {
    const group = this.groupsMap.get(id);
    if (!group) return undefined;
    
    const members = Array.from(this.groupMembersMap.values()).filter(
      (member) => member.groupId === id
    );
    
    return {
      ...group,
      memberCount: members.length
    };
  }
  
  async getGroupsForUser(userId: number): Promise<GroupWithMemberCount[]> {
    // Get all groups the user is a member of
    const userMemberships = Array.from(this.groupMembersMap.values()).filter(
      (member) => member.userId === userId
    );
    
    const groupIds = userMemberships.map(member => member.groupId);
    
    // Get the actual groups with member counts
    const groups: GroupWithMemberCount[] = [];
    for (const groupId of groupIds) {
      const group = this.groupsMap.get(groupId);
      if (group) {
        const memberCount = Array.from(this.groupMembersMap.values()).filter(
          (member) => member.groupId === groupId
        ).length;
        
        // Get unread message count for this group
        const unreadCount = 0; // In a real app, this would be calculated based on last read timestamp
        
        groups.push({
          ...group,
          memberCount,
          unreadCount
        });
      }
    }
    
    return groups;
  }
  
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.currentId.groups++;
    const now = new Date();
    
    // Generate a random invite code
    const inviteCode = randomBytes(6).toString('hex');
    
    const group: Group = {
      ...insertGroup,
      id,
      inviteCode,
      createdAt: now
    };
    
    this.groupsMap.set(id, group);
    
    // Add the owner as a member automatically
    await this.addGroupMember({
      groupId: id,
      userId: insertGroup.ownerId,
      role: 'owner',
      joinedAt: now
    });
    
    return group;
  }
  
  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined> {
    const group = this.groupsMap.get(id);
    if (!group) return undefined;
    
    const updatedGroup = { ...group, ...groupData };
    this.groupsMap.set(id, updatedGroup);
    return updatedGroup;
  }
  
  async deleteGroup(id: number): Promise<boolean> {
    if (!this.groupsMap.has(id)) return false;
    
    // Delete the group
    this.groupsMap.delete(id);
    
    // Delete all members
    for (const [key, member] of this.groupMembersMap.entries()) {
      if (member.groupId === id) {
        this.groupMembersMap.delete(key);
      }
    }
    
    // Delete all messages in the group
    for (const [messageId, message] of this.messagesMap.entries()) {
      if (message.groupId === id) {
        this.messagesMap.delete(messageId);
      }
    }
    
    // Delete all documents in the group
    for (const [docId, doc] of this.documentsMap.entries()) {
      if (doc.groupId === id) {
        this.documentsMap.delete(docId);
      }
    }
    
    // Delete all files in the group
    for (const [fileId, file] of this.filesMap.entries()) {
      if (file.groupId === id) {
        this.filesMap.delete(fileId);
      }
    }
    
    return true;
  }
  
  // Group member methods
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembersMap.values()).filter(
      (member) => member.groupId === groupId
    );
  }
  
  async getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined> {
    return this.groupMembersMap.get(`${groupId}-${userId}`);
  }
  
  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const id = this.currentId.groupMembers++;
    
    const groupMember: GroupMember = {
      ...member,
      id
    };
    
    this.groupMembersMap.set(`${member.groupId}-${member.userId}`, groupMember);
    return groupMember;
  }
  
  async removeGroupMember(groupId: number, userId: number): Promise<boolean> {
    const key = `${groupId}-${userId}`;
    if (!this.groupMembersMap.has(key)) return false;
    
    this.groupMembersMap.delete(key);
    return true;
  }
  
  async updateGroupMemberRole(groupId: number, userId: number, role: string): Promise<GroupMember | undefined> {
    const key = `${groupId}-${userId}`;
    const member = this.groupMembersMap.get(key);
    if (!member) return undefined;
    
    const updatedMember = { ...member, role };
    this.groupMembersMap.set(key, updatedMember);
    return updatedMember;
  }
  
  // Message methods
  async getMessages(groupId: number): Promise<MessageWithUser[]> {
    const messages = Array.from(this.messagesMap.values())
      .filter((message) => message.groupId === groupId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Fetch user data for each message
    const messagesWithUsers: MessageWithUser[] = await Promise.all(
      messages.map(async (message) => {
        const user = await this.getUser(message.userId);
        return {
          ...message,
          user: user ? this.stripPassword(user) : {
            id: 0,
            username: "deleted",
            displayName: "Deleted User",
            email: "",
            createdAt: new Date()
          }
        };
      })
    );
    
    return messagesWithUsers;
  }
  
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messagesMap.get(id);
  }
  
  async createMessage(message: InsertMessage): Promise<MessageWithUser> {
    const id = this.currentId.messages++;
    const now = new Date();
    
    const newMessage: Message = {
      ...message,
      id,
      createdAt: now
    };
    
    this.messagesMap.set(id, newMessage);
    
    // Get user data for the message
    const user = await this.getUser(message.userId);
    return {
      ...newMessage,
      user: user ? this.stripPassword(user) : {
        id: 0,
        username: "deleted",
        displayName: "Deleted User",
        email: "",
        createdAt: new Date()
      }
    };
  }
  
  async updateMessage(id: number, content: string): Promise<Message | undefined> {
    const message = this.messagesMap.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, content };
    this.messagesMap.set(id, updatedMessage);
    return updatedMessage;
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    if (!this.messagesMap.has(id)) return false;
    
    this.messagesMap.delete(id);
    return true;
  }
  
  // Document methods
  async getDocuments(groupId: number): Promise<Document[]> {
    return Array.from(this.documentsMap.values())
      .filter((doc) => doc.groupId === groupId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  
  async getDocument(id: number): Promise<DocumentWithUsers | undefined> {
    const document = this.documentsMap.get(id);
    if (!document) return undefined;
    
    // Get creator and last editor
    const creator = await this.getUser(document.createdBy);
    const lastEditor = await this.getUser(document.lastEditedBy);
    
    // Get all collaborators (members of the group)
    const groupMembers = await this.getGroupMembers(document.groupId);
    const collaborators: UserWithoutPassword[] = await Promise.all(
      groupMembers.map(async (member) => {
        const user = await this.getUser(member.userId);
        return user ? this.stripPassword(user) : {
          id: 0,
          username: "deleted",
          displayName: "Deleted User",
          email: "",
          createdAt: new Date()
        };
      })
    );
    
    return {
      ...document,
      creator: creator ? this.stripPassword(creator) : {
        id: 0,
        username: "deleted",
        displayName: "Deleted User",
        email: "",
        createdAt: new Date()
      },
      lastEditor: lastEditor ? this.stripPassword(lastEditor) : {
        id: 0,
        username: "deleted",
        displayName: "Deleted User",
        email: "",
        createdAt: new Date()
      },
      collaborators
    };
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.currentId.documents++;
    const now = new Date();
    
    const newDocument: Document = {
      ...document,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.documentsMap.set(id, newDocument);
    return newDocument;
  }
  
  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const document = this.documentsMap.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { 
      ...document, 
      ...documentData,
      updatedAt: new Date() 
    };
    this.documentsMap.set(id, updatedDocument);
    return updatedDocument;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    if (!this.documentsMap.has(id)) return false;
    
    this.documentsMap.delete(id);
    return true;
  }
  
  // File methods
  async getFiles(groupId: number): Promise<FileWithUser[]> {
    const files = Array.from(this.filesMap.values())
      .filter((file) => file.groupId === groupId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return await Promise.all(files.map(async (file) => {
      const uploader = await this.getUser(file.uploadedBy);
      return {
        ...file,
        uploader: uploader ? this.stripPassword(uploader) : {
          id: 0,
          username: "deleted",
          displayName: "Deleted User",
          email: "",
          createdAt: new Date()
        }
      };
    }));
  }
  
  async getFile(id: number): Promise<File | undefined> {
    return this.filesMap.get(id);
  }
  
  async getRecentFiles(limit: number = 10): Promise<FileWithUser[]> {
    const files = Array.from(this.filesMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    return await Promise.all(files.map(async (file) => {
      const uploader = await this.getUser(file.uploadedBy);
      return {
        ...file,
        uploader: uploader ? this.stripPassword(uploader) : {
          id: 0,
          username: "deleted",
          displayName: "Deleted User",
          email: "",
          createdAt: new Date()
        }
      };
    }));
  }
  
  async createFile(file: InsertFile): Promise<File> {
    const id = this.currentId.files++;
    const now = new Date();
    
    const newFile: File = {
      ...file,
      id,
      createdAt: now
    };
    
    this.filesMap.set(id, newFile);
    return newFile;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    if (!this.filesMap.has(id)) return false;
    
    this.filesMap.delete(id);
    return true;
  }
  
  // Notification methods
  async getNotificationsForUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notificationsMap.get(id);
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.currentId.notifications++;
    const now = new Date();
    
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: now
    };
    
    this.notificationsMap.set(id, newNotification);
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notificationsMap.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notificationsMap.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notificationsMap.entries())
      .filter(([_, notification]) => notification.userId === userId && !notification.isRead);
    
    for (const [id, notification] of userNotifications) {
      this.notificationsMap.set(id, { ...notification, isRead: true });
    }
    
    return true;
  }
  
  // Activity methods
  async getRecentActivity(userId: number, limit: number = 10): Promise<any[]> {
    // First get all groups the user is a member of
    const userGroups = await this.getGroupsForUser(userId);
    const groupIds = userGroups.map(g => g.id);
    
    // Collect activity data: messages, documents, files
    const recentMessages = Array.from(this.messagesMap.values())
      .filter(message => groupIds.includes(message.groupId) && message.userId !== userId)
      .map(async message => {
        const user = await this.getUser(message.userId);
        const group = await this.getGroup(message.groupId);
        return {
          type: 'message',
          title: `New message in ${group?.name || 'Unknown Group'}`,
          description: `${user?.displayName || 'Unknown User'}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
          time: message.createdAt,
          groupId: message.groupId,
          userId: message.userId
        };
      });
    
    const recentDocuments = Array.from(this.documentsMap.values())
      .filter(doc => groupIds.includes(doc.groupId) && doc.lastEditedBy !== userId)
      .map(async doc => {
        const user = await this.getUser(doc.lastEditedBy);
        const group = await this.getGroup(doc.groupId);
        return {
          type: 'document',
          title: `Document updated in ${group?.name || 'Unknown Group'}`,
          description: `${user?.displayName || 'Unknown User'} updated "${doc.title}"`,
          time: doc.updatedAt,
          groupId: doc.groupId,
          userId: doc.lastEditedBy
        };
      });
    
    const recentFiles = Array.from(this.filesMap.values())
      .filter(file => groupIds.includes(file.groupId) && file.uploadedBy !== userId)
      .map(async file => {
        const user = await this.getUser(file.uploadedBy);
        const group = await this.getGroup(file.groupId);
        return {
          type: 'file',
          title: `New file in ${group?.name || 'Unknown Group'}`,
          description: `${user?.displayName || 'Unknown User'} uploaded "${file.name}"`,
          time: file.createdAt,
          groupId: file.groupId,
          userId: file.uploadedBy
        };
      });
    
    // Combine and sort all activities
    const allActivities = await Promise.all([
      ...recentMessages,
      ...recentDocuments,
      ...recentFiles
    ]);
    
    return allActivities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, limit);
  }
  
  // Admin methods
  async getAllUsers(): Promise<UserWithoutPassword[]> {
    // Return all users without passwords
    return Array.from(this.usersMap.values()).map(user => this.stripPassword(user));
  }
  
  async getAllGroups(): Promise<GroupWithMemberCount[]> {
    // Return all groups with member counts
    const groups = Array.from(this.groupsMap.values());
    
    return Promise.all(
      groups.map(async group => {
        const members = await this.getGroupMembers(group.id);
        return {
          ...group,
          memberCount: members.length,
        };
      })
    );
  }
  
  // Helper method to remove password from user object
  private stripPassword(user: User): UserWithoutPassword {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const storage = new MemStorage();
