import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, X } from "lucide-react";
import { useWebsiteSetting } from "@/hooks/use-website-settings";

const categories = ["All", "Commercial", "Documentary", "Corporate", "Music Video"];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [scrollY, setScrollY] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // Get website settings for backgrounds
  const portfolioHeader = useWebsiteSetting('portfolio_header');
  const portfolioGallery = useWebsiteSetting('portfolio_gallery');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Video player event handlers
  const handleVideoHover = (videoElement: HTMLVideoElement) => {
    // Set to a specific time to show a good frame, then play
    videoElement.currentTime = 2; // Start at 2 seconds to skip black frames
    videoElement.play().catch(() => {
      // Fallback if autoplay fails
      console.log('Autoplay prevented');
    });
  };

  const handleVideoLeave = (videoElement: HTMLVideoElement) => {
    videoElement.pause();
    videoElement.currentTime = 2; // Reset to 2 seconds instead of 0 to show a good frame
  };

  const openVideoModal = (item: any) => {
    setSelectedVideo(item);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const closeVideoModal = () => {
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
      modalVideoRef.current.currentTime = Math.max(0, modalVideoRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.currentTime = Math.min(duration, modalVideoRef.current.currentTime + 10);
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
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const { data: media, isLoading } = useQuery({
    queryKey: ["/api/media/portfolio"],
  });

  const filteredMedia = (media || [])?.filter((item: any) => {
    if (activeCategory === "All") return true;
    return item.tags?.includes(activeCategory.toLowerCase());
  });

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header */}
      <section className="relative pt-24 pb-12 h-96 flex items-center justify-center overflow-hidden">
        {portfolioHeader.backgroundType === 'video' ? (
          <video
            className="absolute inset-0 w-full h-full object-cover parallax-bg"
            style={{ transform: `translateY(${scrollY * 0.5}px)` }}
            autoPlay
            loop
            muted
            playsInline
            src={portfolioHeader.backgroundUrl}
          />
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center parallax-bg"
            style={{
              backgroundImage: `url('${portfolioHeader.backgroundUrl || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080'}')`,
              transform: `translateY(${scrollY * 0.5}px)`,
            }}
          />
        )}
        <div className="absolute inset-0 hero-video-overlay" />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 hero-title">Portfolio</h1>
          <p className="text-xl max-w-3xl mx-auto hero-subtitle">
            Explore our collection of cinematic works across various industries and creative projects.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className={
                  activeCategory === category
                    ? "btn-primary"
                    : "hover:border-primary hover:text-primary"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="relative py-12 bg-white dark:bg-black overflow-hidden">
        {portfolioGallery.backgroundType === 'video' ? (
          <video
            className="absolute inset-0 w-full h-full object-cover parallax-bg opacity-10"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
            autoPlay
            loop
            muted
            playsInline
            src={portfolioGallery.backgroundUrl}
          />
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center parallax-bg opacity-10"
            style={{
              backgroundImage: `url('${portfolioGallery.backgroundUrl || 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080'}')`,
              transform: `translateY(${scrollY * 0.2}px)`,
            }}
          />
        )}
        <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMedia?.map((item: any) => (
                <Card 
                  key={item.id} 
                  className="group cursor-pointer overflow-hidden glass-card"
                  onClick={() => openVideoModal(item)}
                >
                  <div className="relative">
                    {item.type === "image" ? (
                      <img 
                        src={item.url} 
                        alt={item.title}
                        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <video 
                        ref={(el) => {
                          if (el) videoRef.current = el;
                        }}
                        src={item.url}
                        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onMouseEnter={(e) => handleVideoHover(e.currentTarget)}
                        onMouseLeave={(e) => handleVideoLeave(e.currentTarget)}
                        onLoadedMetadata={(e) => {
                          // Set video to show a frame at 2 seconds for thumbnail if no poster
                          if (!item.posterUrl) {
                            e.currentTarget.currentTime = 2;
                          }
                        }}
                        poster={item.posterUrl || undefined}
                      />
                    )}
                    
                    {/* Overlay with play icon for videos */}
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/90 rounded-full p-4">
                          <Play className="h-8 w-8 text-black" />
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white text-xl font-bold mb-2">{item.title}</h3>
                        <div className="flex flex-wrap gap-1">
                          {item.tags?.map((tag: string) => (
                            <span key={tag} className="text-xs bg-primary/20 text-primary-foreground px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {filteredMedia?.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold mb-4">No media found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try selecting a different category or check back later.
              </p>
            </div>
          )}
        </div>
        </div>
      </section>

      {/* Full-screen Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={closeVideoModal}>
        <DialogContent className="p-0 overflow-hidden bg-black/95 border-none max-h-[95vh] w-90 h-auto" aria-describedby="video-player-description">
          <DialogTitle className="sr-only">
            Video Player - {selectedVideo?.title}
          </DialogTitle>
          <div id="video-player-description" className="sr-only">
            Full-screen video player for {selectedVideo?.title}
          </div>
          
          <div className="relative group w-full h-full flex items-center justify-center">
            {/* Media Content */}
            {selectedVideo && (
              selectedVideo.type === "image" ? (
                <img
                  src={selectedVideo.url}
                  alt={selectedVideo.title}
                  className="block max-w-full max-h-full w-auto h-auto bg-black"
                  style={{
                    filter: 'none',
                    mixBlendMode: 'normal',
                    opacity: 1,
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <video
                  ref={modalVideoRef}
                  src={selectedVideo.url}
                  className="block max-w-full max-h-full w-auto h-auto bg-black"
                  style={{
                    filter: 'none',
                    mixBlendMode: 'normal',
                    opacity: 1,
                    objectFit: 'contain'
                  }}
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
                  onClick={(e) => {
                    // Only toggle play if clicking directly on video, not on controls
                    if (e.target === modalVideoRef.current) {
                      togglePlay();
                    }
                  }}
                />
              )
            )}

            {/* Floating Controls - Show on hover (only for videos) */}
            {selectedVideo?.type === "video" && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
              
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  closeVideoModal();
                }}
                className="absolute top-4 right-4 z-30 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 pointer-events-auto"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Video title overlay */}
              <div className="absolute top-4 left-4 z-20 pointer-events-auto">
                <div className="bg-black/70 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <h3 className="text-white font-semibold text-lg">{selectedVideo?.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedVideo?.tags?.map((tag: string) => (
                      <span key={tag} className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center play/pause button */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="text-white bg-black/50 hover:bg-black/70 rounded-full w-20 h-20 backdrop-blur-sm transition-all duration-200"
                >
                  {isPlaying ? (
                    <Pause className="h-10 w-10" />
                  ) : (
                    <Play className="h-10 w-10 ml-1" />
                  )}
                </Button>
              </div>

              {/* Bottom controls bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-3">
                  {/* Progress bar */}
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <Slider
                      value={[currentTime]}
                      max={duration}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Control buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Skip backward */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          skipBackward();
                        }}
                        className="text-white hover:bg-white/20 rounded-full w-10 h-10"
                      >
                        <SkipBack className="h-5 w-5" />
                      </Button>

                      {/* Skip forward */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          skipForward();
                        }}
                        className="text-white hover:bg-white/20 rounded-full w-10 h-10"
                      >
                        <SkipForward className="h-5 w-5" />
                      </Button>

                      {/* Volume control */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute();
                          }}
                          className="text-white hover:bg-white/20 rounded-full w-10 h-10"
                        >
                          {isMuted ? (
                            <VolumeX className="h-5 w-5" />
                          ) : (
                            <Volume2 className="h-5 w-5" />
                          )}
                        </Button>
                        <div className="w-20" onClick={(e) => e.stopPropagation()}>
                          <Slider
                            value={[isMuted ? 0 : volume]}
                            max={1}
                            step={0.01}
                            onValueChange={handleVolumeChange}
                            disabled={isMuted}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fullscreen button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestFullscreen();
                      }}
                      className="text-white hover:bg-white/20 rounded-full w-10 h-10"
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
