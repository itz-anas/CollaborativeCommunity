import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface AIResponse {
  content: string;
  timestamp: string;
}

export default function AIAssistant() {
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<{
    request: string;
    response: AIResponse | null;
  }[]>([]);

  const aiRequestMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", "/api/ai/assistant", { prompt });
      return await res.json() as AIResponse;
    },
    onSuccess: (data, variables) => {
      setConversations((prev) => {
        // Find the request that is awaiting a response
        const updatedConversations = [...prev];
        const pendingIndex = updatedConversations.findIndex(
          (conv) => conv.request === variables && conv.response === null
        );
        
        if (pendingIndex !== -1) {
          updatedConversations[pendingIndex].response = data;
        }
        
        return updatedConversations;
      });
    }
  });

  const handleSendPrompt = (predefinedPrompt?: string) => {
    const promptText = predefinedPrompt || input;
    if (!promptText.trim() || aiRequestMutation.isPending) return;
    
    // Add new conversation with pending response
    setConversations((prev) => [
      ...prev,
      { request: promptText, response: null }
    ]);
    
    // Clear input if it was a custom input
    if (!predefinedPrompt) {
      setInput("");
    }
    
    // Send request to AI
    aiRequestMutation.mutate(promptText);
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-purple-50">
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <path d="M2 12h20" />
            <path d="M2 16h20" />
            <path d="M2 20h20" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900">AI Assistant</h3>
      </div>
      
      {conversations.length > 0 && (
        <ScrollArea className="h-40 mb-3 border rounded-lg bg-white">
          <div className="p-3 space-y-3">
            {conversations.map((conv, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">{conv.request}</div>
                    <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center mr-2 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8V4H8" />
                      <rect x="2" y="2" width="20" height="8" rx="2" />
                      <path d="M2 12h20" />
                      <path d="M2 16h20" />
                      <path d="M2 20h20" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    {conv.response ? (
                      <>
                        <div className="text-sm whitespace-pre-wrap">{conv.response.content}</div>
                        <div className="text-xs text-gray-500">{new Date(conv.response.timestamp).toLocaleTimeString()}</div>
                      </>
                    ) : (
                      <div className="flex items-center text-sm text-gray-500">
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        <span>Generating response...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <Textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="resize-none text-sm"
            disabled={aiRequestMutation.isPending}
          />
          <Button 
            onClick={() => handleSendPrompt()}
            disabled={input.trim() === "" || aiRequestMutation.isPending}
            className="flex-shrink-0"
          >
            {aiRequestMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </Button>
        </div>
        
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full justify-between text-left font-normal text-gray-700"
            onClick={() => handleSendPrompt("Summarize this conversation")}
            disabled={aiRequestMutation.isPending}
          >
            <span>Summarize this conversation</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="w-full justify-between text-left font-normal text-gray-700"
            onClick={() => handleSendPrompt("Generate meeting agenda from this chat")}
            disabled={aiRequestMutation.isPending}
          >
            <span>Generate meeting agenda</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="w-full justify-between text-left font-normal text-gray-700"
            onClick={() => handleSendPrompt("Create a task list from this conversation")}
            disabled={aiRequestMutation.isPending}
          >
            <span>Create task list from chat</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
