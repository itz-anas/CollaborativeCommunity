import { Express } from "express";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-api-key-for-development"
});

export function setupAIRoutes(app: Express) {
  // AI Assistant endpoint
  app.post("/api/ai/assistant", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { prompt } = req.body;
      
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Check if we have a valid OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        // Return a mock response if no API key available
        const mockResponse = {
          content: generateMockAIResponse(prompt),
          timestamp: new Date().toISOString()
        };
        return res.json(mockResponse);
      }
      
      // Send request to OpenAI
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for a team collaboration platform. Provide concise, helpful responses. Your name is TeamSync Assistant."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500
      });
      
      const aiMessage = completion.choices[0].message.content;
      
      res.json({
        content: aiMessage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("OpenAI API error:", error);
      res.status(500).json({ 
        message: "Failed to get AI response",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Generate meeting summary
  app.post("/api/ai/summarize", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { groupId, messageIds } = req.body;
      
      if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
      }
      
      // If no messages specified, use all messages in the group
      let messages = [];
      if (messageIds && Array.isArray(messageIds)) {
        // Get specific messages
        messages = await Promise.all(
          messageIds.map(async (id) => {
            const message = await storage.getMessage(id);
            if (message) {
              const user = await storage.getUser(message.userId);
              return {
                sender: user ? user.displayName : "Unknown",
                content: message.content,
                timestamp: message.createdAt
              };
            }
            return null;
          })
        );
        messages = messages.filter(Boolean);
      } else {
        // Get all messages from the group
        const groupMessages = await storage.getMessages(groupId);
        messages = groupMessages.map(message => ({
          sender: message.user.displayName,
          content: message.content,
          timestamp: message.createdAt
        }));
      }
      
      if (messages.length === 0) {
        return res.status(400).json({ message: "No messages found to summarize" });
      }
      
      // Check if we have a valid OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        // Return a mock response if no API key available
        const mockResponse = {
          summary: "This is a summary of the conversation. Key points discussed include team collaboration, project milestones, and next steps for the upcoming deadline.",
          timestamp: new Date().toISOString()
        };
        return res.json(mockResponse);
      }
      
      // Format conversation for OpenAI
      const conversationText = messages
        .map(m => `${m.sender}: ${m.content}`)
        .join("\n");
      
      // Send to OpenAI for summarization
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for a team collaboration platform. Your task is to summarize conversations. Provide a concise summary with key points, action items, and decisions made."
          },
          {
            role: "user",
            content: `Please summarize the following conversation:\n\n${conversationText}`
          }
        ],
        max_tokens: 500
      });
      
      const summary = completion.choices[0].message.content;
      
      res.json({
        summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("OpenAI API error:", error);
      res.status(500).json({ 
        message: "Failed to generate summary",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Generate task list from conversation
  app.post("/api/ai/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { groupId, messageIds } = req.body;
      
      if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
      }
      
      // If no messages specified, use all messages in the group
      let messages = [];
      if (messageIds && Array.isArray(messageIds)) {
        // Get specific messages
        messages = await Promise.all(
          messageIds.map(async (id) => {
            const message = await storage.getMessage(id);
            if (message) {
              const user = await storage.getUser(message.userId);
              return {
                sender: user ? user.displayName : "Unknown",
                content: message.content,
                timestamp: message.createdAt
              };
            }
            return null;
          })
        );
        messages = messages.filter(Boolean);
      } else {
        // Get all messages from the group
        const groupMessages = await storage.getMessages(groupId);
        messages = groupMessages.map(message => ({
          sender: message.user.displayName,
          content: message.content,
          timestamp: message.createdAt
        }));
      }
      
      if (messages.length === 0) {
        return res.status(400).json({ message: "No messages found to extract tasks from" });
      }
      
      // Check if we have a valid OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        // Return a mock response if no API key available
        const mockResponse = {
          tasks: [
            { description: "Complete the project proposal", assignee: "John", dueDate: "2023-12-15" },
            { description: "Review marketing materials", assignee: "Sarah", dueDate: "2023-12-10" },
            { description: "Schedule team meeting", assignee: "Michael", dueDate: "2023-12-05" }
          ],
          timestamp: new Date().toISOString()
        };
        return res.json(mockResponse);
      }
      
      // Format conversation for OpenAI
      const conversationText = messages
        .map(m => `${m.sender}: ${m.content}`)
        .join("\n");
      
      // Send to OpenAI for task extraction
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for a team collaboration platform. Your task is to extract action items and tasks from conversations. For each task, provide a description, assignee if mentioned, and due date if mentioned. Respond with JSON in this format: { tasks: [{ description: string, assignee?: string, dueDate?: string }] }"
          },
          {
            role: "user",
            content: `Please extract tasks and action items from the following conversation:\n\n${conversationText}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });
      
      // Parse the JSON response
      const tasksResponse = JSON.parse(completion.choices[0].message.content);
      
      res.json({
        tasks: tasksResponse.tasks,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("OpenAI API error:", error);
      res.status(500).json({ 
        message: "Failed to extract tasks",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}

// Helper function to generate mock AI responses when no API key is available
function generateMockAIResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  // Check for common prompt patterns
  if (promptLower.includes("summarize") || promptLower.includes("summary")) {
    return "Here's a summary of the conversation: The team discussed project timelines, resource allocation, and upcoming deliverables. Key decisions include moving the deadline to next Friday and assigning the design tasks to the creative team.";
  } else if (promptLower.includes("task") || promptLower.includes("to-do") || promptLower.includes("action item")) {
    return "I've identified the following tasks:\n1. Finalize the project proposal by Friday\n2. Schedule a meeting with stakeholders\n3. Review the design mockups\n4. Update the documentation";
  } else if (promptLower.includes("meet") || promptLower.includes("agenda")) {
    return "Here's a suggested meeting agenda:\n1. Project status update (10 min)\n2. Budget review (15 min)\n3. Timeline adjustments (10 min)\n4. Open discussion (15 min)\n5. Next steps and action items (10 min)";
  } else if (promptLower.includes("hello") || promptLower.includes("hi") || promptLower.includes("hey")) {
    return "Hello! I'm TeamSync Assistant. How can I help you today? I can summarize conversations, create task lists, generate meeting agendas, and more.";
  } else if (promptLower.includes("help") || promptLower.includes("can you")) {
    return "I can help with several tasks:\n- Summarizing conversations\n- Creating task lists from discussions\n- Generating meeting agendas\n- Drafting emails or messages\n- Answering questions about project management\n\nJust let me know what you need!";
  } else {
    return "I understand your query about \"" + prompt.substring(0, 30) + (prompt.length > 30 ? "..." : "") + "\". As an AI assistant, I can help with summarizing conversations, creating task lists, generating meeting agendas, and more. Please let me know if you'd like me to assist with any of these tasks.";
  }
}
