import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface VideoPlayerProps {
  selectedVideo: any;
  isOpen: boolean;
  onClose: () => void;
  autoPlayOnOpen?: boolean;
}

export function VideoPlayer({ selectedVideo, isOpen, onClose, autoPlayOnOpen = true }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const isMobile = useIsMobile();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isOpen]);

  // Auto-hide controls after 3 seconds when playing
  useEffect(() => {
    if (isPlaying && showControls && !isMobile) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls, isMobile]);

  // Show controls on mouse movement
  const handleMouseMove = () => {
    if (!isMobile) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  };

  // Auto-play and auto-fullscreen on mobile when modal opens
  useEffect(() => {
    if (isOpen && selectedVideo?.type === "video" && autoPlayOnOpen) {
      setTimeout(() => {
        if (modalVideoRef.current) {
          // On desktop, just autoplay
          if (!isMobile) {
            modalVideoRef.current.play().catch(() => {
              console.log('Autoplay prevented');
            });
          } else {
            // On mobile, play and try to enter fullscreen using native controls
            modalVideoRef.current.play().catch(() => {
              console.log('Autoplay prevented on mobile');
            });
            
            // Mobile fullscreen - let the native controls handle it
            // The mobile video will have controls=true so user can tap fullscreen
          }
        }
      }, 100);
    }
  }, [isOpen, selectedVideo, autoPlayOnOpen, isMobile]);

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
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    // On mobile with native controls, don't interfere with native controls
    if (isMobile) return;
    
    // Only toggle play if clicking directly on video, not on controls
    if (e.target === modalVideoRef.current) {
      togglePlay();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`p-0 overflow-hidden bg-black/95 border-none ${
        isMobile 
          ? "w-full h-full max-w-none max-h-none m-0" 
          : "w-[80vw] max-w-none max-h-[95vh] h-auto"
      }`} aria-describedby="media-player-description">
        <DialogTitle className="sr-only">
          Media Player - {selectedVideo?.title}
        </DialogTitle>
        <div id="media-player-description" className="sr-only">
          Full-screen media player for {selectedVideo?.title}
        </div>

        <div 
          className="relative group w-full h-full flex items-center justify-center"
          onMouseMove={handleMouseMove}
        >
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
                className="block max-w-full max-h-full w-auto h-auto bg-black modal-video"
                style={{
                  filter: 'none',
                  mixBlendMode: 'normal',
                  opacity: 1,
                  objectFit: 'contain'
                }}
                // Use native controls on mobile, custom controls on desktop
                controls={isMobile}
                playsInline={!isMobile}
                poster={selectedVideo.posterUrl || undefined}
                preload="metadata"
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
                onClick={handleVideoClick}
              />
            )
          )}

          {/* Desktop Custom Controls - Only show on desktop */}
          {selectedVideo?.type === "video" && !isMobile && (
            <div className={`absolute inset-0 transition-opacity duration-300 ${
              showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}>

            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
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

          {/* Mobile or Image Close button - Show when needed */}
          {(isMobile || selectedVideo?.type === "image") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 z-30 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}