import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  avatar: text("avatar"),
  ownerId: integer("owner_id").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").default("member").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  isAI: boolean("is_ai").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").notNull(),
  lastEditedBy: integer("last_edited_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),
  data: text("data").notNull(), // Base64 encoded for in-memory storage
  uploadedBy: integer("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  entityId: integer("entity_id"),
  entityType: text("entity_type"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true });
export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true });

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Select types
export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type File = typeof files.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

// Extended types for client use
export interface UserWithoutPassword extends Omit<User, 'password'> {}
export interface MessageWithUser extends Message {
  user: UserWithoutPassword;
}
export interface GroupWithMemberCount extends Group {
  memberCount: number;
  unreadCount?: number;
}
export interface DocumentWithUsers extends Document {
  creator: UserWithoutPassword;
  lastEditor: UserWithoutPassword;
  collaborators: UserWithoutPassword[];
}
export interface FileWithUser extends File {
  uploader: UserWithoutPassword;
}

// WebSocket message types
export type WebSocketMessageType = 
  | 'NEW_MESSAGE'
  | 'MESSAGE_READ'
  | 'NEW_DOCUMENT'
  | 'DOCUMENT_UPDATED'
  | 'NEW_FILE'
  | 'USER_JOINED'
  | 'USER_LEFT'
  | 'GROUP_CREATED'
  | 'GROUP_UPDATED'
  | 'NOTIFICATION';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}

// Login form type
export type LoginData = Pick<InsertUser, "username" | "password">;
