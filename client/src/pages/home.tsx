import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getBackgroundMedia, useWebsiteSettings } from "@/lib/background-utils";

export default function Home() {
  const { data: featuredMedia, isLoading } = useQuery<any[]>({
    queryKey: ["/api/media/featured"],
  });

  const { data: websiteSettings } = useWebsiteSettings();
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const [sectionOffsets, setSectionOffsets] = useState<Record<string, number>>({});
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  
  const heroRef = useRef<HTMLElement>(null);
  const whatWeDoRef = useRef<HTMLElement>(null);
  const whoWeWorkWithRef = useRef<HTMLElement>(null);
  const howWeWorkRef = useRef<HTMLElement>(null);
  const retainerRef = useRef<HTMLElement>(null);
  const workedWithRef = useRef<HTMLElement>(null);
  const connectRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const refs = {
      hero: heroRef,
      what_we_do: whatWeDoRef,
      who_we_work_with: whoWeWorkWithRef,
      how_we_work: howWeWorkRef,
      retainer_partnerships: retainerRef,
      who_weve_worked_with: workedWithRef,
      lets_connect: connectRef,
    };

    // Calculate initial section offsets
    const calculateSectionOffsets = () => {
      const offsets: Record<string, number> = {};
      Object.entries(refs).forEach(([section, ref]) => {
        if (ref.current) {
          offsets[section] = ref.current.offsetTop;
        }
      });
      setSectionOffsets(offsets);
    };

    // Calculate offsets on mount and resize
    calculateSectionOffsets();
    window.addEventListener('resize', calculateSectionOffsets);

    const observer = new IntersectionObserver(
      (entries) => {
        const newVisibleSections: Record<string, boolean> = {};
        
        entries.forEach((entry) => {
          const sectionName = entry.target.getAttribute('data-section');
          if (sectionName) {
            newVisibleSections[sectionName] = entry.isIntersecting;
          }
        });
        
        setVisibleSections(prev => ({ ...prev, ...newVisibleSections }));
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    Object.entries(refs).forEach(([section, ref]) => {
      if (ref.current) {
        ref.current.setAttribute('data-section', section);
        observer.observe(ref.current);
      }
    });

    return () => {
      window.removeEventListener('resize', calculateSectionOffsets);
      Object.values(refs).forEach(ref => {
        if (ref.current) observer.unobserve(ref.current);
      });
    };
  }, []);

  const getParallaxTransform = (sectionName: string, intensity: number = 0.5) => {
    if (!sectionOffsets[sectionName]) {
      return 'translateY(0px)';
    }
    
    const sectionTop = sectionOffsets[sectionName];
    const scrollProgress = scrollY - sectionTop;
    
    // Only apply parallax when the section is in the viewport area
    if (scrollProgress < -window.innerHeight || scrollProgress > window.innerHeight * 2) {
      return 'translateY(0px)';
    }
    
    const maxMovement = window.innerHeight * 0.3; // Allow more movement
    const movement = Math.max(-maxMovement, Math.min(scrollProgress * intensity, maxMovement));
    return `translateY(${movement}px)`;
  };

  // Modal functions
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

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-black">
        {(() => {
          const heroMedia = getBackgroundMedia(websiteSettings || [], "hero");
          if (!heroMedia) return null;
          
          return heroMedia?.type === "video" ? (
            <video
              className="absolute inset-0 w-full object-cover parallax-bg"
              style={{
                height: '180%',
                top: '-40%',
                transform: getParallaxTransform('hero', 0.4),
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
              className="absolute bg-cover bg-center parallax-bg"
              style={{
                backgroundImage: `url('${heroMedia.url}')`,
                width: '100%',
                height: '180%',
                top: '-40%',
                left: '0',
                transform: getParallaxTransform('hero', 0.4),
              }}
            />
          );
        })()}
        {getBackgroundMedia(websiteSettings || [], "hero") && (
          <div className="absolute inset-0 hero-video-overlay" />
        )}
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 animate-fade-in hero-content">
          <h1 className="font-black mb-6 leading-tight">
            <span className="hero-title">Cinematic Video.</span>
            <span className="block hero-accent">Creative Direction.</span>
            <span className="block hero-accent">Strategic Delivery.</span>
          </h1>
          <p className="mb-8 hero-subtitle max-w-2xl mx-auto">
            We're a video production team creating bold story driven content for brands, agencies, artists and events.
          </p>
          <div className="flex justify-center">
            <Link href="/contact">
              <Button size="lg" variant="glassPrimary" className="px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105">
                Let's Create
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section ref={whatWeDoRef} className="relative py-20 bg-white dark:bg-black overflow-hidden">
        {(() => {
          const whatWeDoMedia = getBackgroundMedia(websiteSettings || [], "what_we_do");
          if (!whatWeDoMedia) return null;
          
          return whatWeDoMedia?.type === "video" ? (
            <video
              className="absolute inset-0 w-full object-cover parallax-bg opacity-20"
              style={{
                height: '200%',
                top: '-50%',
                transform: getParallaxTransform('what_we_do', 0.3),
              }}
              src={whatWeDoMedia.url}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
            />
          ) : (
            <div 
              className="absolute bg-cover bg-center parallax-bg opacity-20"
              style={{
                backgroundImage: `url('${whatWeDoMedia.url}')`,
                width: '100%',
                height: '200%',
                top: '-50%',
                left: '0',
                transform: getParallaxTransform('what_we_do', 0.3),
              }}
            />
          );
        })()}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">What We Do</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Visuals That Go Beyond Just Looking Good
            </p>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-8">
              We craft high impact video content with intention, depth and cinematic quality.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-8">
              From brand stories and campaign films to live events and music videos, we bring a full spectrum approach, blending creative thinking, technical precision and an instinct for storytelling.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
              Led by Dan, our team collaborates closely with every client to deliver work that's not just on brief, 
              but ahead of it.
            </p>
          </div>

          {/* Featured Work */}
          <div className="mt-16">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : featuredMedia && featuredMedia.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center mx-auto">
                {featuredMedia.map((media: any) => (
                  <Card 
                    key={media.id} 
                    className="group cursor-pointer overflow-hidden glass-card"
                    onClick={() => openVideoModal(media)}
                  >
                    <div className="relative">
                      {media.type === "image" ? (
                        <img 
                          src={media.url} 
                          alt={media.title}
                          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <video 
                          src={media.url}
                          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            // Set video to show a frame at 2 seconds for thumbnail if no poster
                            if (!media.posterUrl) {
                              e.currentTarget.currentTime = 2;
                            }
                          }}
                          poster={media.posterUrl || undefined}
                        />
                      )}

                      {/* Overlay with play icon for videos */}
                      {media.type === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 rounded-full p-4">
                            <Play className="h-8 w-8 text-black" />
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
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No featured work available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Who We Work With Section */}
      <section ref={whoWeWorkWithRef} className="relative py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {(() => {
          const whoWeWorkWithMedia = getBackgroundMedia(websiteSettings || [], "who_we_work_with");
          if (!whoWeWorkWithMedia) return null;
          
          return whoWeWorkWithMedia?.type === "video" ? (
            <video
              className="absolute inset-0 w-full object-cover parallax-bg opacity-10"
              style={{
                height: '170%',
                top: '-35%',
                transform: getParallaxTransform('who_we_work_with', 0.25),
              }}
              src={whoWeWorkWithMedia.url}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
            />
          ) : (
            <div 
              className="absolute bg-cover bg-center parallax-bg opacity-10"
              style={{
                backgroundImage: `url('${whoWeWorkWithMedia.url}')`,
                width: '100%',
                height: '170%',
                top: '-35%',
                left: '0',
                transform: getParallaxTransform('who_we_work_with', 0.25),
              }}
            />
          );
        })()}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Who We Work With</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              We Collaborate With Visionaries
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <p className="text-base text-gray-600 dark:text-gray-400 mb-8">Our clients are:</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-4 mb-8 list-none">
              <li>• Creative agencies & brand leaders</li>
              <li>• Luxury event producers & performers</li>
              <li>• Musicians, labels & visual artists</li>
              <li>• Ambitious founders and businesses</li>
              <li>• Corporate teams with a creative edge</li>
            </ul>
            <p className="text-base text-gray-600 dark:text-gray-400">
              If you're building something that deserves to be seen and felt, we're the right creative partner.
            </p>
          </div>
        </div>
      </section>

      {/* How We Work Section */}
      <section ref={howWeWorkRef} className="relative py-20 bg-white dark:bg-black overflow-hidden">
        {(() => {
          const howWeWorkMedia = getBackgroundMedia(websiteSettings || [], "how_we_work");
          if (!howWeWorkMedia) return null;
          
          return howWeWorkMedia?.type === "video" ? (
            <video
              className="absolute inset-0 w-full object-cover parallax-bg opacity-10"
              style={{
                height: '170%',
                top: '-35%',
                transform: getParallaxTransform('how_we_work', 0.25),
              }}
              src={howWeWorkMedia.url}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
            />
          ) : (
            <div 
              className="absolute bg-cover bg-center parallax-bg opacity-10"
              style={{
                backgroundImage: `url('${howWeWorkMedia.url}')`,
                width: '100%',
                height: '170%',
                top: '-35%',
                left: '0',
                transform: getParallaxTransform('how_we_work', 0.25),
              }}
            />
          );
        })()}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">How We Work</h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Creative. Cinematic. Consistent.
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Every project is different but our process is always rooted in:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Card className="p-6 glass-card">
                <h3 className="text-xl font-bold mb-4">Creative Direction</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Ideas, concepts, and story arcs that elevate the vision
                </p>
              </Card>
              <Card className="p-6 glass-card">
                <h3 className="text-xl font-bold mb-4">Cinematic Execution</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Directing, filming and editing with clarity and edge
                </p>
              </Card>
              <Card className="p-6 glass-card">
                <h3 className="text-xl font-bold mb-4">Post-Production That Pops</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Sound design, colour grading, and delivery that makes an impact
                </p>
              </Card>
              <Card className="p-6 glass-card">
                <h3 className="text-xl font-bold mb-4">Ongoing Partnerships</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  For those who need consistent, aligned, long-term video creation
                </p>
              </Card>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              We move fast, think ahead, and deliver.
            </p>
          </div>
        </div>
      </section>

      {/* Retainer Partnerships Section */}
      <section ref={retainerRef} className="relative py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {(() => {
          const retainerMedia = getBackgroundMedia(websiteSettings || [], "retainer_partnerships");
          if (!retainerMedia) return null;
          
          return retainerMedia?.type === "video" ? (
            <video
              className="absolute inset-0 w-full object-cover parallax-bg opacity-10"
              style={{
                height: '170%',
                top: '-35%',
                transform: getParallaxTransform('retainer_partnerships', 0.25),
              }}
              src={retainerMedia.url}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
            />
          ) : (
            <div 
              className="absolute bg-cover bg-center parallax-bg opacity-10"
              style={{
                backgroundImage: `url('${retainerMedia.url}')`,
                width: '100%',
                height: '170%',
                top: '-35%',
                left: '0',
                transform: getParallaxTransform('retainer_partnerships', 0.25),
              }}
            />
          );
        })()}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Retainer Partnerships</h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Consistent Content. Creative Leadership. A Team You Can Rely On.
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              For agencies, brands, and performers who need ongoing, high quality video: we offer monthly retainers built around your needs.
            </p>
            
            <Card className="p-8 glass-card mb-8">
              <h3 className="text-2xl font-bold mb-6">You get:</h3>
              <ul className="text-lg text-gray-600 dark:text-gray-400 space-y-4">
                <li>• Priority scheduling</li>
                <li>• Dedicated shoot days per month</li>
                <li>• Post-production and delivery</li>
                <li>• Strategic input & idea generation</li>
                <li>• A trusted creative partner who grows with your vision</li>
              </ul>
            </Card>

            <div>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                The best stories are told over time, not just once.
              </p>
              <p className="text-xl font-semibold">
                Let's build something long term.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We've Worked With Section */}
      <section ref={workedWithRef} className="relative py-20 bg-white dark:bg-black overflow-hidden">
        {(() => {
          const workedWithMedia = getBackgroundMedia(websiteSettings || [], "who_weve_worked_with");
          if (!workedWithMedia) return null;
          
          return workedWithMedia?.type === "video" ? (
            <video
              className="absolute inset-0 w-full object-cover parallax-bg opacity-10"
              style={{
                height: '170%',
                top: '-35%',
                transform: getParallaxTransform('who_weve_worked_with', 0.25),
              }}
              src={workedWithMedia.url}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
            />
          ) : (
            <div 
              className="absolute bg-cover bg-center parallax-bg opacity-10"
              style={{
                backgroundImage: `url('${workedWithMedia.url}')`,
                width: '100%',
                height: '170%',
                top: '-35%',
                left: '0',
                transform: getParallaxTransform('who_weve_worked_with', 0.25),
              }}
            />
          );
        })()}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Who We've Worked With</h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Trusted by standout names across music, events, and media.
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              We've had the privilege of collaborating with leading teams and performers, including:
            </p>
            
            <div className="mb-8">
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                The Function Band · Denfield Advertising Agency · Cosmic Violet Events · Molto Music Group · Beat Play Live · C2C · Crystal Productions
              </p>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-400">
              From fast turnaround campaigns to high end celebrations and content that lives far beyond the event, we bring the same energy, care, and cinematic quality to everything we do.
            </p>
          </div>
        </div>
      </section>

      {/* Let's Connect Section */}
      <section ref={connectRef} className="relative py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {(() => {
          const connectMedia = getBackgroundMedia(websiteSettings || [], "lets_connect");
          if (!connectMedia) return null;
          
          return connectMedia?.type === "video" ? (
            <video
              className="absolute inset-0 w-full object-cover parallax-bg opacity-10"
              style={{
                height: '170%',
                top: '-35%',
                transform: getParallaxTransform('lets_connect', 0.25),
              }}
              src={connectMedia.url}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
            />
          ) : (
            <div 
              className="absolute bg-cover bg-center parallax-bg opacity-10"
              style={{
                backgroundImage: `url('${connectMedia.url}')`,
                width: '100%',
                height: '170%',
                top: '-35%',
                left: '0',
                transform: getParallaxTransform('lets_connect', 0.25),
              }}
            />
          );
        })()}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-6">Let's Connect</h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Start The Conversation
            </p>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Whether you need a one off project or a long term video partner, we'd love to hear what you're building.
            </p>
            
            <Link href="/contact">
              <Button size="lg" variant="glassPrimary" className="px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105">
                Get In Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* Full-screen Media Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={closeVideoModal}>
        <DialogContent className="p-0 overflow-hidden bg-black/95 border-none w-[80vw] max-w-none max-h-[95vh] h-auto" aria-describedby="media-player-description">
          <DialogTitle className="sr-only">
            Media Player - {selectedVideo?.title}
          </DialogTitle>
          <div id="media-player-description" className="sr-only">
            Full-screen media player for {selectedVideo?.title}
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

            {/* Close button for images */}
            {selectedVideo?.type === "image" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  closeVideoModal();
                }}
                className="absolute top-4 right-4 z-30 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
