import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { MessageWithUser, GroupWithMemberCount, Document, FileWithUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, Info, Upload, UserPlus, Menu, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import Sidebar from "@/components/sidebar";
import MobileNavigation from "@/components/mobile-navigation";
import MessageItem from "@/components/message-item";
import MessageInput from "@/components/message-input";
import AIAssistant from "@/components/ai-assistant";

export default function GroupPage() {
  const [match, params] = useRoute("/group/:id");
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  if (!match || !params.id) {
    navigate("/");
    return null;
  }
  
  const groupId = parseInt(params.id);
  
  // Fetch group info
  const { data: group, isLoading: isLoadingGroup } = useQuery<GroupWithMemberCount>({
    queryKey: ["/api/groups", groupId],
  });
  
  // Fetch group messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/groups", groupId, "messages"],
  });
  
  // Fetch group documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ["/api/groups", groupId, "documents"],
  });
  
  // Fetch group files
  const { data: files, isLoading: isLoadingFiles } = useQuery<FileWithUser[]>({
    queryKey: ["/api/groups", groupId, "files"],
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/messages`, { content });
      return await res.json();
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(
        ["/api/groups", groupId, "messages"], 
        (oldMessages: MessageWithUser[] = []) => [...oldMessages, newMessage]
      );
      
      // Notify other users via WebSocket
      sendMessage("NEW_MESSAGE", {
        groupId,
        messageId: newMessage.id,
        userId: user?.id,
        content: newMessage.content
      });
    }
  });
  
  // Scroll to bottom of messages when new messages are loaded
  useEffect(() => {
    if (messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Handle message submit
  const handleSendMessage = (content: string) => {
    if (content.trim() && user) {
      sendMessageMutation.mutate(content);
    }
  };
  
  if (isLoadingGroup) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Mobile navigation */}
      <MobileNavigation />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Group header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {group ? getInitials(group.name) : "G"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-base font-medium text-gray-900">{group?.name}</h2>
              <p className="text-xs text-gray-500">{group?.memberCount || 0} members</p>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-3">
            <Button variant="ghost" size="icon">
              <UserPlus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            {/* Chat messages area */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "chat" && (
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {/* Date separator */}
                    <div className="flex items-center justify-center">
                      <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                        Today
                      </div>
                    </div>
                    
                    {isLoadingMessages ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                      </div>
                    ) : !messages || messages.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        <p>No messages yet</p>
                        <p className="text-sm mt-1">Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <MessageItem
                          key={message.id}
                          message={message}
                          isCurrentUser={message.userId === user?.id}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
              
              {activeTab === "documents" && (
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-500">Shared Documents</h3>
                      <Button size="sm" variant="default">New Document</Button>
                    </div>
                    
                    {isLoadingDocuments ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                      </div>
                    ) : !documents || documents.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        <p>No documents yet</p>
                        <Button variant="outline" className="mt-4">Create your first document</Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {documents.map((doc) => (
                          <Button
                            key={doc.id}
                            variant="outline"
                            className="flex flex-col items-start justify-start p-4 h-auto"
                            onClick={() => navigate(`/document/${doc.id}`)}
                          >
                            <div className="flex items-start w-full">
                              <div className="h-10 w-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <polyline points="10 9 9 9 8 9" />
                                </svg>
                              </div>
                              <div className="flex-1 text-left">
                                <h4 className="text-sm font-medium text-gray-900">{doc.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  Edited {new Date(doc.updatedAt).toLocaleDateString()}
                                </p>
                                <div className="flex items-center mt-2">
                                  <div className="flex -space-x-1">
                                    <Avatar className="h-5 w-5 border border-white">
                                      <AvatarFallback className="text-[10px] bg-gray-200">
                                        {getInitials("User")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <Avatar className="h-5 w-5 border border-white">
                                      <AvatarFallback className="text-[10px] bg-gray-200">
                                        {getInitials("User")}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <span className="text-xs text-gray-500 ml-2">2 people collaborating</span>
                                </div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
              
              {activeTab === "files" && (
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-500">Shared Files</h3>
                      <Button size="sm" variant="default">Upload File</Button>
                    </div>
                    
                    {isLoadingFiles ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                      </div>
                    ) : !files || files.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        <p>No files yet</p>
                        <Button variant="outline" className="mt-4">Upload your first file</Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {files.map((file) => (
                          <div key={file.id} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="h-10 w-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                <polyline points="13 2 13 9 20 9" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900">{file.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {(file.size / 1024).toFixed(1)} KB • Uploaded by {file.uploader.displayName}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
              
              {activeTab === "people" && (
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-500">Members</h3>
                      <Button size="sm" variant="default">Invite People</Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-white border border-gray-200 rounded-lg">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback className="bg-primary-100 text-primary-700">
                            {user ? getInitials(user.displayName) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <h4 className="text-sm font-medium text-gray-900">{user?.displayName} (You)</h4>
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">Owner</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Sample other members */}
                      <div className="flex items-center p-3 bg-white border border-gray-200 rounded-lg">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback className="bg-gray-200">
                            AW
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">Alex Wong</h4>
                          <p className="text-xs text-gray-500 mt-1">alex.wong@example.com</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center p-3 bg-white border border-gray-200 rounded-lg">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback className="bg-gray-200">
                            SJ
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">Sarah Johnson</h4>
                          <p className="text-xs text-gray-500 mt-1">sarah.johnson@example.com</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
            
            {/* Message input area for chat tab */}
            {activeTab === "chat" && (
              <MessageInput onSendMessage={handleSendMessage} isPending={sendMessageMutation.isPending} />
            )}
          </div>
          
          {/* Group sidebar */}
          <div className="hidden lg:flex flex-col w-80 border-l border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200">
              <Tabs defaultValue="documents" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="documents">Docs</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="people">People</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* AI assistant section */}
            <AIAssistant />
          </div>
        </div>
      </div>
    </div>
  );
}
