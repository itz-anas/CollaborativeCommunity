import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Document, UserWithoutPassword } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, UserPlus, MoreHorizontal, ChevronLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

import DocumentEditor from "@/components/document-editor";
import AIAssistant from "@/components/ai-assistant";

export default function DocumentPage() {
  const [match, params] = useRoute("/document/:id");
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [isEditing, setIsEditing] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  
  if (!match || !params.id) {
    navigate("/");
    return null;
  }
  
  const documentId = parseInt(params.id);
  
  // Fetch document
  const { data: document, isLoading: isLoadingDocument } = useQuery<Document & {
    creator: UserWithoutPassword;
    lastEditor: UserWithoutPassword;
    collaborators: UserWithoutPassword[];
    groupId: number;
  }>({
    queryKey: ["/api/documents", documentId],
    onSuccess: (data) => {
      setDocumentTitle(data.title);
      setDocumentContent(data.content);
    }
  });
  
  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const res = await apiRequest("PATCH", `/api/documents/${documentId}`, { 
        title,
        content,
      });
      return await res.json();
    },
    onSuccess: (updatedDocument) => {
      queryClient.setQueryData(["/api/documents", documentId], updatedDocument);
      
      // Notify other users via WebSocket
      sendMessage("DOCUMENT_UPDATED", {
        documentId,
        groupId: document?.groupId,
        userId: user?.id,
        title: updatedDocument.title
      });
      
      setIsEditing(false);
    }
  });
  
  const handleSaveDocument = () => {
    if (documentTitle.trim() && documentContent.trim()) {
      updateDocumentMutation.mutate({
        title: documentTitle,
        content: documentContent
      });
    }
  };
  
  if (isLoadingDocument) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Document header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => document ? navigate(`/group/${document.groupId}`) : navigate("/")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center flex-1">
          <div className="h-8 w-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          {isEditing ? (
            <Input 
              value={documentTitle} 
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="border-none focus-visible:ring-0 font-medium text-gray-900" 
            />
          ) : (
            <h2 className="font-medium text-gray-900">{document?.title}</h2>
          )}
        </div>
        <div className="ml-auto flex items-center space-x-3">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setDocumentTitle(document?.title || "");
                  setDocumentContent(document?.content || "");
                }}
                disabled={updateDocumentMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleSaveDocument}
                disabled={updateDocumentMutation.isPending}
              >
                {updateDocumentMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon">
                <UserPlus className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-white p-6">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {/* Document meta info */}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Edited {document && new Date(document.updatedAt).toLocaleString()} by {document?.lastEditor.displayName}</span>
                <span>•</span>
                <div className="flex -space-x-1">
                  {document?.collaborators.map((collaborator, index) => (
                    <Avatar key={index} className="h-6 w-6 border-2 border-white">
                      <AvatarFallback className="text-xs">
                        {getInitials(collaborator.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Document content */}
              {isEditing ? (
                <DocumentEditor 
                  content={documentContent} 
                  onChange={setDocumentContent} 
                />
              ) : (
                <div className="border-t border-gray-200 pt-6">
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: document?.content || "" }} />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Document sidebar with AI assistant */}
        <div className="hidden lg:flex flex-col w-80 border-l border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Document Insights</h3>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <h4 className="text-sm font-medium text-blue-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Overview
                </h4>
                <p className="mt-1 text-sm text-blue-700">
                  This document was created on {document && new Date(document.createdAt).toLocaleDateString()} 
                  and last updated on {document && new Date(document.updatedAt).toLocaleDateString()}.
                </p>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contributors</h4>
                <ul className="mt-2 space-y-2">
                  {document?.collaborators.map((collaborator, index) => (
                    <li key={index} className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-xs">
                          {getInitials(collaborator.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {collaborator.displayName}
                          {collaborator.id === document.lastEditedBy && " (Last edited)"}
                        </p>
                        <p className="text-xs text-gray-500">{collaborator.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</h4>
                <div className="mt-2 space-y-3">
                  <div className="flex items-start">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className="text-xs">
                        {document?.lastEditor ? getInitials(document.lastEditor.displayName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900">
                        {document?.lastEditor.displayName} edited <span className="font-medium">the document</span>
                      </p>
                      <p className="text-xs text-gray-500">{document && new Date(document.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className="text-xs">
                        {document?.creator ? getInitials(document.creator.displayName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900">
                        {document?.creator.displayName} created the document
                      </p>
                      <p className="text-xs text-gray-500">{document && new Date(document.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">To-Do List</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="task-1" />
                    <label htmlFor="task-1" className="text-sm text-gray-700 leading-none pt-0.5">
                      Review document before Monday meeting
                    </label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="task-2" checked />
                    <label htmlFor="task-2" className="text-sm text-gray-700 leading-none pt-0.5 line-through">
                      Share document with team members
                    </label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="task-3" />
                    <label htmlFor="task-3" className="text-sm text-gray-700 leading-none pt-0.5">
                      Incorporate feedback from Sarah
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comments</h4>
                <div className="mt-2 space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-xs">AW</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm text-gray-900">Alex Wong</span>
                      <span className="ml-2 text-xs text-gray-500">Yesterday</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">
                      Can we add more details to the objectives section?
                    </p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className="text-xs">
                        {user ? getInitials(user.displayName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Input placeholder="Add a comment..." className="text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          {/* AI assistant section */}
          <AIAssistant />
        </div>
      </div>
    </div>
  );
}
