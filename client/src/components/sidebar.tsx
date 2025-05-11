import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { GroupWithMemberCount } from "@shared/schema";
import { getInitials } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Settings, HelpCircle } from "lucide-react";
import CreateGroupDialog from "./create-group-dialog";
import Notifications from "./notifications";

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
  // Fetch groups
  const { data: groups, isLoading: isLoadingGroups } = useQuery<GroupWithMemberCount[]>({
    queryKey: ["/api/groups"],
  });
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Handle group click
  const handleGroupClick = (groupId: number) => {
    navigate(`/group/${groupId}`);
  };
  
  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary">TeamSync</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-auto h-8 w-8 rounded-full" size="icon">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-100 text-primary-700">
                    {user ? getInitials(user.displayName) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium">{user?.displayName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <DropdownMenuItem onSelect={() => navigate("/profile")}>
                Your Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/settings")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                disabled={logoutMutation.isPending}
                onSelect={handleLogout}
              >
                {logoutMutation.isPending ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." className="pl-10" />
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recently Visited</h2>
          <ul className="mt-2 space-y-1">
            {isLoadingGroups || !groups ? (
              <div className="text-center py-2 text-gray-500 text-sm">Loading...</div>
            ) : groups.length > 0 && (
              groups.slice(0, 3).map((group) => (
                <li key={`recent-${group.id}`}>
                  <Button
                    variant={location === `/group/${group.id}` ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleGroupClick(group.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>{group.name}</span>
                  </Button>
                </li>
              ))
            )}
          </ul>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Groups</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5"
              onClick={() => setIsCreateGroupOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Button>
          </div>
          <ul className="mt-2 space-y-1">
            {isLoadingGroups || !groups ? (
              <div className="text-center py-2 text-gray-500 text-sm">Loading...</div>
            ) : groups.length === 0 ? (
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
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start"
              >
                <div className="relative mr-3">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>MP</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-1 ring-white"></span>
                </div>
                <span>Michael Park</span>
              </Button>
            </li>
          </ul>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-gray-200">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-3 text-gray-500" />
          <span>Settings</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start mt-1">
          <HelpCircle className="h-4 w-4 mr-3 text-gray-500" />
          <span>Help & Support</span>
        </Button>
      </div>
      
      <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen} />
    </aside>
  );
}
