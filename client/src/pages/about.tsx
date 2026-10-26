import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { getBackgroundMedia, useWebsiteSettings } from "@/lib/background-utils";
import { useAboutStructuredData } from "@/hooks/use-structured-data";
import { useAboutSEO } from "@/hooks/use-seo-meta";

export default function About() {
  // SEO and structured data
  useAboutStructuredData();
  useAboutSEO();
  const [scrollY, setScrollY] = useState(0);
  const scrollYTarget = useRef(0);
  const rafRef = useRef<number>();

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

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header */}
      <section className="relative pt-24 pb-12 h-96 flex items-center justify-center overflow-hidden bg-white dark:bg-black">
        {(() => {
          const aboutHeaderMedia = getBackgroundMedia(websiteSettings || [], "about_header");
          if (!aboutHeaderMedia) return null;
          
          return aboutHeaderMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover parallax-bg"
              style={{ transform: `translateY(${scrollY * 0.5}px)` }}
              autoPlay
              loop
              muted
              playsInline
              src={aboutHeaderMedia.url}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center parallax-bg"
              style={{
                backgroundImage: `url('${aboutHeaderMedia.url}')`,
                transform: `translateY(${scrollY * 0.5}px)`,
              }}
            />
          );
        })()}
        {getBackgroundMedia(websiteSettings || [], "about_header") && (
          <div className="absolute inset-0 hero-video-overlay" />
        )}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 hero-title">About dt.visuals</h1>
          <p className="text-xl max-w-3xl mx-auto hero-subtitle">
            We are passionate storytellers crafting cinematic experiences that resonate with audiences worldwide.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                At dt. visuals, we specialise in premium video production services that bring your brand story to life through powerful, cinematic visual storytelling. 
                Based in Leicestershire and serving clients UK wide, we create compelling videos tailored for luxury events, corporate communications, commercial projects, documentaries, music industry productions, and more.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Our mission is to deliver high quality, engaging video content that captivates audiences and strengthens meaningful connections between brands and their communities. 
                By combining cutting-edge technology with creative vision and professional expertise, dt. visuals consistently exceeds client expectations and sets new standards in the UK video production industry.
              </p>
               <p className="text-lg text-gray-600 dark:text-gray-400">
                Whether you need commercial videos, documentary filmmaking, corporate videos, event videography, or music video production, we are passionate about transforming your ideas into unforgettable visual experiences.
              </p>
            </div>
            <div className="relative">
              {(() => {
                const missionImage = (websiteSettings || []).find((s) => s.section === "about_mission_image")?.backgroundImage;
                if (missionImage) {
                  return (
                    <img
                      src={missionImage.url}
                      alt={missionImage.title || "Mission section image"}
                      className="rounded-lg cinematic-shadow"
                    />
                  );
                }
                // fallback image if not set
                return (
                  <img
                    src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                    alt="Film crew in action"
                    className="rounded-lg cinematic-shadow"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative py-20 bg-white dark:bg-black overflow-hidden">
        {(() => {
          const aboutValuesMedia = getBackgroundMedia(websiteSettings || [], "about_values");
          if (!aboutValuesMedia) return null;
          
          return aboutValuesMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover parallax-bg opacity-10"
              style={{ transform: `translateY(${scrollY * 0.3}px)` }}
              autoPlay
              loop
              muted
              playsInline
              src={aboutValuesMedia.url}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center parallax-bg opacity-10"
              style={{
                backgroundImage: `url('${aboutValuesMedia.url}')`,
                transform: `translateY(${scrollY * 0.3}px)`,
              }}
            />
          );
        })()}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Our Values</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                At dt. visuals, we believe exceptional video production starts with strong values that guide our craft and client relationships.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 text-center glass-card">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Creativty & Excellence</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Innovative ideas and meticulous attention to detail combine to create cinematic videos that captivate and inspire.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-8 text-center glass-card">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Client Collaboration</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your vision drives every step, we partner closely to ensure your story is told authentically and effectively.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-8 text-center glass-card">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Professionalism & Reliability</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Clear communication, punctual delivery, and a seamless process are our promises to you.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}