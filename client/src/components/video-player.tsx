import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, X } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  onClose?: () => void;
  title?: string;
  tags?: string[];
  autoplay?: boolean;
  showTitle?: boolean;
  onLoadedMetadata?: () => void;
  mode?: "modal" | "inline"; // New prop for different display modes
  onPause?: (e: any) => void; // Allow custom pause handler for feedback functionality
}

export interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  requestFullscreen: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({
    src,
    poster,
    className = "",
    style = {},
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    onClose,
    title,
    tags,
    autoplay = false,
    showTitle = true,
    onLoadedMetadata,
    mode = "modal",
    onPause,
  }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isMobile = useIsMobile();

    // Expose video control methods to parent
    useImperativeHandle(ref, () => ({
      play: () => {
        if (videoRef.current) {
          videoRef.current.play();
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      togglePlay: () => {
        if (videoRef.current) {
          if (isPlaying) {
            videoRef.current.pause();
          } else {
            videoRef.current.play();
          }
        }
      },
      requestFullscreen: () => {
        if (videoRef.current && videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        }
      },
    }));

    // Handle video events
    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
        videoRef.current.volume = volume;
        videoRef.current.muted = isMuted;
        if (onLoadedMetadata) onLoadedMetadata();
      }
    };

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = (e?: any) => {
      setIsPlaying(false);
      if (onPause) onPause(e);
    };
    const handleEnded = () => setIsPlaying(false);

    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      }
    };

    const toggleMute = () => {
      if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    };

    const handleVolumeChange = (value: number[]) => {
      const newVolume = value[0];
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
        if (newVolume > 0 && isMuted) {
          setIsMuted(false);
          videoRef.current.muted = false;
        }
      }
    };

    const handleSeek = (value: number[]) => {
      if (videoRef.current) {
        videoRef.current.currentTime = value[0];
        setCurrentTime(value[0]);
      }
    };

    const skipBackward = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      }
    };

    const skipForward = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
      }
    };

    const requestFullscreen = () => {
      if (videoRef.current && videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    };

    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleVideoClick = (e: React.MouseEvent) => {
      // On mobile, let native controls handle interactions
      if (isMobile) return;
      
      // On desktop, only toggle play if clicking directly on video, not on controls
      if (e.target === videoRef.current) {
        togglePlay();
      }
    };

    // For desktop: autoplay on mount if specified
    useEffect(() => {
      if (!isMobile && autoplay && videoRef.current) {
        videoRef.current.currentTime = 2; // Start at 2 seconds to skip black frames
        videoRef.current.play().catch(() => {
          console.log('Autoplay prevented');
        });
      }
    }, [autoplay, isMobile]);

    // Mobile: Use native video player
    if (isMobile) {
      return (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className={`w-full h-full ${className}`}
          style={{
            objectFit: 'contain',
            ...style
          }}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
        />
      );
    }

    // Inline mode: Simple video with native controls (for feedback/admin pages)
    if (mode === "inline") {
      return (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className={`w-full h-full ${className}`}
          style={{
            objectFit: 'contain',
            ...style
          }}
          controls
          preload="metadata"
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
        />
      );
    }

    // Desktop: Custom player with hover controls
    return (
      <div className="relative group w-full h-full">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className={`block w-full h-full ${className}`}
          style={{
            filter: 'none',
            mixBlendMode: 'normal',
            opacity: 1,
            objectFit: 'contain',
            ...style
          }}
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onClick={handleVideoClick}
        />

        {/* Custom Controls - Show on hover (desktop only) */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
          
          {/* Close button */}
          {onClose && (
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
          )}

          {/* Video title overlay */}
          {showTitle && title && (
            <div className="absolute top-4 left-4 z-20 pointer-events-auto">
              <div className="bg-black/70 rounded-lg px-4 py-2 backdrop-blur-sm">
                <h3 className="text-white font-semibold text-lg">{title}</h3>
                {tags && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";