import { useState, useEffect } from "react";
import { AdminNavigation } from "@/components/admin-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Upload, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  VideoIcon, 
  Image as ImageIcon,
  Star,
  StarOff,
  UserPlus,
  Users,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckSquare,
  Square,
  MoreHorizontal,
  X,
  Tag,
  MessageSquare,
  Clock,
  Settings,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";

interface MediaUploadFormData {
  title: string;
  tags: string;
  isFeatured: boolean;
  showInPortfolio: boolean;
  projectStage: string;
  notes: string;
  clientId: string;
  file: FileList;
  posterFile?: FileList;
}

interface MediaEditFormData {
  title: string;
  tags: string;
  isFeatured: boolean;
  showInPortfolio: boolean;
  projectStage: string;
  notes: string;
  clientId: string;
}

export default function AdminMedia() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [location] = useLocation();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedMediaForEdit, setSelectedMediaForEdit] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [clientFilter, setClientFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMediaForFeedback, setSelectedMediaForFeedback] = useState<any>(null);
  const [feedbackVideoRef, setFeedbackVideoRef] = useState<HTMLVideoElement | null>(null);
  const [activeTab, setActiveTab] = useState("feedback");
  // Removed old client search query state

  // Check URL parameters to auto-open upload dialog
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upload') === 'true') {
      setIsUploadDialogOpen(true);
      // Clean up URL without refresh
      window.history.replaceState({}, '', '/admin/media');
    }
  }, [location]);

  const { data: media, isLoading: mediaLoading } = useQuery({
    queryKey: ["/api/media"],
  });

  // Get all client users for assignment
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Get all feedback and timeline notes for admin view
  const { data: allFeedback } = useQuery({
    queryKey: ["/api/admin/media/feedback"],
  });

  const { data: allTimelineNotes } = useQuery({
    queryKey: ["/api/admin/media/timeline-notes"],
  });

  const uploadForm = useForm<MediaUploadFormData>({
    defaultValues: {
      title: "",
      tags: "",
      isFeatured: false,
      showInPortfolio: true,
      projectStage: "",
      notes: "",
      clientId: "",
    },
  });

  const editForm = useForm<MediaEditFormData>({
    defaultValues: {
      title: "",
      tags: "",
      isFeatured: false,
      showInPortfolio: true,
      projectStage: "",
      notes: "",
      clientId: "",
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async (data: MediaUploadFormData) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("projectStage", data.projectStage);
      formData.append("notes", data.notes);
      formData.append("clientId", data.clientId === "none" ? "" : data.clientId);
      formData.append("tags", data.tags);
      formData.append("isFeatured", data.isFeatured.toString());
      formData.append("showInPortfolio", data.showInPortfolio.toString());
      formData.append("file", data.file[0]);
      
      // Add poster file if provided (for videos)
      if (data.posterFile && data.posterFile[0]) {
        formData.append("posterFile", data.posterFile[0]);
      }

      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Upload failed");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/portfolio"] });
      toast({
        title: "Media uploaded",
        description: "Your media has been successfully uploaded.",
      });
      setIsUploadDialogOpen(false);
      uploadForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editMediaMutation = useMutation({
    mutationFn: async (data: MediaEditFormData) => {
      if (!selectedMediaForEdit) {
        throw new Error("No media selected for editing");
      }

      const updateData = {
        title: data.title,
        projectStage: data.projectStage === "none" ? null : data.projectStage || null,
        notes: data.notes || null,
        clientId: data.clientId === "none" ? null : data.clientId || null,
        tags: data.tags ? data.tags.split(",").map((tag: string) => tag.trim()) : [],
        isFeatured: data.isFeatured,
        showInPortfolio: data.showInPortfolio,
      };

      const res = await apiRequest("PUT", `/api/media/${selectedMediaForEdit.id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/portfolio"] });
      toast({
        title: "Media updated",
        description: "Your media has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setSelectedMediaForEdit(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      await apiRequest("DELETE", `/api/media/${mediaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/portfolio"] });
      toast({
        title: "Media deleted",
        description: "Media has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete media",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ mediaId, isFeatured }: { mediaId: string; isFeatured: boolean }) => {
      const res = await apiRequest("PUT", `/api/media/${mediaId}`, { isFeatured });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/featured"] });
      toast({
        title: "Media updated",
        description: "Featured status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update media",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePortfolioMutation = useMutation({
    mutationFn: async ({ mediaId, showInPortfolio }: { mediaId: string; showInPortfolio: boolean }) => {
      const res = await apiRequest("PUT", `/api/media/${mediaId}`, { showInPortfolio });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/portfolio"] });
      toast({
        title: "Media updated",
        description: "Portfolio visibility has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update media",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk operations mutations
  const bulkUpdateFeaturedMutation = useMutation({
    mutationFn: async ({ mediaIds, isFeatured }: { mediaIds: string[]; isFeatured: boolean }) => {
      await Promise.all(mediaIds.map(id => 
        apiRequest("PUT", `/api/media/${id}`, { isFeatured })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/featured"] });
      setSelectedItems(new Set());
      toast({
        title: "Bulk update completed",
        description: "Featured status updated for selected items.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkUpdatePortfolioMutation = useMutation({
    mutationFn: async ({ mediaIds, showInPortfolio }: { mediaIds: string[]; showInPortfolio: boolean }) => {
      await Promise.all(mediaIds.map(id => 
        apiRequest("PUT", `/api/media/${id}`, { showInPortfolio })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/portfolio"] });
      setSelectedItems(new Set());
      toast({
        title: "Bulk update completed",
        description: "Portfolio visibility updated for selected items.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkAssignClientMutation = useMutation({
    mutationFn: async ({ mediaIds, clientId }: { mediaIds: string[]; clientId: string }) => {
      await Promise.all(mediaIds.map(id => 
        apiRequest("PUT", `/api/media/${id}`, { clientId: clientId === "none" ? null : clientId })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      setSelectedItems(new Set());
      toast({
        title: "Bulk assignment completed",
        description: "Client assignment updated for selected items.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk assignment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkUpdateTagsMutation = useMutation({
    mutationFn: async ({ mediaIds, tags, action }: { mediaIds: string[]; tags: string; action: 'add' | 'replace' | 'remove' }) => {
      const updates = mediaIds.map(async (id) => {
        const mediaItem = (media as any[])?.find(m => m.id === id);
        if (!mediaItem) return;

        let newTags = mediaItem.tags || [];
        const tagsToProcess = tags.split(',').map(t => t.trim()).filter(Boolean);

        if (action === 'add') {
          newTags = [...new Set([...newTags, ...tagsToProcess])];
        } else if (action === 'replace') {
          newTags = tagsToProcess;
        } else if (action === 'remove') {
          newTags = newTags.filter((tag: string) => !tagsToProcess.includes(tag));
        }

        return apiRequest("PUT", `/api/media/${id}`, { tags: newTags });
      });

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      setSelectedItems(new Set());
      toast({
        title: "Bulk tags update completed",
        description: "Tags updated for selected items.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk tags update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // New multi-client assignment mutations using REST endpoints
  const addClientToMediaMutation = useMutation({
    mutationFn: async ({ mediaId, clientId }: { mediaId: string; clientId: string }) => {
      await apiRequest("POST", `/api/media/${mediaId}/clients/${clientId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Client Added",
        description: "Client successfully assigned to media",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign client to media",
        variant: "destructive",
      });
    },
  });

  const removeClientFromMediaMutation = useMutation({
    mutationFn: async ({ mediaId, clientId }: { mediaId: string; clientId: string }) => {
      await apiRequest("DELETE", `/api/media/${mediaId}/clients/${clientId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Client Removed", 
        description: "Client successfully removed from media",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Removal Failed",
        description: "Failed to remove client from media",
        variant: "destructive",
      });
    },
  });

  const onUploadMedia = (data: MediaUploadFormData) => {
    if (!data.file?.[0]) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    uploadMediaMutation.mutate(data);
  };

  const handleEditMedia = (mediaItem: any) => {
    setSelectedMediaForEdit(mediaItem);
    
    // Populate the edit form with current media data
    editForm.reset({
      title: mediaItem.title || "",
      tags: mediaItem.tags ? mediaItem.tags.join(", ") : "",
      isFeatured: mediaItem.isFeatured || false,
      showInPortfolio: mediaItem.showInPortfolio !== false, // Default to true
      projectStage: mediaItem.projectStage || "none",
      notes: mediaItem.notes || "",
      clientId: mediaItem.clientId || "none",
    });
    
    setIsEditDialogOpen(true);
  };

  const onEditMedia = (data: MediaEditFormData) => {
    editMediaMutation.mutate(data);
  };

  const handleDeleteMedia = (mediaId: string) => {
    if (confirm("Are you sure you want to delete this media?")) {
      deleteMediaMutation.mutate(mediaId);
    }
  };

  const handleToggleFeatured = (mediaId: string, currentStatus: boolean) => {
    toggleFeaturedMutation.mutate({
      mediaId,
      isFeatured: !currentStatus,
    });
  }

  const handleTogglePortfolio = (mediaId: string, currentStatus: boolean) => {
    togglePortfolioMutation.mutate({
      mediaId,
      showInPortfolio: !currentStatus,
    });
  };

  // Old assignment dialog function removed - now using Assign tab in media management dialog

  const [selectedClientForAssignment, setSelectedClientForAssignment] = useState<string>("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  // Removed old unused state variables

  // Old assignment function removed

  // Note: This function is now replaced by the new multi-client assignment interface

  // Old single-client assignment system removed - now using multi-client REST endpoints

  // Add mutation for updating media details in feedback modal
  const updateMediaDetailsMutation = useMutation({
    mutationFn: async ({ mediaId, updates }: { mediaId: string; updates: any }) => {
      return apiRequest("PUT", `/api/media/${mediaId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: "Media details updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: "Failed to update media details",
        variant: "destructive",
      });
    },
  });

  // Add mutation for updating media settings
  const updateMediaSettingsMutation = useMutation({
    mutationFn: async ({ mediaId, updates }: { mediaId: string; updates: any }) => {
      return apiRequest("PUT", `/api/media/${mediaId}`, updates);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      
      // Update the selectedMediaForFeedback with new values to reflect changes
      if (selectedMediaForFeedback) {
        const updatedMedia = { ...selectedMediaForFeedback, ...variables.updates };
        setSelectedMediaForFeedback(updatedMedia);
      }
      
      toast({
        title: "Success",
        description: "Media settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update media settings", 
        variant: "destructive",
      });
    },
  });

  // Handler for saving changes in Edit tab
  const handleSaveChanges = () => {
    if (!selectedMediaForFeedback) return;

    const titleInput = document.querySelector('#feedback-edit-title') as HTMLInputElement;
    const tagsInput = document.querySelector('#feedback-edit-tags') as HTMLInputElement;
    const notesTextarea = document.querySelector('#feedback-edit-notes') as HTMLTextAreaElement;

    const updates: any = {};
    
    if (titleInput?.value && titleInput.value !== selectedMediaForFeedback.title) {
      updates.title = titleInput.value;
    }
    if (tagsInput?.value) {
      const tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
      if (JSON.stringify(tags) !== JSON.stringify(selectedMediaForFeedback.tags || [])) {
        updates.tags = tags;
      }
    }
    if (notesTextarea?.value !== selectedMediaForFeedback.notes) {
      updates.notes = notesTextarea.value || '';
    }

    if (Object.keys(updates).length > 0) {
      updateMediaDetailsMutation.mutate({
        mediaId: selectedMediaForFeedback.id,
        updates,
      });
    } else {
      toast({
        title: "No changes to save",
        description: "No modifications were detected",
      });
    }
  };

  // State for tracking switch values in Settings tab
  const [feedbackModalFeatured, setFeedbackModalFeatured] = useState<boolean>(false);
  const [feedbackModalPortfolio, setFeedbackModalPortfolio] = useState<boolean>(false);

  // Update switch states when modal opens
  useEffect(() => {
    if (selectedMediaForFeedback) {
      setFeedbackModalFeatured(selectedMediaForFeedback.isFeatured || false);
      setFeedbackModalPortfolio(selectedMediaForFeedback.showInPortfolio || false);
    }
  }, [selectedMediaForFeedback]);

  // Handler for saving settings in Settings tab
  const handleSaveSettings = () => {
    if (!selectedMediaForFeedback) return;

    const updates: any = {};
    
    if (feedbackModalFeatured !== selectedMediaForFeedback.isFeatured) {
      updates.isFeatured = feedbackModalFeatured;
    }
    if (feedbackModalPortfolio !== selectedMediaForFeedback.showInPortfolio) {
      updates.showInPortfolio = feedbackModalPortfolio;
    }

    if (Object.keys(updates).length > 0) {
      updateMediaSettingsMutation.mutate({
        mediaId: selectedMediaForFeedback.id,
        updates,
      });
    } else {
      toast({
        title: "No changes to save",
        description: "No settings modifications were detected",
      });
    }
  };

  // Helper functions
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAllFiltered = () => {
    if (!Array.isArray(filteredMedia)) return;
    const filteredIds = filteredMedia.map((item: any) => item.id);
    setSelectedItems(new Set(filteredIds));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const isAllFilteredSelected = () => {
    if (!Array.isArray(filteredMedia)) return false;
    const filteredIds = filteredMedia.map((item: any) => item.id);
    return filteredIds.length > 0 && filteredIds.every((id: string) => selectedItems.has(id));
  };

  // Get unique values for filter options
  const getUniqueClients = () => {
    // Get all clients that have media assigned to them using the assignedClients array
    const assignedClientIds = [...new Set((media as any[])?.flatMap(m => 
      (m.assignedClients || []).map((client: any) => client.id)
    ).filter(Boolean))];
    return (clients as any[])?.filter(c => assignedClientIds.includes(c.id)) || [];
  };

  const getUniqueTags = () => {
    const allTags = (media as any[])?.flatMap(m => m.tags || []) || [];
    return [...new Set(allTags)].sort();
  };

  const getUniqueStages = () => {
    const stages = [...new Set((media as any[])?.map(m => m.projectStage).filter(Boolean))];
    return stages.sort();
  };

  const filteredMedia = Array.isArray(media) ? media.filter((item: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = item.title?.toLowerCase().includes(query);
      const matchesTags = item.tags?.some((tag: string) => tag.toLowerCase().includes(query));
      const matchesStage = item.projectStage?.toLowerCase().includes(query);
      const matchesNotes = item.notes?.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesTags && !matchesStage && !matchesNotes) {
        return false;
      }
    }

    // Type filter
    if (filter !== "all") {
      if (filter === "featured") {
        if (!item.isFeatured) return false;
      } else if (filter === "portfolio") {
        if (!item.showInPortfolio) return false;
      } else if (item.type !== filter) {
        return false;
      }
    }

    // Client filter - updated to use assignedClients array
    if (clientFilter !== "all") {
      const assignedClients = item.assignedClients || [];
      if (clientFilter === "unassigned") {
        if (assignedClients.length > 0) return false;
      } else {
        const isAssignedToClient = assignedClients.some((client: any) => client.id === clientFilter);
        if (!isAssignedToClient) return false;
      }
    }

    // Tag filter
    if (tagFilter !== "all") {
      if (!item.tags?.includes(tagFilter)) return false;
    }

    // Stage filter
    if (stageFilter !== "all") {
      if (item.projectStage !== stageFilter) return false;
    }

    return true;
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <AdminNavigation />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Media Management</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Upload, organize, and manage your media content
              </p>
              {selectedItems.size > 0 && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              {/* Bulk Actions */}
              {selectedItems.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBulkActionsOpen(true)}
                  >
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Bulk Actions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>
              )}
              
              {hasPermission('upload:media') && (
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Media
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload New Media</DialogTitle>
                </DialogHeader>
                <form onSubmit={uploadForm.handleSubmit(onUploadMedia)} className="space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="file">Media File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept="image/*,video/*"
                      {...uploadForm.register("file", { required: "Please select a file" })}
                    />
                    <p className="text-sm text-gray-500">
                      Supported formats: JPG, PNG, GIF, MP4, MOV, AVI, MKV (Max 500MB)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="posterFile">Poster Frame (Optional)</Label>
                    <Input
                      id="posterFile"
                      type="file"
                      accept="image/*"
                      {...uploadForm.register("posterFile")}
                    />
                    <p className="text-sm text-gray-500">
                      Upload a custom poster/thumbnail for videos
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      {...uploadForm.register("title", { required: "Title is required" })}
                      placeholder="Enter media title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectStage">Project Stage</Label>
                    <Select 
                      onValueChange={(value) => uploadForm.setValue("projectStage", value)}
                      defaultValue={uploadForm.watch("projectStage")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project stage..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concept">Concept</SelectItem>
                        <SelectItem value="pre-production">Pre-Production</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="post-production">Post-Production</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientId">Assign to Client (Optional)</Label>
                    <Select 
                      onValueChange={(value) => uploadForm.setValue("clientId", value)}
                      defaultValue={uploadForm.watch("clientId")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No client assignment</SelectItem>
                        {Array.isArray(clients) && clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.username} ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      {...uploadForm.register("notes")}
                      placeholder="Add project notes, client feedback, or production details..."
                      className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      {...uploadForm.register("tags")}
                      placeholder="Enter tags separated by commas"
                    />
                    <p className="text-sm text-gray-500">
                      e.g., commercial, corporate, documentary, wedding
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      {...uploadForm.register("isFeatured")}
                    />
                    <Label htmlFor="featured">Featured content</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showInPortfolio"
                      {...uploadForm.register("showInPortfolio")}
                    />
                    <Label htmlFor="showInPortfolio">Show in portfolio</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsUploadDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="btn-primary"
                      disabled={uploadMediaMutation.isPending}
                    >
                      {uploadMediaMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
              )}

            {/* Edit Media Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Media</DialogTitle>
                </DialogHeader>
                <form onSubmit={editForm.handleSubmit(onEditMedia)} className="space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      {...editForm.register("title", { required: "Title is required" })}
                      placeholder="Enter media title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-projectStage">Project Stage</Label>
                    <Select 
                      onValueChange={(value) => editForm.setValue("projectStage", value)}
                      value={editForm.watch("projectStage")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project stage..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No stage</SelectItem>
                        <SelectItem value="concept">Concept</SelectItem>
                        <SelectItem value="pre-production">Pre-Production</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="post-production">Post-Production</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-clientId">Assign to Client (Optional)</Label>
                    <Select 
                      onValueChange={(value) => editForm.setValue("clientId", value)}
                      value={editForm.watch("clientId")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No client assignment</SelectItem>
                        {Array.isArray(clients) && clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.username} ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <textarea
                      id="edit-notes"
                      {...editForm.register("notes")}
                      placeholder="Add project notes, client feedback, or production details..."
                      className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-tags">Tags</Label>
                    <Input
                      id="edit-tags"
                      {...editForm.register("tags")}
                      placeholder="Enter tags separated by commas"
                    />
                    <p className="text-sm text-gray-500">
                      e.g., commercial, corporate, documentary, wedding
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-featured"
                      checked={editForm.watch("isFeatured")}
                      onCheckedChange={(checked) => editForm.setValue("isFeatured", checked)}
                    />
                    <Label htmlFor="edit-featured">Featured content</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-showInPortfolio"
                      checked={editForm.watch("showInPortfolio")}
                      onCheckedChange={(checked) => editForm.setValue("showInPortfolio", checked)}
                    />
                    <Label htmlFor="edit-showInPortfolio">Show in portfolio</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setSelectedMediaForEdit(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="btn-primary"
                      disabled={editMediaMutation.isPending}
                    >
                      {editMediaMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>


            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search media by title, tags, stage, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-3">
              {/* Type Filter */}
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="glass-nav bg-white/10 dark:bg-black/30 border border-white/20 backdrop-blur-md">
                  <SelectItem value="all" className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]">All Types</SelectItem>
                  <SelectItem value="featured" className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]">Featured</SelectItem>
                  <SelectItem value="portfolio" className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]">Portfolio</SelectItem>
                  <SelectItem value="image" className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]">Images</SelectItem>
                  <SelectItem value="video" className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]">Videos</SelectItem>
                </SelectContent>
              </Select>

              {/* Client Filter */}
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent className="glass-nav bg-white/10 dark:bg-black/30 border border-white/20 backdrop-blur-md">
                  <SelectItem value="all" className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]">All Clients</SelectItem>
                  <SelectItem value="unassigned" className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]">Unassigned</SelectItem>
                  {getUniqueClients().map((client: any) => (
                    <SelectItem key={client.id} value={client.id} className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]">
                      {client.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tag Filter */}
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent className="glass-nav bg-white/10 dark:bg-black/30 border border-white/20 backdrop-blur-md">
                  <SelectItem value="all" className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]">All Tags</SelectItem>
                  {getUniqueTags().map((tag: string) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stage Filter */}
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {getUniqueStages().map((stage: string) => (
                    <SelectItem key={stage} value={stage}>
                      {stage.replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(filter !== "all" || clientFilter !== "all" || tagFilter !== "all" || stageFilter !== "all" || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilter("all");
                    setClientFilter("all");
                    setTagFilter("all");
                    setStageFilter("all");
                    setSearchQuery("");
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Selection Controls */}
            {filteredMedia?.length > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isAllFilteredSelected() ? clearSelection : selectAllFiltered}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {isAllFilteredSelected() ? "Deselect All" : `Select All (${filteredMedia.length})`}
                </Button>
                
                {selectedItems.size > 0 && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {selectedItems.size} of {filteredMedia.length} selected
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mediaLoading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredMedia?.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No media found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Upload your first media file to get started.
                </p>
                {hasPermission('upload:media') && (
                  <Button onClick={() => setIsUploadDialogOpen(true)} className="btn-primary">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Media
                  </Button>
                )}
              </div>
            ) : (
              filteredMedia?.map((item: any) => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedMediaForFeedback(item);
                    setActiveTab("feedback");
                    setShowFeedbackModal(true);
                  }}
                >
                  <div className="relative aspect-video">
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          toggleItemSelection(item.id);
                        }}
                        className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 rounded-full"
                      >
                        {selectedItems.has(item.id) ? (
                          <CheckSquare className="h-4 w-4 text-white" />
                        ) : (
                          <Square className="h-4 w-4 text-white" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Options Dropdown */}
                    <div className="absolute top-2 right-2 z-50">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-black/70 hover:bg-black/90 rounded-full shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-48 glass-nav bg-white/10 dark:bg-black/30 border border-white/20 backdrop-blur-md"
                        >
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setSelectedMediaForFeedback(item);
                              setActiveTab("feedback");
                              setShowFeedbackModal(true);
                            }}
                            className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            View Feedback
                          </DropdownMenuItem>
                          {hasPermission('edit:media') && (
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setSelectedMediaForFeedback(item);
                                setActiveTab("edit");
                                setShowFeedbackModal(true);
                              }}
                              className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Media
                            </DropdownMenuItem>
                          )}
                          {hasPermission('assign:client') && (
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setSelectedMediaForFeedback(item);
                                setActiveTab("assign");
                                setShowFeedbackModal(true);
                              }}
                              className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign Client
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setSelectedMediaForFeedback(item);
                              setActiveTab("settings");
                              setShowFeedbackModal(true);
                            }}
                            className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Media Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/20" />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (confirm('Are you sure you want to delete this media item?')) {
                                deleteMediaMutation.mutate(item.id);
                              }
                            }}
                            className="hover:bg-red-600 focus:bg-red-600 text-red-500 hover:text-white focus:text-white"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Media
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', item.url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <video
                        src={item.url}
                        poster={item.posterUrl}
                        className="w-full h-full object-cover"
                        muted
                        onError={(e) => {
                          console.error('Video failed to load:', item.url);
                        }}
                        onLoadedMetadata={(e) => {
                          // Set to 2 seconds for thumbnail if no poster
                          if (!item.posterUrl) {
                            const video = e.target as HTMLVideoElement;
                            video.currentTime = 2;
                          }
                        }}
                      />
                    )}

                    
                    {/* Feedback and Timeline Notes Indicators */}
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      {(() => {
                        const feedbackCount = Array.isArray(allFeedback) ? allFeedback.filter((f: any) => f.mediaId === item.id).length : 0;
                        const notesCount = Array.isArray(allTimelineNotes) ? allTimelineNotes.filter((n: any) => n.mediaId === item.id).length : 0;
                        
                        return (
                          <>
                            {feedbackCount > 0 && (
                              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                                <MessageSquare className="h-3 w-3" />
                                {feedbackCount}
                              </div>
                            )}
                            {notesCount > 0 && (
                              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                <Clock className="h-3 w-3" />
                                {notesCount}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* New Client Feedback Alert - Large overlay indicator */}
                    {(() => {
                      const feedbackCount = Array.isArray(allFeedback) ? allFeedback.filter((f: any) => f.mediaId === item.id).length : 0;
                      if (feedbackCount > 0) {
                        return (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600/90 text-white px-3 py-2 rounded-lg shadow-xl border-2 border-blue-300 animate-pulse">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <MessageSquare className="h-4 w-4" />
                              {feedbackCount} Client Review{feedbackCount > 1 ? 's' : ''}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {/* Project Stage Badge */}
                    {item.projectStage && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="outline" className="text-xs bg-black/70 text-white border-white/30">
                          {item.projectStage.replace('-', ' ')}
                        </Badge>
                      </div>
                    )}

                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold truncate flex-1 mr-2">{item.title}</h3>
                      <div className="flex gap-1 flex-shrink-0">
                        {item.isFeatured && (
                          <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {item.showInPortfolio && (
                          <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700">
                            <Eye className="h-3 w-3 mr-1" />
                            Portfolio
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Client Assignment and Feedback Status */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.assignedClients && item.assignedClients.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {item.assignedClients.length} Client{item.assignedClients.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {(() => {
                        const feedbackCount = Array.isArray(allFeedback) ? allFeedback.filter((f: any) => f.mediaId === item.id).length : 0;
                        const notesCount = Array.isArray(allTimelineNotes) ? allTimelineNotes.filter((n: any) => n.mediaId === item.id).length : 0;
                        
                        if (feedbackCount > 0) {
                          return (
                            <Badge className="text-xs bg-blue-600 hover:bg-blue-700 text-white animate-pulse">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {feedbackCount} Review{feedbackCount > 1 ? 's' : ''}
                            </Badge>
                          );
                        }
                        
                        if (notesCount > 0) {
                          return (
                            <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                              <Clock className="h-3 w-3 mr-1" />
                              {notesCount} Note{notesCount > 1 ? 's' : ''}
                            </Badge>
                          );
                        }
                        
                        return null;
                      })()}
                    </div>
                    
                    {/* Notes Preview */}
                    {item.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {item.notes}
                      </p>
                    )}
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {item.tags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {/* Bulk Actions Dialog */}
          <Dialog open={isBulkActionsOpen} onOpenChange={setIsBulkActionsOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Bulk Actions</DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Apply changes to {selectedItems.size} selected item{selectedItems.size !== 1 ? 's' : ''}
                </p>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Featured Status */}
                <div className="space-y-2">
                  <Label>Featured Status</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        bulkUpdateFeaturedMutation.mutate({
                          mediaIds: Array.from(selectedItems),
                          isFeatured: true,
                        });
                        setIsBulkActionsOpen(false);
                      }}
                      disabled={bulkUpdateFeaturedMutation.isPending}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Mark Featured
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        bulkUpdateFeaturedMutation.mutate({
                          mediaIds: Array.from(selectedItems),
                          isFeatured: false,
                        });
                        setIsBulkActionsOpen(false);
                      }}
                      disabled={bulkUpdateFeaturedMutation.isPending}
                    >
                      <StarOff className="h-4 w-4 mr-2" />
                      Remove Featured
                    </Button>
                  </div>
                </div>

                {/* Portfolio Visibility */}
                <div className="space-y-2">
                  <Label>Portfolio Visibility</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        bulkUpdatePortfolioMutation.mutate({
                          mediaIds: Array.from(selectedItems),
                          showInPortfolio: true,
                        });
                        setIsBulkActionsOpen(false);
                      }}
                      disabled={bulkUpdatePortfolioMutation.isPending}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Show in Portfolio
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        bulkUpdatePortfolioMutation.mutate({
                          mediaIds: Array.from(selectedItems),
                          showInPortfolio: false,
                        });
                        setIsBulkActionsOpen(false);
                      }}
                      disabled={bulkUpdatePortfolioMutation.isPending}
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide from Portfolio
                    </Button>
                  </div>
                </div>

                {/* Client Assignment */}
                <div className="space-y-2">
                  <Label>Client Assignment</Label>
                  <Select
                    onValueChange={(clientId) => {
                      bulkAssignClientMutation.mutate({
                        mediaIds: Array.from(selectedItems),
                        clientId,
                      });
                      setIsBulkActionsOpen(false);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to client..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Remove assignment</SelectItem>
                      {Array.isArray(clients) && clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{client.username} ({client.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags Management */}
                <div className="space-y-2">
                  <Label>Tags Management</Label>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Enter tags separated by commas..."
                      id="bulk-tags"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const textarea = document.getElementById('bulk-tags') as HTMLTextAreaElement;
                          if (textarea?.value) {
                            bulkUpdateTagsMutation.mutate({
                              mediaIds: Array.from(selectedItems),
                              tags: textarea.value,
                              action: 'add',
                            });
                            setIsBulkActionsOpen(false);
                          }
                        }}
                        disabled={bulkUpdateTagsMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tags
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const textarea = document.getElementById('bulk-tags') as HTMLTextAreaElement;
                          if (textarea?.value) {
                            bulkUpdateTagsMutation.mutate({
                              mediaIds: Array.from(selectedItems),
                              tags: textarea.value,
                              action: 'replace',
                            });
                            setIsBulkActionsOpen(false);
                          }
                        }}
                        disabled={bulkUpdateTagsMutation.isPending}
                      >
                        <Tag className="h-4 w-4 mr-2" />
                        Replace Tags
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const textarea = document.getElementById('bulk-tags') as HTMLTextAreaElement;
                          if (textarea?.value) {
                            bulkUpdateTagsMutation.mutate({
                              mediaIds: Array.from(selectedItems),
                              tags: textarea.value,
                              action: 'remove',
                            });
                            setIsBulkActionsOpen(false);
                          }
                        }}
                        disabled={bulkUpdateTagsMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove Tags
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsBulkActionsOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Media Management Modal with Tabs */}
          <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
            <DialogContent 
              className="max-w-6xl max-h-[90vh] min-h-[60vh] flex flex-col smooth-dialog"
              style={{
                transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1), height 400ms cubic-bezier(0.4, 0, 0.2, 1), transform 400ms cubic-bezier(0.4, 0, 0.2, 1), max-width 400ms cubic-bezier(0.4, 0, 0.2, 1), max-height 400ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>{selectedMediaForFeedback?.title}</DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Media Management & Client Feedback
                </p>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
              
              {/* Video Preview Section - Responsive and scrollable */}
              {selectedMediaForFeedback?.type === "video" && (
                <div 
                  className="mb-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white"
                  style={{ 
                    isolation: 'isolate',
                    backgroundColor: 'var(--background, hsl(0, 0%, 3.9%))'
                  }}
                >
                  <video
                    key={selectedMediaForFeedback.id} // Force recreation when media changes
                    ref={(ref) => {
                      setFeedbackVideoRef(ref);
                      if (ref) {
                        // Remove ALL classes that might inherit dark styling
                        ref.className = '';
                        // Responsive video styling with dynamic sizing
                        ref.style.cssText = `
                          max-width: 100% !important;
                          height: auto !important;
                          object-fit: contain !important;
                          display: block !important;
                          background-color: transparent !important;
                          min-height: 200px !important;
                          max-height: 400px !important;
                          border-radius: 8px !important;
                          filter: none !important;
                          -webkit-filter: none !important;
                          mix-blend-mode: normal !important;
                          opacity: 1 !important;
                          isolation: isolate !important;
                          border: 1px solid #e5e7eb !important;
                          z-index: 99999 !important;
                          position: relative !important;
                          transform: none !important;
                          box-shadow: none !important;
                          margin: 0 auto !important;
                        `;
                        
                        // Dynamic video sizing function
                        const applyDynamicSizing = () => {
                          // Get video dimensions once loaded
                          if (ref.videoWidth && ref.videoHeight) {
                            const aspectRatio = ref.videoWidth / ref.videoHeight;
                            const containerWidth = ref.parentElement?.clientWidth || 400;
                            const maxHeight = window.innerWidth <= 768 ? 250 : 400;
                            const minHeight = window.innerWidth <= 768 ? 150 : 200;
                            
                            // Calculate optimal width based on aspect ratio and height constraints
                            const optimalWidth = Math.min(containerWidth, aspectRatio * maxHeight);
                            const calculatedHeight = optimalWidth / aspectRatio;
                            
                            if (calculatedHeight >= minHeight && calculatedHeight <= maxHeight) {
                              ref.style.width = `${optimalWidth}px !important`;
                              ref.style.height = `${calculatedHeight}px !important`;
                            }
                          }
                        };
                        
                        // Apply sizing when metadata loads
                        ref.addEventListener('loadedmetadata', applyDynamicSizing);
                        
                        // Responsive sizing for screen changes
                        const mediaQuery = window.matchMedia('(max-width: 768px)');
                        const updateVideoSize = () => {
                          if (mediaQuery.matches) {
                            ref.style.minHeight = '150px !important';
                            ref.style.maxHeight = '250px !important';
                          } else {
                            ref.style.minHeight = '200px !important';
                            ref.style.maxHeight = '400px !important';
                          }
                          applyDynamicSizing();
                        };
                        updateVideoSize();
                        mediaQuery.addEventListener('change', updateVideoSize);
                        
                        // Handle window resize
                        const handleResize = () => applyDynamicSizing();
                        window.addEventListener('resize', handleResize);
                        
                        // Use ResizeObserver for container size changes
                        if (window.ResizeObserver && ref.parentElement) {
                          const resizeObserver = new ResizeObserver(() => {
                            applyDynamicSizing();
                          });
                          resizeObserver.observe(ref.parentElement);
                        }
                      }
                    }}
                    src={selectedMediaForFeedback.url}
                    controls
                    controlsList="nodownload"
                    poster={selectedMediaForFeedback.posterUrl}
                    preload="metadata"
                    playsInline
                    onCanPlay={(e) => {
                      const video = e.target as HTMLVideoElement;
                      // Force responsive styling when video can play with dynamic sizing
                      const applyVideoSizing = () => {
                        video.style.cssText = `
                          max-width: 100% !important;
                          height: auto !important;
                          object-fit: contain !important;
                          display: block !important;
                          background-color: transparent !important;
                          min-height: 200px !important;
                          max-height: 400px !important;
                          border-radius: 8px !important;
                          filter: none !important;
                          -webkit-filter: none !important;
                          mix-blend-mode: normal !important;
                          opacity: 1 !important;
                          isolation: isolate !important;
                          border: 1px solid #e5e7eb !important;
                          z-index: 99999 !important;
                          position: relative !important;
                          transform: none !important;
                          box-shadow: none !important;
                          margin: 0 auto !important;
                        `;
                        
                        // Get video dimensions and calculate optimal width
                        if (video.videoWidth && video.videoHeight) {
                          const aspectRatio = video.videoWidth / video.videoHeight;
                          const containerWidth = video.parentElement?.clientWidth || 400;
                          const maxHeight = window.innerWidth <= 768 ? 250 : 400;
                          const minHeight = window.innerWidth <= 768 ? 150 : 200;
                          
                          // Calculate width based on aspect ratio and height constraints
                          const optimalWidth = Math.min(containerWidth, aspectRatio * maxHeight);
                          const calculatedHeight = optimalWidth / aspectRatio;
                          
                          if (calculatedHeight >= minHeight && calculatedHeight <= maxHeight) {
                            video.style.width = `${optimalWidth}px !important`;
                            video.style.height = `${calculatedHeight}px !important`;
                          }
                        }
                      };
                      
                      applyVideoSizing();
                      
                      // Mobile responsive adjustments
                      const mediaQuery = window.matchMedia('(max-width: 768px)');
                      if (mediaQuery.matches) {
                        video.style.minHeight = '150px !important';
                        video.style.maxHeight = '250px !important';
                      }
                    }}
                  />
                </div>
              )}
              
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 mb-4 flex-shrink-0">
                    <TabsTrigger value="feedback" className="transition-all duration-200">Feedback</TabsTrigger>
                    <TabsTrigger value="edit" className="transition-all duration-200">Edit</TabsTrigger>
                    <TabsTrigger value="assign" className="transition-all duration-200">Assign</TabsTrigger>
                    <TabsTrigger value="settings" className="transition-all duration-200">Settings</TabsTrigger>
                  </TabsList>
                
                {/* Feedback Tab */}
                <TabsContent value="feedback" className="transition-all duration-500 ease-in-out animate-in fade-in-0 slide-in-from-bottom-2">
                  <div className="flex flex-col h-full">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                      {/* Feedback Section */}
                      <div className="flex flex-col">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Client Feedback
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                          {Array.isArray(allFeedback) && allFeedback.filter((f: any) => f.mediaId === selectedMediaForFeedback?.id)
                            .map((feedback: any) => (
                              <div key={feedback.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{feedback.clientUsername}</span>
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${star <= feedback.rating 
                                            ? 'fill-yellow-400 text-yellow-400' 
                                            : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(feedback.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm">{feedback.feedbackText}</p>
                              </div>
                            ))}
                          {(!Array.isArray(allFeedback) || allFeedback.filter((f: any) => f.mediaId === selectedMediaForFeedback?.id).length === 0) && (
                            <p className="text-sm text-gray-500 text-center py-8">
                              No client feedback yet.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Timeline Notes Section */}
                      <div className="flex flex-col">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Timeline Notes
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                          {Array.isArray(allTimelineNotes) && allTimelineNotes.filter((n: any) => n.mediaId === selectedMediaForFeedback?.id)
                            .sort((a: any, b: any) => a.timestampSeconds - b.timestampSeconds)
                            .map((note: any) => (
                              <div 
                                key={note.id} 
                                className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => {
                                  if (feedbackVideoRef && selectedMediaForFeedback?.type === "video") {
                                    feedbackVideoRef.currentTime = note.timestampSeconds;
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{note.clientUsername}</span>
                                    <Badge variant="outline" className="text-xs hover:bg-blue-100 dark:hover:bg-blue-900">
                                      {Math.floor(note.timestampSeconds / 60)}:{(note.timestampSeconds % 60).toString().padStart(2, '0')}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm">{note.noteText}</p>
                                {selectedMediaForFeedback?.type === "video" && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                    Click to jump to timestamp
                                  </p>
                                )}
                              </div>
                            ))}
                          {(!Array.isArray(allTimelineNotes) || allTimelineNotes.filter((n: any) => n.mediaId === selectedMediaForFeedback?.id).length === 0) && (
                            <p className="text-sm text-gray-500 text-center py-8">
                              No timeline notes yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Edit Tab */}
                <TabsContent value="edit" className="transition-all duration-500 ease-in-out animate-in fade-in-0 slide-in-from-bottom-2">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Media Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <Input 
                          id="feedback-edit-title"
                          defaultValue={selectedMediaForFeedback?.title}
                          placeholder="Media title..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Project Stage</label>
                        <Select defaultValue={selectedMediaForFeedback?.projectStage || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pre-production">Pre-production</SelectItem>
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="post-production">Post-production</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="final">Final</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">Tags</label>
                        <Input 
                          id="feedback-edit-tags"
                          defaultValue={selectedMediaForFeedback?.tags?.join(", ")}
                          placeholder="Enter tags separated by commas..."
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <Textarea 
                          id="feedback-edit-notes"
                          defaultValue={selectedMediaForFeedback?.notes}
                          placeholder="Additional notes..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveChanges}
                        disabled={updateMediaDetailsMutation.isPending}
                      >
                        {updateMediaDetailsMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Assign Tab */}
                <TabsContent value="assign" className="transition-all duration-500 ease-in-out animate-in fade-in-0 slide-in-from-bottom-2">
                  <div className="space-y-6">
                    <h3 className="font-semibold flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Client Assignment
                    </h3>
                    
                    {/* Currently Assigned Clients */}
                    <div className="space-y-2">
                      <Label>Currently Assigned Clients</Label>
                      {selectedMediaForFeedback?.assignedClients && selectedMediaForFeedback.assignedClients.length > 0 ? (
                        <div className="border rounded-md p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
                          {selectedMediaForFeedback.assignedClients.map((client: any) => (
                            <div key={client.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">{client.name}</span>
                                <span className="text-xs text-gray-500">({client.email})</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (selectedMediaForFeedback) {
                                    removeClientFromMediaMutation.mutate({
                                      mediaId: selectedMediaForFeedback.id,
                                      clientId: client.id,
                                    });
                                  }
                                }}
                                disabled={removeClientFromMediaMutation.isPending}
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border rounded-md p-3 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No clients assigned</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Add New Client */}
                    <div className="space-y-2">
                      <Label>Add Client</Label>
                      <div className="flex gap-2">
                        <Popover open={clientDropdownOpen} onOpenChange={setClientDropdownOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={clientDropdownOpen}
                              className="flex-1 justify-between"
                            >
                              {selectedClientForAssignment
                                ? clients?.find((client: any) => client.id === selectedClientForAssignment)?.name
                                : "Choose a client to add..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder="Search clients..." />
                              <CommandEmpty>No clients found.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {Array.isArray(clients) && clients
                                  .filter((client: any) => {
                                    // Don't show already assigned clients
                                    const assignedClientIds = (selectedMediaForFeedback?.assignedClients || []).map((c: any) => c.id);
                                    return !assignedClientIds.includes(client.id);
                                  })
                                  .map((client: any) => (
                                    <CommandItem
                                      key={client.id}
                                      value={`${client.name} ${client.email}`}
                                      onSelect={() => {
                                        setSelectedClientForAssignment(client.id);
                                        setClientDropdownOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedClientForAssignment === client.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex items-center space-x-2">
                                        <Users className="h-4 w-4" />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{client.name}</span>
                                          <span className="text-sm text-gray-500">{client.email}</span>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          onClick={() => {
                            if (selectedMediaForFeedback && selectedClientForAssignment) {
                              addClientToMediaMutation.mutate({
                                mediaId: selectedMediaForFeedback.id,
                                clientId: selectedClientForAssignment,
                              });
                              setSelectedClientForAssignment("");
                            }
                          }}
                          disabled={addClientToMediaMutation.isPending || !selectedClientForAssignment}
                          className="shrink-0"
                        >
                          {addClientToMediaMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Settings Tab */}
                <TabsContent value="settings" className="transition-all duration-500 ease-in-out animate-in fade-in-0 slide-in-from-bottom-2">
                  <div className="space-y-6">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Media Settings
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Featured Media</label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Display this media prominently on the homepage
                          </p>
                        </div>
                        <Switch 
                          checked={feedbackModalFeatured} 
                          onCheckedChange={setFeedbackModalFeatured} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium">Show in Portfolio</label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Include this media in the public portfolio
                          </p>
                        </div>
                        <Switch 
                          checked={feedbackModalPortfolio} 
                          onCheckedChange={setFeedbackModalPortfolio} 
                        />
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h4>
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this media item?')) {
                            deleteMediaMutation.mutate(selectedMediaForFeedback?.id);
                            setShowFeedbackModal(false);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Media
                      </Button>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveSettings}
                        disabled={updateMediaSettingsMutation.isPending}
                      >
                        {updateMediaSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
