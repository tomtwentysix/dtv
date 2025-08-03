import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: featuredMedia, isLoading } = useQuery({
    queryKey: ["/api/media/featured"],
  });

  const { data: websiteSettings } = useQuery({
    queryKey: ["/api/website-settings"],
  });

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get background media for a section
  const getBackgroundMedia = (section: string) => {
    const setting = (websiteSettings as any[])?.find((s: any) => s.section === section);
    if (setting?.backgroundImage) {
      return setting.backgroundImage;
    }
    
    // Fallback to default images
    const defaultImages = {
      hero: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      featured_work: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      services: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080"
    };
    
    return {
      type: "image",
      url: defaultImages[section as keyof typeof defaultImages]
    };
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {(() => {
          const heroMedia = getBackgroundMedia("hero");
          return heroMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover parallax-bg"
              style={{
                transform: `translateY(${scrollY * 0.5}px)`,
              }}
              src={heroMedia.url}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center parallax-bg"
              style={{
                backgroundImage: `url('${heroMedia.url}')`,
                transform: `translateY(${scrollY * 0.5}px)`,
              }}
            />
          );
        })()}
        <div className="absolute inset-0 hero-video-overlay" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            <span className="hero-title">Cinematic</span>
            <span className="block hero-accent">Excellence</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 hero-subtitle max-w-2xl mx-auto">
            Crafting visual stories that captivate audiences and elevate brands through premium video production.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/portfolio">
              <Button size="lg" variant="glassPrimary" className="px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105">
                View Our Work
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="glassSecondary" className="px-8 py-4 text-lg font-semibold transition-all duration-300">
                Start Your Project
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Work Section */}
      <section className="relative py-20 bg-white dark:bg-black overflow-hidden">
        {(() => {
          const featuredMedia = getBackgroundMedia("featured_work");
          return featuredMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover parallax-bg opacity-20"
              style={{
                transform: `translateY(${scrollY * 0.3}px)`,
              }}
              src={featuredMedia.url}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center parallax-bg opacity-20"
              style={{
                backgroundImage: `url('${featuredMedia.url}')`,
                transform: `translateY(${scrollY * 0.3}px)`,
              }}
            />
          );
        })()}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Featured Work</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Discover our latest cinematic productions and creative storytelling across various industries.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredMedia?.slice(0, 6).map((media: any) => (
                <Card key={media.id} className="group cursor-pointer overflow-hidden glass-card">
                  <div className="relative">
                    {media.type === "image" ? (
                      <img 
                        src={media.url} 
                        alt={media.title}
                        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          console.error('Featured image failed to load:', media.url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="relative w-full h-64 bg-gray-900">
                        <video 
                          src={media.url}
                          className="w-full h-64 object-cover"
                          muted
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            // Set video to show frame at 2 seconds for thumbnail
                            const video = e.target as HTMLVideoElement;
                            video.currentTime = 2;
                          }}
                          onError={(e) => {
                            console.error('Featured video failed to load:', media.url);
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="bg-white/90 rounded-full p-3 opacity-80">
                            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white text-xl font-bold mb-2">{media.title}</h3>
                        <div className="flex flex-wrap gap-1">
                          {media.tags?.map((tag: string) => (
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

          <div className="text-center mt-12">
            <Link href="/portfolio">
              <Button size="lg" variant="glassPrimary">
                View Full Portfolio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="relative py-20 bg-white dark:bg-black overflow-hidden">
        {(() => {
          const servicesMedia = getBackgroundMedia("services");
          return servicesMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover parallax-bg opacity-10"
              style={{
                transform: `translateY(${scrollY * 0.2}px)`,
              }}
              src={servicesMedia.url}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center parallax-bg opacity-10"
              style={{
                backgroundImage: `url('${servicesMedia.url}')`,
                transform: `translateY(${scrollY * 0.2}px)`,
              }}
            />
          );
        })()}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Our Services</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              From concept to delivery, we provide comprehensive video production services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 glass-card glass-text">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">Commercial Production</h3>
                <p>
                  Brand storytelling through cinematic commercials that connect with your audience.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 glass-card glass-text">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">Documentary</h3>
                <p>
                  Compelling documentary films that capture real stories and authentic emotions.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 glass-card glass-text">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">Corporate Videos</h3>
                <p>
                  Professional corporate content that elevates your business communication.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/services">
              <Button size="lg" variant="glassPrimary">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-4">dt.visuals</div>
            <p className="text-gray-400 mb-6">Cinematic excellence in every frame</p>
            <p className="text-sm text-gray-500">© 2024 dt.visuals. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
