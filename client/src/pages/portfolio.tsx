import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VideoPlayer } from "@/components/video-player";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Play } from "lucide-react";
import { getBackgroundMedia, useWebsiteSettings } from "@/lib/background-utils";

const categories = ["All", "Commercial", "Documentary", "Corporate", "Music Video"];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [scrollY, setScrollY] = useState(0);
  const scrollYTarget = useRef(0);
  const rafRef = useRef<number>();
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get website settings for backgrounds
  const { data: websiteSettings } = useWebsiteSettings();

  // Smooth parallax scroll effect
  useEffect(() => {
    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;
    let running = true;
    const animate = () => {
      setScrollY(prev => {
        const next = lerp(prev, scrollYTarget.current, 0.15);
        return Math.abs(next - scrollYTarget.current) < 0.1 ? scrollYTarget.current : next;
      });
      if (running) rafRef.current = requestAnimationFrame(animate);
    };
    const handleScroll = () => {
      scrollYTarget.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
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
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  const { data: media, isLoading } = useQuery({
    queryKey: ["/api/media/portfolio"],
  });

  const filteredMedia = (media as any[] || []).filter((item: any) => {
    if (activeCategory === "All") return true;
    return item.tags?.includes(activeCategory.toLowerCase());
  });

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Header */}
      <section className="relative pt-24 pb-12 h-96 flex items-center justify-center overflow-hidden bg-white dark:bg-black">
        {(() => {
          const portfolioHeaderMedia = getBackgroundMedia(websiteSettings || [], "portfolio_header");
          if (!portfolioHeaderMedia) return null;
          
          return portfolioHeaderMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover parallax-bg"
              style={{ transform: `translateY(${scrollY * 0.5}px)` }}
              autoPlay
              loop
              muted
              playsInline
              src={portfolioHeaderMedia.url}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center parallax-bg"
              style={{
                backgroundImage: `url('${portfolioHeaderMedia.url}')`,
                transform: `translateY(${scrollY * 0.5}px)`,
              }}
            />
          );
        })()}
        {getBackgroundMedia(websiteSettings || [], "portfolio_header") && (
          <div className="absolute inset-0 hero-video-overlay" />
        )}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 hero-title">Portfolio</h1>
          <p className="text-xl max-w-3xl mx-auto hero-subtitle">
            Explore a selection of our standout video projects showcasing our creativity and expertise across different styles and industries.
          </p>
        </div>
      </section>

      {/* Filters: Only show if there are more than 12 items in the portfolio */}
      {Array.isArray(media) && media.length > 12 && (
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
      )}

      {/* Portfolio Grid */}
      <section className="relative py-12 bg-white dark:bg-black overflow-hidden">
        {(() => {
          const portfolioGalleryMedia = getBackgroundMedia(websiteSettings || [], "portfolio_gallery");
          if (!portfolioGalleryMedia) return null;
          
          return portfolioGalleryMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover parallax-bg opacity-10"
              style={{ transform: `translateY(${scrollY * 0.2}px)` }}
              autoPlay
              loop
              muted
              playsInline
              src={portfolioGalleryMedia.url}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center parallax-bg opacity-10"
              style={{
                backgroundImage: `url('${portfolioGalleryMedia.url}')`,
                transform: `translateY(${scrollY * 0.2}px)`,
              }}
            />
          );
        })()}
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
                        src={item.thumbnailWebpUrl || item.thumbnailUrl || item.url} 
                        alt={item.title}
                        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <video 
                        ref={videoRef}
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
                        poster={item.thumbnailWebpUrl || item.thumbnailUrl || item.posterUrl || undefined}
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

      {/* Video Player Modal */}
      <VideoPlayer 
        selectedVideo={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={closeVideoModal}
      />

      <Footer />
    </div>
  );
}