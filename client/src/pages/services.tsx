import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Check } from "lucide-react";
import { getBackgroundMedia, useWebsiteSettings } from "@/lib/background-utils";

const services = [
  {
    title: "Commercial Production",
    description: "Brand storytelling through cinematic commercials that connect with your audience and drive results.",
    features: [
      "Creative concept development",
      "Professional cinematography",
      "High-end post-production",
      "Multi-platform optimization",
      "Brand integration strategy"
    ],
    icon: "📹"
  },
  {
    title: "Documentary Films",
    description: "Compelling documentary films that capture real stories and authentic emotions with cinematic quality.",
    features: [
      "Story development & research",
      "Interview-style filming",
      "Narrative editing",
      "Color grading & sound design",
      "Distribution strategy"
    ],
    icon: "🎬"
  },
  {
    title: "Corporate Videos",
    description: "Professional corporate content that elevates your business communication and company culture.",
    features: [
      "Company profile videos",
      "Training & educational content",
      "Event documentation",
      "Internal communications",
      "Recruitment videos"
    ],
    icon: "🏢"
  },
  {
    title: "Music Videos",
    description: "Creative music video production that brings artists' visions to life with stunning visuals.",
    features: [
      "Creative direction",
      "Location scouting",
      "Performance filming",
      "Visual effects",
      "Artistic editing"
    ],
    icon: "🎵"
  },
  {
    title: "Event Coverage",
    description: "Comprehensive event documentation capturing key moments with professional cinematic quality.",
    features: [
      "Multi-camera setups",
      "Live streaming options",
      "Highlight reels",
      "Full event documentation",
      "Same-day delivery options"
    ],
    icon: "📺"
  },
  {
    title: "Post-Production",
    description: "Expert editing and post-production services to transform raw footage into polished content.",
    features: [
      "Professional editing",
      "Color correction & grading",
      "Sound design & mixing",
      "Motion graphics",
      "Format optimization"
    ],
    icon: "✂️"
  }
];

export default function Services() {
  const [scrollY, setScrollY] = useState(0);

  // Get website settings for backgrounds
  const { data: websiteSettings } = useWebsiteSettings();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header */}
      <section className="relative pt-24 pb-12 h-96 flex items-center justify-center overflow-hidden bg-white dark:bg-black">
        {(() => {
          const servicesHeaderMedia = getBackgroundMedia(websiteSettings || [], "services_header");
          if (!servicesHeaderMedia) return null;
          
          return servicesHeaderMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover parallax-bg"
              style={{ transform: `translateY(${scrollY * 0.5}px)` }}
              autoPlay
              loop
              muted
              playsInline
              src={servicesHeaderMedia.url}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center parallax-bg"
              style={{
                backgroundImage: `url('${servicesHeaderMedia.url}')`,
                transform: `translateY(${scrollY * 0.5}px)`,
              }}
            />
          );
        })()}
        {getBackgroundMedia(websiteSettings || [], "services_header") && (
          <div className="absolute inset-0 hero-video-overlay" />
        )}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 hero-title">Our Services</h1>
          <p className="text-xl max-w-3xl mx-auto hero-subtitle">
            From concept to delivery, we provide comprehensive video production services tailored to your unique needs.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="relative py-20 bg-white dark:bg-black overflow-hidden">
        {(() => {
          const servicesSectionMedia = getBackgroundMedia(websiteSettings || [], "services_section");
          if (!servicesSectionMedia) return null;
          
          return servicesSectionMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover parallax-bg opacity-10"
              style={{ transform: `translateY(${scrollY * 0.3}px)` }}
              autoPlay
              loop
              muted
              playsInline
              src={servicesSectionMedia.url}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center parallax-bg opacity-10"
              style={{
                backgroundImage: `url('${servicesSectionMedia.url}')`,
                transform: `translateY(${scrollY * 0.3}px)`,
              }}
            />
          );
        })()}
        <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="h-full glass-card hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <CardTitle className="text-2xl font-bold">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {service.description}
                  </p>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Our Process</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              A streamlined approach that ensures exceptional results from start to finish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Discovery</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Understanding your vision, goals, and requirements through detailed consultation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-accent-foreground">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Planning</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Developing concepts, storyboards, and production schedules tailored to your project.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Production</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Professional filming with state-of-the-art equipment and experienced crew.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-accent-foreground">4</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Delivery</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Expert post-production and final delivery in your preferred formats and specifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-black text-white overflow-hidden">
        {servicesCta.backgroundType === 'video' ? (
          <video
            className="absolute inset-0 w-full h-full object-cover parallax-bg opacity-20"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
            autoPlay
            loop
            muted
            playsInline
            src={servicesCta.backgroundUrl}
          />
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center parallax-bg opacity-20"
            style={{
              backgroundImage: `url('${servicesCta.backgroundUrl || 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080'}')`,
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          />
        )}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6 hero-title">Ready to Bring Your Vision to Life?</h2>
          <p className="text-xl mb-8 hero-subtitle">
            Let's discuss your project and create something extraordinary together.
          </p>
          <Link href="/contact">
            <Button variant="glassOutline" size="lg" className="text-white border-white hover:bg-white/20">
              Start Your Project
            </Button>
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
