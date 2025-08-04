import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useClientAuth } from "@/hooks/use-client-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  VideoIcon,
  Image as ImageIcon,
  Download,
  Eye,
  Clock,
  Loader2,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Info,
  Star,
  MessageSquare,
  Plus,
  CheckSquare,
  Square,
  Archive,
  Filter,
  Search,
} from "lucide-react";

export default function ClientDashboard() {
  const { clientUser, isAuthenticated, isAuthLoading, logout } = useClientAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // All state hooks must be at the top, before any early returns
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // New state for enhanced functionality
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState<any>(null);
  const [showTimelineNotes, setShowTimelineNotes] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [newNoteText, setNewNoteText] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState(0);

  const [modalActiveTab, setModalActiveTab] = useState("preview");

  const { data: clientMedia = [], isLoading: mediaLoading } = useQuery({
    queryKey: ["/api/client/media"],
  });

  // Queries for feedback and timeline notes
  const { data: mediaFeedback = [] } = useQuery({
    queryKey: ["/api/client/media/feedback"],
    enabled: !!clientUser?.id,
  });

  const { data: timelineNotes = [] } = useQuery({
    queryKey: ["/api/client/media/timeline-notes"],
    enabled: !!clientUser?.id,
  });

  // Mutations for feedback and notes - MUST be before any early returns
  const feedbackMutation = useMutation({
    mutationFn: async (data: {
      mediaId: string;
      feedbackText: string;
      rating: number;
    }) => {
      return apiRequest(
        "POST",
        `/api/client/media/${data.mediaId}/feedback`,
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/client/media/feedback"],
      });
      toast({ title: "Feedback submitted successfully" });
      setShowFeedback(null);
      setFeedbackText("");
      setRating(0);
    },
  });

  const timelineNoteMutation = useMutation({
    mutationFn: async (data: {
      mediaId: string;
      timestampSeconds: number;
      noteText: string;
    }) => {
      return apiRequest(
        "POST",
        `/api/client/media/${data.mediaId}/timeline-notes`,
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/client/media/timeline-notes"],
      });
      toast({ title: "Timeline note added successfully" });
      setNewNoteText("");
    },
  });
  
  // All useEffect hooks must be here before any early returns
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/client/login");
    }
  }, [isAuthenticated, isAuthLoading, setLocation]);

  // Auto-play effect when modal opens
  useEffect(() => {
    if (selectedVideo && modalVideoRef.current && isPlaying) {
      const timer = setTimeout(() => {
        if (modalVideoRef.current) {
          modalVideoRef.current.play().catch((error) => {
            console.log("Autoplay prevented:", error);
            setIsPlaying(false);
          });
        }
      }, 100); // Small delay to ensure video is ready

      return () => clearTimeout(timer);
    }
  }, [selectedVideo, isPlaying]);

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Ensure arrays are properly typed
  const typedClientMedia = Array.isArray(clientMedia) ? clientMedia : [];
  const typedMediaFeedback = Array.isArray(mediaFeedback) ? mediaFeedback : [];
  const typedTimelineNotes = Array.isArray(timelineNotes) ? timelineNotes : [];

  const handleDownload = (mediaUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = mediaUrl;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDownload = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select media files to download",
      });
      return;
    }

    const selectedMedia = typedClientMedia.filter((item: any) =>
      selectedItems.has(item.id),
    );
    if (!selectedMedia) return;

    selectedMedia.forEach((item: any) => {
      setTimeout(() => handleDownload(item.url, item.filename), 100);
    });

    toast({
      title: `Downloading ${selectedItems.size} files`,
      description: "Your downloads will begin shortly",
    });
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (!clientMedia) return;
    const allIds = new Set(typedClientMedia.map((item: any) => item.id));
    setSelectedItems(allIds);
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  // Media player functions
  const openMediaModal = (item: any) => {
    setSelectedVideo(item);
    setIsPlaying(item.type === "video");
    setCurrentTime(0);
  };

  const closeMediaModal = () => {
    setSelectedVideo(null);
    setIsPlaying(false);
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
    }
  };



  const togglePlay = () => {
    if (modalVideoRef.current) {
      if (isPlaying) {
        modalVideoRef.current.pause();
        // Auto-update timestamp when pausing on timeline tab
        if (modalActiveTab === "timeline") {
          setNoteTimestamp(
            Math.round(modalVideoRef.current.currentTime * 100) / 100,
          );
        }
      } else {
        modalVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (modalVideoRef.current) {
      modalVideoRef.current.volume = newVolume;
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (modalVideoRef.current) {
      modalVideoRef.current.currentTime = newTime;
    }
  };

  const skipBackward = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.currentTime = Math.max(
        0,
        modalVideoRef.current.currentTime - 10,
      );
    }
  };

  const skipForward = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.currentTime = Math.min(
        duration,
        modalVideoRef.current.currentTime + 10,
      );
    }
  };

  const requestFullscreen = () => {
    if (modalVideoRef.current) {
      if (modalVideoRef.current.requestFullscreen) {
        modalVideoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleVideoHover = (videoElement: HTMLVideoElement) => {
    videoElement.currentTime = 2;
    videoElement.play().catch(() => {
      console.log("Autoplay prevented");
    });
  };

  const handleVideoLeave = (videoElement: HTMLVideoElement) => {
    videoElement.pause();
    videoElement.currentTime = 2;
  };

  // Helper functions
  const submitFeedback = () => {
    // Client users don't have permission checks - simplified for client portal
    if (!showFeedback || !feedbackText.trim() || rating === 0) {
      toast({ title: "Please provide both feedback text and rating" });
      return;
    }

    if (!showFeedback || !feedbackText.trim() || rating === 0) {
      toast({ title: "Please provide both feedback text and rating" });
      return;
    }

    feedbackMutation.mutate({
      mediaId: showFeedback.id,
      feedbackText: feedbackText.trim(),
      rating,
    });
  };

  const addTimelineNote = () => {
    // Client users don't have permission checks - simplified for client portal
    if (!showTimelineNotes || !newNoteText.trim()) {
      toast({ title: "Please enter a note" });
      return;
    }

    if (!showTimelineNotes || !newNoteText.trim()) {
      toast({ title: "Please enter a note" });
      return;
    }

    timelineNoteMutation.mutate({
      mediaId: showTimelineNotes.id,
      timestampSeconds: Math.floor(noteTimestamp),
      noteText: newNoteText.trim(),
    });
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter media based on search and stage
  const filteredMedia = typedClientMedia.filter((item: any) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags &&
        typeof item.tags === "string" &&
        item.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStage =
      stageFilter === "all" || item.projectStage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const stats = {
    totalMedia: typedClientMedia.length,
    recentUploads: typedClientMedia.filter((item: any) => {
      const uploadDate = new Date(item.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return uploadDate > weekAgo;
    }).length,
    videos: typedClientMedia.filter((item: any) => item.type === "video").length,
    images: typedClientMedia.filter((item: any) => item.type === "image").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Client-specific header */}
      <header className="fixed top-0 w-full z-50 bg-white/95 dark:bg-black/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-orange-500 rounded-full" />
              <h1 className="text-xl font-bold">dt.visuals Client Portal</h1>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {clientUser?.username}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Welcome, {clientUser?.username}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Access your exclusive media content from dt.visuals
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Media
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {stats.totalMedia}
                    </p>
                  </div>
                  <VideoIcon className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Recent Uploads
                    </p>
                    <p className="text-3xl font-bold text-accent">
                      {stats.recentUploads}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Videos
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {stats.videos}
                    </p>
                  </div>
                  <VideoIcon className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Images
                    </p>
                    <p className="text-3xl font-bold text-accent">
                      {stats.images}
                    </p>
                  </div>
                  <ImageIcon className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle>Your Media</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search media..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by stage" />
                    </SelectTrigger>
                    <SelectContent className="glass-nav bg-white/10 dark:bg-black/30 border border-white/20 backdrop-blur-md">
                      <SelectItem
                        value="all"
                        className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                      >
                        All Stages
                      </SelectItem>
                      <SelectItem
                        value="concept"
                        className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                      >
                        Concept
                      </SelectItem>
                      <SelectItem
                        value="pre-production"
                        className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                      >
                        Pre-production
                      </SelectItem>
                      <SelectItem
                        value="production"
                        className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                      >
                        Production
                      </SelectItem>
                      <SelectItem
                        value="post-production"
                        className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                      >
                        Post-production
                      </SelectItem>
                      <SelectItem
                        value="completed"
                        className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                      >
                        Completed
                      </SelectItem>
                      <SelectItem
                        value="delivered"
                        className="hover:bg-[hsl(184,65%,18%)] focus:bg-[hsl(184,65%,18%)]"
                      >
                        Delivered
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedItems.size > 0 && (
                <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-4">
                  <span className="text-sm font-medium">
                    {selectedItems.size} item{selectedItems.size > 1 ? "s" : ""}{" "}
                    selected
                  </span>
                  <Button size="sm" onClick={handleBulkDownload}>
                    <Archive className="h-4 w-4 mr-2" />
                    Download Selected
                  </Button>
                  <Button size="sm" variant="outline" onClick={deselectAll}>
                    Clear Selection
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {mediaLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !filteredMedia || filteredMedia.length === 0 ? (
                <div className="text-center py-16">
                  <VideoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {typedClientMedia.length === 0
                      ? "No media assigned yet"
                      : "No media matches your search"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {typedClientMedia.length === 0
                      ? "Your media content will appear here once it's ready and assigned to your account."
                      : "Try adjusting your search terms or filters."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Select All Controls */}
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={
                        selectedItems.size === filteredMedia.length
                          ? deselectAll
                          : selectAll
                      }
                    >
                      {selectedItems.size === filteredMedia.length ? (
                        <CheckSquare className="h-4 w-4 mr-2" />
                      ) : (
                        <Square className="h-4 w-4 mr-2" />
                      )}
                      {selectedItems.size === filteredMedia.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {filteredMedia.length} of{" "}
                      {typedClientMedia.length} items
                    </span>
                  </div>

                  {/* Media Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMedia.map((item: any, index: number) => (
                      <Card
                        key={`${item.id}-${index}`}
                        className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setShowDetails(item)}
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

                          {item.type === "image" ? (
                            <img
                              src={item.url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(
                                  "Image failed to load:",
                                  item.url,
                                );
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <video
                              src={item.url}
                              poster={item.posterUrl}
                              className="w-full h-full object-cover"
                              muted
                              onError={(e) => {
                                console.error(
                                  "Video failed to load:",
                                  item.url,
                                );
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
                              const feedbackCount = typedMediaFeedback.filter(
                                  (f: any) => f.mediaId === item.id,
                                ).length;
                              const notesCount = typedTimelineNotes.filter(
                                  (n: any) => n.mediaId === item.id,
                                ).length;

                              return (
                                <>
                                  {feedbackCount > 0 && (
                                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
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

                          {/* Project Stage Badge */}
                          {item.projectStage && (
                            <div className="absolute bottom-2 left-2">
                              <Badge
                                variant="outline"
                                className="text-xs bg-black/70 text-white border-white/30"
                              >
                                {item.projectStage.replace("-", " ")}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold truncate flex-1 mr-2">
                              {item.title}
                            </h3>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(item.url, item.filename);
                              }}
                              className="px-3 ml-2"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Feedback Status */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {(() => {
                              const feedbackCount = typedMediaFeedback.filter(
                                  (f: any) => f.mediaId === item.id,
                                ).length;
                              const notesCount = typedTimelineNotes.filter(
                                  (n: any) => n.mediaId === item.id,
                                ).length;

                              if (feedbackCount > 0) {
                                return (
                                  <Badge className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    {feedbackCount} Review
                                    {feedbackCount > 1 ? "s" : ""}
                                  </Badge>
                                );
                              }

                              if (notesCount > 0) {
                                return (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700"
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    {notesCount} Note{notesCount > 1 ? "s" : ""}
                                  </Badge>
                                );
                              }

                              return null;
                            })()}
                          </div>

                          {/* Tags */}
                          {item.tags && typeof item.tags === "string" && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.tags
                                .split(",")
                                .slice(0, 2)
                                .map((tag: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag.trim()}
                                  </Badge>
                                ))}
                              {item.tags.split(",").length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.tags.split(",").length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* File Info */}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              {item.type === "video" ? (
                                <VideoIcon className="h-3 w-3" />
                              ) : (
                                <ImageIcon className="h-3 w-3" />
                              )}
                              <span className="uppercase">{item.type}</span>
                            </div>
                            <span>
                              {new Date(
                                item.uploadedAt || item.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Contact Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Have questions about your media or need assistance?
                  </p>
                  <Button variant="outline" size="sm">
                    Contact Support
                  </Button>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Download Guidelines</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Learn about usage rights and download options for your
                    media.
                  </p>
                  <Button variant="outline" size="sm">
                    View Guidelines
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Minimal Video-First Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center transition-all duration-300 ease-out"
          onClick={closeMediaModal}
        >
          {/* Video-centric container with minimal UI */}
          <div className="relative transition-all duration-500 ease-out" onClick={(e) => e.stopPropagation()}>
            {/* Close button - floating and dynamic */}
            <button
              onClick={closeMediaModal}
              className="absolute -top-2 -right-2 z-30 text-white hover:text-red-400 bg-black/80 hover:bg-black/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 transform -translate-y-full translate-x-full"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Dynamic header - adjusts to content */}
            <div className="absolute -top-4 left-0 z-20 transform -translate-y-full transition-all duration-400 ease-out">
              <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 min-w-0 max-w-md transition-all duration-400 ease-out">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-white font-medium text-sm truncate">
                      {selectedVideo.title}
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">
                      Video • Uploaded {selectedVideo.uploadedAt}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Media content with no container styling */}
            {selectedVideo.type === "image" ? (
              <img
                src={selectedVideo.url}
                alt={selectedVideo.title}
                className="transition-all duration-500 ease-out"
                style={{
                  maxWidth: "95vw",
                  maxHeight: "90vh",
                  display: "block",
                }}
              />
            ) : (
              <video
                ref={modalVideoRef}
                src={selectedVideo.url}
                className="transition-all duration-500 ease-out"
                style={{
                  maxWidth: "95vw",
                  maxHeight: "90vh",
                  display: "block",
                }}
                controls
                onLoadedMetadata={() => {
                  if (modalVideoRef.current) {
                    setDuration(modalVideoRef.current.duration);
                    modalVideoRef.current.volume = volume;
                    modalVideoRef.current.muted = isMuted;
                  }
                }}
                onTimeUpdate={() => {
                  if (modalVideoRef.current) {
                    setCurrentTime(modalVideoRef.current.currentTime);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
            )}

            {/* Dynamic footer - adjusts to content */}
            <div className="absolute -bottom-4 left-0 z-20 transform translate-y-full transition-all duration-400 ease-out">
              <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 min-w-0 transition-all duration-400 ease-out">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button className="text-white hover:text-gray-300 text-xs hover:bg-white/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Details
                    </button>
                    <button className="text-white hover:text-gray-300 text-xs hover:bg-white/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Feedback
                    </button>
                    <button className="text-white hover:text-gray-300 text-xs hover:bg-white/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Notes
                    </button>
                  </div>
                  <div className="w-px h-4 bg-gray-600"></div>
                  <button
                    onClick={() =>
                      handleDownload(selectedVideo.url, selectedVideo.filename)
                    }
                    className="text-white hover:text-gray-300 text-xs hover:bg-white/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Client Media Management Modal */}
      <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 smooth-dialog">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="text-xl font-semibold">
              {showDetails?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Review, provide feedback, and manage your media content
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Video Player Section */}
            <div className="flex-shrink-0 p-6 flex flex-col justify-center items-center bg-black/[0.039]">
              {showDetails && (
                <div className="w-full max-w-4xl">
                  {showDetails.type === "video" ? (
                    <video
                      ref={(ref) => {
                        if (ref) {
                          modalVideoRef.current = ref;
                          // Remove ALL classes that might inherit dark styling
                          ref.className = '';
                          // Dynamic video sizing with responsive approach
                          ref.style.cssText = `
                            max-width: 100% !important;
                            height: auto !important;
                            object-fit: contain !important;
                            display: block !important;
                            background-color: transparent !important;
                            min-height: 200px !important;
                            max-height: 500px !important;
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
                              const containerWidth = ref.parentElement?.clientWidth || 600;
                              const maxHeight = window.innerWidth <= 768 ? 300 : 500;
                              const minHeight = window.innerWidth <= 768 ? 200 : 250;
                              
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
                              ref.style.minHeight = '200px !important';
                              ref.style.maxHeight = '300px !important';
                            } else {
                              ref.style.minHeight = '250px !important';
                              ref.style.maxHeight = '500px !important';
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
                      src={showDetails.url}
                      controls
                      preload="metadata"
                      playsInline
                      onLoadedMetadata={(e) => {
                        const video = e.target as HTMLVideoElement;
                        setDuration(video.duration);
                        video.volume = volume;
                        video.muted = isMuted;
                      }}
                      onTimeUpdate={(e) => {
                        const video = e.target as HTMLVideoElement;
                        setCurrentTime(video.currentTime);
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={(e) => {
                        const video = e.target as HTMLVideoElement;
                        setIsPlaying(false);
                        // Auto-update timestamp when pausing for timeline notes
                        setNoteTimestamp(Math.round(video.currentTime * 100) / 100);
                      }}
                      onEnded={() => setIsPlaying(false)}
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
                            max-height: 500px !important;
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
                            const containerWidth = video.parentElement?.clientWidth || 600;
                            const maxHeight = window.innerWidth <= 768 ? 300 : 500;
                            const minHeight = window.innerWidth <= 768 ? 200 : 250;
                            
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
                          video.style.minHeight = '200px !important';
                          video.style.maxHeight = '300px !important';
                        }
                      }}
                    />
                  ) : (
                    <img
                      src={showDetails.url}
                      alt={showDetails.title}
                      className="max-w-full max-h-[500px] object-contain mx-auto rounded-lg border"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Tabs Section - Below Video */}
            <div className="flex-1 border-t bg-black/[0.039] dark:bg-black/[0.039] flex flex-col">
              <Tabs defaultValue="details" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                  <TabsTrigger value="details" className="text-sm">Details</TabsTrigger>
                  <TabsTrigger value="feedback" className="text-sm">Feedback</TabsTrigger>
                  <TabsTrigger value="notes" className="text-sm">Timeline</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="flex-1 p-6 overflow-y-auto">
                  {showDetails && (
                    <div className="max-w-4xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div>
                          <h4 className="font-semibold mb-3">Basic Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Type:</span>
                              <span className="capitalize">{showDetails.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Size:</span>
                              <span>
                                {showDetails.fileSize
                                  ? `${(showDetails.fileSize / 1024 / 1024).toFixed(2)} MB`
                                  : "Unknown"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Created:</span>
                              <span className="text-right text-xs">
                                {new Date(showDetails.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Project Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Stage:</span>
                              <Badge variant="outline" className="text-xs">
                                {showDetails.projectStage || "Not specified"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Actions</h4>
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() =>
                              handleDownload(showDetails.url, showDetails.filename)
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download File
                          </Button>
                        </div>
                      </div>

                      {showDetails.tags && showDetails.tags.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold mb-3">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {showDetails.tags.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-sm">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {showDetails.notes && (
                        <div>
                          <h4 className="font-semibold mb-3">Notes</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            {showDetails.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Feedback Tab */}
                <TabsContent value="feedback" className="flex-1 p-6 overflow-y-auto">
                  <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold mb-4 text-lg">Submit Feedback</h4>
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium mb-3 block">Rating</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setRating(star)}
                                  className="p-2 hover:scale-110 transition-transform"
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      star <= rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300 dark:text-gray-600"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-3 block">Comments</label>
                            <Textarea
                              placeholder="Share your thoughts, suggestions, or concerns..."
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              rows={5}
                              className="resize-none"
                            />
                          </div>

                          <Button
                            onClick={() => {
                              if (showDetails) {
                                setShowFeedback(showDetails);
                                submitFeedback();
                              }
                            }}
                            disabled={
                              feedbackMutation.isPending ||
                              !feedbackText.trim() ||
                              rating === 0
                            }
                            className="w-full"
                            size="lg"
                          >
                            {feedbackMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Submit Feedback"
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4 text-lg">Previous Feedback</h4>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {typedMediaFeedback
                            .filter((feedback: any) => feedback.mediaId === showDetails?.id)
                            .map((feedback: any) => (
                              <div key={feedback.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${
                                          star <= feedback.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300 dark:text-gray-600"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(feedback.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {feedback.feedbackText}
                                </p>
                              </div>
                            ))}
                          {typedMediaFeedback.filter((feedback: any) => feedback.mediaId === showDetails?.id).length === 0 && (
                            <p className="text-gray-500 text-center py-8">
                              No feedback submitted yet
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>



                {/* Timeline Notes Tab */}
                <TabsContent value="notes" className="flex-1 p-6 overflow-y-auto">
                  <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold mb-4 text-lg">Add Timeline Note</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Timestamp (seconds)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={noteTimestamp}
                                onChange={(e) =>
                                  setNoteTimestamp(parseFloat(e.target.value) || 0)
                                }
                                placeholder="0"
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Formatted Time
                              </label>
                              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-sm border">
                                {formatTimestamp(noteTimestamp)}
                              </div>
                            </div>
                        </div>
                        <Textarea
                          placeholder="Enter your note for this timestamp..."
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          rows={3}
                          className="resize-none text-sm"
                        />
                        <Button
                          onClick={() => {
                            if (showDetails) {
                              setShowTimelineNotes(showDetails);
                              addTimelineNote();
                            }
                          }}
                          disabled={timelineNoteMutation.isPending || !newNoteText.trim()}
                          size="sm"
                          className="w-full"
                        >
                          {timelineNoteMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Note
                            </>
                          )}
                        </Button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4 text-lg">Timeline Notes</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {typedTimelineNotes
                            .filter((note: any) => note.mediaId === showDetails?.id)
                            .sort((a: any, b: any) => a.timestampSeconds - b.timestampSeconds)
                            .map((note: any) => (
                              <div
                                key={note.id}
                                className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                    {formatTimestamp(note.timestampSeconds)}
                                  </code>
                                  <span className="text-xs text-gray-500">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {note.noteText}
                                </p>
                              </div>
                            ))}
                          {typedTimelineNotes.filter((note: any) => note.mediaId === showDetails?.id).length === 0 && (
                            <p className="text-gray-500 text-center py-8">
                              No timeline notes yet
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
