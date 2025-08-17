import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Check, Video, Film, Building2, Music, Tv, Scissors, Wine, at-sign } from "lucide-react";
import { getBackgroundMedia, useWebsiteSettings } from "@/lib/background-utils";

const services = [
  {
    title: "Corporate Video Production",
    description: "From promotional videos and training films to brand stories and internal communications, we craft polished corporate videos that build trust and engage your target audience.",
    features: [
      "Creative concept development",
      "Professional cinematography",
      "High-end post-production",
      "Multi-platform optimization",
      "Brand integration strategy"
    ],
    icon: Building2
  },
  {
    title: "Commercial Video Production",
    description: "We produce dynamic commercial videos and adverts that highlight your products or services, designed to boost brand awareness and drive sales",
    features: [
      "Story development & research",
      "Interview-style filming",
      "Narrative editing",
      "Color grading & sound design",
      "Distribution strategy"
    ],
    icon: Video
  },
  {
    title: "Documentary Filmmaking",
    description: "Our documentary services focus on authentic storytelling, capturing real-life stories with depth, emotion, and cinematic flair.",
    features: [
      "Company profile videos",
      "Training & educational content",
      "Event documentation",
      "Internal communications",
      "Recruitment videos"
    ],
    icon: Film
  },
  {
    title: "Luxury Event Videography",
    description: "Capture the elegance and atmosphere of your luxury events with our discreet, professional videography that preserves every special moment in stunning detail.",
    features: [
      "Creative direction",
      "Location scouting",
      "Performance filming",
      "Visual effects",
      "Artistic editing"
    ],
    icon: Wine
  },
  {
    title: "Music Video Production",
    description: "We bring your music to life with creative, visually striking music videos tailored to your style and audience.",
    features: [
      "Multi-camera setups",
      "Live streaming options",
      "Highlight reels",
      "Full event documentation",
      "Same-day delivery options"
    ],
    icon: Music
  },
  {
    title: "Social Media Content Creation",
    description: "Short form video content crafted specifically for social media platforms to help you reach and engage your audience online effectively.",
    features: [
      "Professional editing",
      "Color correction & grading",
      "Sound design & mixing",
      "Motion graphics",
      "Format optimization"
    ],
    icon: at-sign
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

  // Add theme icon color CSS variable for icons (client-side only)
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('theme-icon-style')) {
      const style = document.createElement('style');
      style.id = 'theme-icon-style';
      style.innerHTML = '[data-theme-icon]{color:#000;}html.dark [data-theme-icon]{color:#fff;}';
      document.head.appendChild(style);
    }
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
              className="absolute inset-0 w-full h-full object-cover parallax-bg opacity-10"
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
            At dt. visuals, we offer a comprehensive range of professional video production services designed to meet the diverse needs of our clients across the UK. 
            Whether you’re planning a high end event, a commercial campaign, or an engaging documentary, our expert team delivers cinematic quality and creative storytelling that makes your vision come alive.
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
                  <div className="mb-4 flex items-center justify-center">
                    {(() => {
                      const Icon = service.icon;
                      return (
                        <Icon className="h-10 w-10"
                          style={{
                            color: 'var(--icon-color)',
                          }}
                          data-theme-icon
                        />
                      );
                    })()}
                  </div>
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
              At dt. visuals, we believe a smooth, collaborative process is key to delivering outstanding video production that exceeds your expectations. 
              Here’s how we bring your vision to life, from initial idea to final cut.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Discovery & Concept</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We dive into your goals and creative vision to craft a concept that fits your brand and project perfectly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-accent-foreground">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Planning & Preparation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                From scripts and storyboards to locations, talent, and logistics, we handle every detail so filming runs seamlessly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Production & Filming</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our expert crew captures high quality, cinematic footage for corporate videos, live events, and music projects.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-accent-foreground">4</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Post-Production & Delivery</h3>
              <p className="text-gray-600 dark:text-gray-400">
                From editing and colour grading to sound design and motion graphics, we deliver polished, platform ready videos, with ongoing support for future projects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-black text-white overflow-hidden">
        {(() => {
          const servicesCtaMedia = getBackgroundMedia(websiteSettings || [], "services_cta");
          if (!servicesCtaMedia) return null;
          
          return servicesCtaMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover parallax-bg opacity-20"
              style={{ transform: `translateY(${scrollY * 0.1}px)` }}
              autoPlay
              loop
              muted
              playsInline
              src={servicesCtaMedia.url}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center parallax-bg opacity-20"
              style={{
                backgroundImage: `url('${servicesCtaMedia.url}')`,
                transform: `translateY(${scrollY * 0.1}px)`,
              }}
            />
          );
        })()}
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
