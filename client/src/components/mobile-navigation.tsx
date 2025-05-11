import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  LogOut,
  Menu,
  Search,
  Settings,
  HelpCircle,
  Home,
  Users,
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GroupWithMemberCount } from "@shared/schema";
import CreateGroupDialog from "./create-group-dialog";

export default function MobileNavigation() {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Fetch groups
  const { data: groups } = useQuery<GroupWithMemberCount[]>({
    queryKey: ["/api/groups"],
  });

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Handle group click
  const handleGroupClick = (groupId: number) => {
    navigate(`/group/${groupId}`);
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <>
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] max-w-xs p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-primary">TeamSync</h1>
                  <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setIsMenuOpen(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </Button>
                </div>
                
                {/* Mobile user info */}
                <div className="mt-4 flex items-center p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary-100 text-primary-700">
                      {user ? getInitials(user.displayName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user?.displayName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search..." className="pl-10" />
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4 space-y-6">
                <div>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</h2>
                  <ul className="mt-2 space-y-1">
                    <li>
                      <Button
                        variant={isActive("/") ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                          navigate("/");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Home className="h-4 w-4 mr-3" />
                        <span>Dashboard</span>
                      </Button>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Groups</h2>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5"
                      onClick={() => {
                        setIsCreateGroupOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </Button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {!groups || groups.length === 0 ? (
                      <div className="text-center py-2 text-gray-500 text-sm">No groups yet</div>
                    ) : (
                      groups.map((group) => (
                        <li key={group.id}>
                          <Button
                            variant={location === `/group/${group.id}` ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => handleGroupClick(group.id)}
                          >
                            <Avatar className="h-6 w-6 mr-3">
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                {getInitials(group.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="truncate">
                              <span className="truncate">{group.name}</span>
                            </div>
                          </Button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Direct Messages</h2>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </Button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    <li>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        <div className="relative mr-3">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>AW</AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-1 ring-white"></span>
                        </div>
                        <span>Alex Wong</span>
                      </Button>
                    </li>
                    <li>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        <div className="relative mr-3">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>SJ</AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-gray-300 ring-1 ring-white"></span>
                        </div>
                        <span>Sarah Johnson</span>
                      </Button>
                    </li>
                  </ul>
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-gray-200 space-y-1">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-3 text-gray-500" />
                  <span>Settings</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <HelpCircle className="h-4 w-4 mr-3 text-gray-500" />
                  <span>Help & Support</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-3 text-red-600" />
                  <span>{logoutMutation.isPending ? "Signing out..." : "Sign out"}</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <h1 className="text-lg font-bold text-primary">TeamSync</h1>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5" />
          </Button>
          
          <Avatar 
            className="h-8 w-8 cursor-pointer"
            onClick={() => setIsUserMenuOpen(true)}
          >
            <AvatarFallback className="bg-primary-100 text-primary-700">
              {user ? getInitials(user.displayName) : "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {/* Mobile bottom navigation */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="flex justify-around">
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-2"
            onClick={() => navigate("/")}
          >
            <Home className={`h-5 w-5 ${isActive("/") ? "text-primary" : "text-gray-500"}`} />
            <span className={`text-xs mt-1 ${isActive("/") ? "text-primary" : "text-gray-500"}`}>Home</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-2"
            onClick={() => {
              if (groups && groups.length > 0) {
                navigate(`/group/${groups[0].id}`);
              } else {
                setIsCreateGroupOpen(true);
              }
            }}
          >
            <Users className={`h-5 w-5 ${location.startsWith("/group") ? "text-primary" : "text-gray-500"}`} />
            <span className={`text-xs mt-1 ${location.startsWith("/group") ? "text-primary" : "text-gray-500"}`}>Groups</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-2"
            onClick={() => {
              if (groups && groups.length > 0 && groups[0]?.documents && groups[0].documents.length > 0) {
                navigate(`/document/${groups[0].documents[0].id}`);
              }
            }}
          >
            <FileText className={`h-5 w-5 ${location.startsWith("/document") ? "text-primary" : "text-gray-500"}`} />
            <span className={`text-xs mt-1 ${location.startsWith("/document") ? "text-primary" : "text-gray-500"}`}>Documents</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-2"
            onClick={() => setIsNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5 text-gray-500" />
            <span className="text-xs mt-1 text-gray-500">Notifications</span>
          </Button>
        </div>
      </div>
      
      <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen} />
    </>
  );
}
