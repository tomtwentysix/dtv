import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Phone, MapPin, Instagram, Youtube, Linkedin, Facebook } from "lucide-react";
import { getBackgroundMedia, useWebsiteSettings } from "@/lib/background-utils";
import { useContactStructuredData } from "@/hooks/use-structured-data";
import { useContactSEO } from "@/hooks/use-seo-meta";

export default function Contact() {
  // SEO and structured data
  useContactStructuredData();
  useContactSEO();
  const { toast } = useToast();
  const [scrollY, setScrollY] = useState(0);
  const scrollYTarget = useRef(0);
  const rafRef = useRef<number>();
  const { data: websiteSettings } = useWebsiteSettings();
  
  // Fetch contact information
  const { data: contactInfo } = useQuery({
    queryKey: ['/api/contact-info'],
  });

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
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    projectType: "",
    message: "",
  });

  const contactMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "Thank you for your inquiry. We'll get back to you soon.",
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        projectType: "",
        message: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header */}
      <section className="relative pt-24 pb-12 h-96 flex items-center justify-center overflow-hidden bg-white dark:bg-black">
        {(() => {
          const contactHeaderMedia = getBackgroundMedia(websiteSettings || [], "contact_header");
          if (!contactHeaderMedia) return null;
          
          return contactHeaderMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover parallax-bg"
              style={{ transform: `translateY(${scrollY * 0.5}px)` }}
              autoPlay
              loop
              muted
              playsInline
              src={contactHeaderMedia.url}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center parallax-bg"
              style={{
                backgroundImage: `url('${contactHeaderMedia.url}')`,
                transform: `translateY(${scrollY * 0.5}px)`,
              }}
            />
          );
        })()}
        {getBackgroundMedia(websiteSettings || [], "contact_header") && (
          <div className="absolute inset-0 hero-video-overlay" />
        )}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 hero-title">Get In Touch</h1>
          <p className="text-xl max-w-3xl mx-auto hero-subtitle">
            Ready to bring your vision to life? Let's discuss your project and create something extraordinary together.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-20 overflow-hidden">
        {(() => {
          const contactInfoMedia = getBackgroundMedia(websiteSettings || [], "contact_info");
          if (!contactInfoMedia) return null;
          
          return contactInfoMedia.type === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              src={contactInfoMedia.url}
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${contactInfoMedia.url}')`,
              }}
            />
          );
        })()}
        {getBackgroundMedia(websiteSettings || [], "contact_info") && (
          <div className="absolute inset-0 hero-video-overlay" />
        )}
        <div 
          className={`${getBackgroundMedia(websiteSettings || [], "contact_info") ? 'relative z-10' : ''} max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`}
          style={{
            backgroundColor: getBackgroundMedia(websiteSettings || [], "contact_info") ? 'transparent' : undefined,
          }}
        >
          {!getBackgroundMedia(websiteSettings || [], "contact_info") && (
            <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900" />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="cinematic-shadow">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Start Your Project</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="projectType">Project Type</Label>
                    <Select value={formData.projectType} onValueChange={(value) => handleInputChange("projectType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="music-video">Music Video</SelectItem>
                        <SelectItem value="event">Event Coverage</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder="Tell us about your project..."
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full btn-primary"
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {(contactInfo as any)?.contactEmail || 'hello@dt.visuals'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                      <Phone className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {(contactInfo as any)?.contactPhone || '+1 (555) 123-4567'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {(contactInfo as any)?.contactAddress || 'Los Angeles, CA'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Follow Our Work</h4>
                <div className="flex space-x-4">
                  {(contactInfo as any)?.instagramUrl && (
                    <a 
                      href={(contactInfo as any).instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:bg-accent hover:text-white transition-all duration-200"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {(contactInfo as any)?.facebookUrl && (
                    <a 
                      href={(contactInfo as any).facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:bg-accent hover:text-white transition-all duration-200"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {(contactInfo as any)?.linkedinUrl && (
                    <a 
                      href={(contactInfo as any).linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:bg-accent hover:text-white transition-all duration-200"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Response Time */}
              <Card className="p-6">
                <CardContent className="p-0">
                  <h4 className="text-lg font-semibold mb-2">Response Time</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    We typically respond to inquiries within 24 hours. For urgent projects, 
                    please call us directly.
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
