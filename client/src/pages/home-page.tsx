import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Edit, Upload, UserPlus, Search } from "lucide-react";
import { GroupWithMemberCount, FileWithUser, UserWithoutPassword } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CreateGroupDialog from "@/components/create-group-dialog";
import Sidebar from "@/components/sidebar";
import MobileNavigation from "@/components/mobile-navigation";

import { getInitials } from "@/lib/utils";

export default function HomePage() {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [location, navigate] = useLocation();
  
  // Get user data directly from query client to avoid circular dependencies
  const user = queryClient.getQueryData<UserWithoutPassword | null>(["/api/user"]);

  // Fetch groups
  const { data: groups, isLoading: isLoadingGroups } = useQuery<GroupWithMemberCount[]>({
    queryKey: ["/api/groups"],
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery<any[]>({
    queryKey: ["/api/activity"],
  });

  // Fetch recent files
  const { data: recentFiles, isLoading: isLoadingFiles } = useQuery<FileWithUser[]>({
    queryKey: ["/api/files/recent"],
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "message":
        return <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>;
      case "document":
        return <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>;
      case "file":
        return <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        </div>;
      case "user":
        return <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>;
      default:
        return <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("text") || type.includes("document")) {
      return <div className="h-8 w-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>;
    } else if (type.includes("pdf")) {
      return <div className="h-8 w-8 rounded bg-red-100 text-red-600 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>;
    } else if (type.includes("image")) {
      return <div className="h-8 w-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>;
    } else {
      return <div className="h-8 w-8 rounded bg-gray-100 text-gray-600 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      </div>;
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Mobile navigation */}
      <MobileNavigation />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.displayName || "User"}!</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center p-6 gap-2 bg-primary/5 hover:bg-primary/10"
                        onClick={() => setIsCreateGroupOpen(true)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span className="text-sm font-medium">New Group</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center p-6 gap-2 hover:bg-gray-100"
                      >
                        <Edit className="h-6 w-6" />
                        <span className="text-sm font-medium">New Document</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center p-6 gap-2 hover:bg-gray-100"
                      >
                        <Upload className="h-6 w-6" />
                        <span className="text-sm font-medium">Upload Files</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center p-6 gap-2 hover:bg-gray-100"
                      >
                        <UserPlus className="h-6 w-6" />
                        <span className="text-sm font-medium">Invite People</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity */}
              <div className="col-span-1 md:col-span-2">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <Button variant="link" className="text-sm">View all</Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingActivity ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                      </div>
                    ) : !recentActivity || recentActivity.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <p>No recent activity</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentActivity?.map((activity, index) => (
                          <div key={index} className="flex items-start p-3 rounded-lg hover:bg-gray-50">
                            {getActivityIcon(activity.type)}
                            <div className="flex-1 min-w-0 ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.title}
                              </p>
                              <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                              <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Your Groups */}
              <div className="col-span-1">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg">Your Groups</CardTitle>
                    <Button variant="link" className="text-sm">View all</Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingGroups ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                      </div>
                    ) : !groups || groups.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <p>No groups yet</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsCreateGroupOpen(true)}
                        >
                          Create your first group
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {groups.map((group) => (
                          <Button
                            key={group.id}
                            variant="ghost"
                            className="flex items-center justify-start p-3 w-full rounded-lg hover:bg-gray-50 h-auto"
                            onClick={() => navigate(`/group/${group.id}`)}
                          >
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback className={`bg-blue-100 text-blue-600`}>
                                {getInitials(group.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium text-gray-900">{group.name}</p>
                              <p className="text-xs text-gray-500">
                                {group.memberCount} members
                                {group.unreadCount ? ` • ${group.unreadCount} unread` : ` • No unread messages`}
                              </p>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                    <Button 
                      className="mt-4 w-full" 
                      variant="outline"
                      onClick={() => setIsCreateGroupOpen(true)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Create New Group</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Files */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg">Recent Files</CardTitle>
                    <Button variant="link" className="text-sm">View all</Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingFiles ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                      </div>
                    ) : !recentFiles || recentFiles.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <p>No files have been uploaded yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded by</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                              <th className="px-4 py-3 relative"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentFiles.map((file, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {getFileIcon(file.type)}
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-sm text-gray-700">Marketing Team</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Avatar className="h-6 w-6 mr-2">
                                      <AvatarFallback className="text-xs">
                                        {getInitials(file.uploader.displayName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-gray-700">{file.uploader.displayName}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {new Date(file.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {(file.size / 1024).toFixed(1)} KB
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="1" />
                                      <circle cx="19" cy="12" r="1" />
                                      <circle cx="5" cy="12" r="1" />
                                    </svg>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen} />
    </div>
  );
}
