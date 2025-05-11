import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import { insertGroupSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

// Create a custom schema extending the insert schema
const createGroupSchema = insertGroupSchema
  .omit({ inviteCode: true, ownerId: true, createdAt: true })
  .extend({
    isPublic: z.boolean().default(false),
    initialMembers: z.string().optional(),
  });

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const [location, navigate] = useLocation();
  const [avatarInitial, setAvatarInitial] = useState("");
  const { sendMessage } = useWebSocket();
  const { toast } = useToast();

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      avatar: "",
      isPublic: false,
      initialMembers: "",
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (values: CreateGroupFormValues) => {
      const { initialMembers, ...groupData } = values;
      const formData = {
        ...groupData,
        initialMemberEmails: initialMembers ? initialMembers.split(",").map(email => email.trim()) : [],
      };
      const res = await apiRequest("POST", "/api/groups", formData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      navigate(`/group/${data.id}`);
      onOpenChange(false);
      form.reset();
      setAvatarInitial("");
      
      toast({
        title: "Group created successfully",
        description: `${data.name} has been created`,
      });
      
      // Notify others via WebSocket
      sendMessage("GROUP_CREATED", {
        groupId: data.id,
        name: data.name
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: CreateGroupFormValues) {
    createGroupMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a new group to collaborate with your team members.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Marketing Team" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        setAvatarInitial(getInitials(e.target.value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What's this group about?" 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Avatar</FormLabel>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-2xl bg-gray-100 text-gray-400">
                        {avatarInitial}
                      </AvatarFallback>
                    </Avatar>
                    <Button type="button" variant="outline" onClick={() => {}}>
                      Upload Image
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Privacy</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "true")}
                      defaultValue={field.value ? "true" : "false"}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="private-group" />
                        <Label htmlFor="private-group">Private - Only invited members can join</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="public-group" />
                        <Label htmlFor="public-group">Public - Anyone in the organization can join</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="initialMembers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add Members (optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                      <Input 
                        className="pl-10" 
                        placeholder="Enter email addresses separated by commas" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
