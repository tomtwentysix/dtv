import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getBackgroundMedia, useWebsiteSettings } from "@/lib/background-utils";

export default function Home() {
  const { data: featuredMedia, isLoading } = useQuery({
    queryKey: ["/api/media/featured"],
  });

  const { data: websiteSettings } = useWebsiteSettings();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-black">
        {(() => {
          const heroMedia = getBackgroundMedia(websiteSettings || [], "hero");
          if (!heroMedia) return null;
          
          return heroMedia?.type === "video" ? (
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
        {getBackgroundMedia(websiteSettings || [], "hero") && (
          <div className="absolute inset-0 hero-video-overlay" />
        )}
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            <span className="hero-title">Cinematic Video.</span>
            <span className="block hero-accent">Creative Direction.</span>
            <span className="block hero-accent">Strategic Delivery.</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 hero-subtitle max-w-2xl mx-auto">
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
      <section className="relative py-20 bg-white dark:bg-black overflow-hidden">
        {(() => {
          const featuredMedia = getBackgroundMedia(websiteSettings || [], "featured_work");
          if (!featuredMedia) return null;
          
          return featuredMedia?.type === "video" ? (
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
            <h2 className="text-5xl font-bold mb-6">What We Do</h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Visuals That Go Beyond Just Looking Good
            </p>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-8">
              We craft high impact video content with intention, depth and cinematic quality.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-8">
              From brand stories and campaign films to live events and music videos, we bring a full spectrum approach, blending creative thinking, technical precision and an instinct for storytelling.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
              Led by Dan, our team collaborates closely with every client to deliver work that's not just on brief, but ahead of it.
            </p>
          </div>

          <div className="text-center mt-12">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Insert showreel embed to view
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Work With Section */}
      <section className="relative py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Who We Work With</h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              We Collaborate With Visionaries
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Our clients are:</p>
            <ul className="text-lg text-gray-600 dark:text-gray-400 space-y-4 mb-8">
              <li>• Creative agencies & brand leaders</li>
              <li>• Luxury event producers & performers</li>
              <li>• Musicians, labels & visual artists</li>
              <li>• Ambitious founders and businesses</li>
              <li>• Corporate teams with a creative edge</li>
            </ul>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              If you're building something that deserves to be seen and felt, we're the right creative partner.
            </p>
          </div>
        </div>
      </section>

      {/* How We Work Section */}
      <section className="relative py-20 bg-white dark:bg-black overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">How We Work</h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Creative. Cinematic. Consistent.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
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
            <p className="text-xl text-gray-600 dark:text-gray-400 text-center">
              We move fast, think ahead, and deliver with polish.
            </p>
          </div>
        </div>
      </section>

      {/* Retainer Partnerships Section */}
      <section className="relative py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Retainer Partnerships</h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Consistent Content. Creative Leadership. A Team You Can Rely On.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              For agencies, brands, and performers who need ongoing, high quality video: we offer monthly retainers built around your needs.
            </p>
            
            <Card className="p-8 glass-card mb-8">
              <h3 className="text-2xl font-bold mb-6">You get:</h3>
              <ul className="text-lg text-gray-600 dark:text-gray-400 space-y-4">
                <li>• Priority scheduling</li>
                <li>• 1–2 shoot days per month</li>
                <li>• Post-production and delivery</li>
                <li>• Strategic input & idea generation</li>
                <li>• A trusted creative partner who grows with your vision</li>
              </ul>
            </Card>

            <div className="text-center">
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
      <section className="relative py-20 bg-white dark:bg-black overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Who We've Worked With</h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Trusted by standout names across music, events, and media.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              We've had the privilege of collaborating with leading teams and performers, including:
            </p>
            
            <div className="text-center mb-8">
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                The Function Band · Denfield Advertising Agency · Cosmic Violet Events · Molto Music Group · Beat Play Live · C2C · Crystal Productions
              </p>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-400 text-center">
              From fast turnaround campaigns to high end celebrations and content that lives far beyond the event, we bring the same energy, care, and cinematic quality to everything we do.
            </p>
          </div>
        </div>
      </section>

      {/* Let's Connect Section */}
      <section className="relative py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden">
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


      <Footer />
    </div>
  );
}
