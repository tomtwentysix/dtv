import { AdminNavigation } from "@/components/admin-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import * as React from "react";
import { 
  Image as ImageIcon,
  Loader2,
  Search,
  Plus,
  Play,
  Contact,
  Building,
  Save,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  FileText,
  RefreshCcw
} from "lucide-react";
import { BrandingManager } from "@/components/branding-manager";
import { queryClient } from "@/lib/queryClient";
import { useSeoSettings, useUpdateSeoSettings } from "@/hooks/use-seo-settings";

type MediaType = {
  id: string;
  title: string;
  type: 'image' | 'video';
  url: string;
  filename: string;
  mime_type: string;
  tags?: string[];
  uploaded_by: string;
  is_featured: boolean;
  created_at: string;
};

type WebsiteSettingsType = {
  id: string;
  section: 'hero' | 'what_we_do' | 'who_we_work_with' | 'how_we_work' | 'retainer_partnerships' | 'who_weve_worked_with' | 'lets_connect' | 'portfolio_header' | 'portfolio_gallery' | 'about_header' | 'about_mission_image' | 'about_values' | 'services_header' | 'services_section' | 'services_cta' | 'contact_header' | 'contact_info';
  backgroundImageId: string | null;
  backgroundVideoId: string | null;
  backgroundImage?: MediaType;
  backgroundVideo?: MediaType;
  updatedAt: string;
  updatedBy: string;
};

function MediaSelectionDialog({ 
  section, 
  onSelect, 
  isOpen, 
  onOpenChange,
  mediaTypeFilter
}: { 
  section: string;
  onSelect: (mediaId: string, mediaType: 'image' | 'video') => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mediaTypeFilter?: 'image' | 'video' | 'all';
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all media
  const { data: allMedia = [], isLoading: isMediaLoading } = useQuery<MediaType[]>({
    queryKey: ['/api/media'],
  });

  // Filter media based on search query and media type
  const filteredMedia = allMedia.filter(media => {
    const matchesSearch = media.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (media.tags && media.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesType = !mediaTypeFilter || mediaTypeFilter === 'all' || media.type === mediaTypeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Background for {section.replace('_', ' ')} Section</DialogTitle>
        </DialogHeader>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search media by title or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto">
          {isMediaLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No media found matching your search.' : 'No media available.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
              {filteredMedia.map((media) => (
                <div
                  key={media.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all bg-muted/50"
                  onClick={() => {
                    onSelect(media.id, media.type);
                    onOpenChange(false);
                  }}
                >
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={media.title}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="relative">
                      <video
                        src={media.url}
                        className="w-full h-32 object-cover"
                        muted
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          const video = e.target as HTMLVideoElement;
                          video.currentTime = 2;
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-white/90 rounded-full p-2">
                          <Play className="w-4 h-4 text-black" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary" className="text-xs">
                      Select
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">{media.title}</p>
                    <p className="text-white/70 text-xs capitalize">{media.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WebsiteCustomization() {
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  // Fetch current website settings
  const { data: websiteSettings = [], isLoading: isSettingsLoading } = useQuery<WebsiteSettingsType[]>({
    queryKey: ['/api/website-settings'],
  });

  // Fetch contact information
  const { data: contactInfo, isLoading: isContactLoading } = useQuery({
    queryKey: ['/api/contact-info'],
  });

  // Contact info form state
  const [contactForm, setContactForm] = useState({
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    instagramUrl: '',
    facebookUrl: '',
    linkedinUrl: ''
  });

  // Initialize contact form when data loads
  React.useEffect(() => {
    if (contactInfo) {
      setContactForm({
        contactEmail: (contactInfo as any).contactEmail || '',
        contactPhone: (contactInfo as any).contactPhone || '',
        contactAddress: (contactInfo as any).contactAddress || '',
        instagramUrl: (contactInfo as any).instagramUrl || '',
        facebookUrl: (contactInfo as any).facebookUrl || '',
        linkedinUrl: (contactInfo as any).linkedinUrl || ''
      });
    }
  }, [contactInfo]);

  // Fetch SEO settings
  const { data: seoSettings, isLoading: isSeoLoading } = useSeoSettings();

  // SEO settings mutation
  const updateSeoMutation = useUpdateSeoSettings();

  // SEO settings form state
  const [seoForm, setSeoForm] = useState({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    openGraphImageId: '',
    twitterImageId: '',
    businessName: '',
    businessDescription: '',
    businessType: '',
    businessUrl: '',
    addressLocality: '',
    addressRegion: '',
    addressCountry: '',
    postalCode: '',
    streetAddress: '',
    latitude: '',
    longitude: '',
    businessEmail: '',
    businessPhone: '',
    services: '',
    faqs: '',
    enableStructuredData: true,
    enableOpenGraph: true,
    enableTwitterCards: true,
    robotsDirective: ''
  });

  // Initialize SEO form when data loads
  React.useEffect(() => {
    if (seoSettings) {
      setSeoForm({
        metaTitle: seoSettings.metaTitle || '',
        metaDescription: seoSettings.metaDescription || '',
        metaKeywords: seoSettings.metaKeywords || '',
        canonicalUrl: seoSettings.canonicalUrl || '',
        openGraphImageId: seoSettings.openGraphImageId || '',
        twitterImageId: seoSettings.twitterImageId || '',
        businessName: seoSettings.businessName || '',
        businessDescription: seoSettings.businessDescription || '',
        businessType: seoSettings.businessType || '',
        businessUrl: seoSettings.businessUrl || '',
        addressLocality: seoSettings.addressLocality || '',
        addressRegion: seoSettings.addressRegion || '',
        addressCountry: seoSettings.addressCountry || '',
        postalCode: '', // Not in our SEO settings interface
        streetAddress: '', // Not in our SEO settings interface  
        latitude: seoSettings.latitude || '',
        longitude: seoSettings.longitude || '',
        businessEmail: seoSettings.businessEmail || '',
        businessPhone: '', // Not in our SEO settings interface
        services: seoSettings.services || '',
        faqs: seoSettings.faqs || '',
        enableStructuredData: seoSettings.enableStructuredData ?? true,
        enableOpenGraph: true, // Not in our SEO settings interface
        enableTwitterCards: true, // Not in our SEO settings interface
        robotsDirective: '' // Not in our SEO settings interface
      });
    }
  }, [seoSettings]);

  // Update contact information mutation
  const updateContactMutation = useMutation({
    mutationFn: async (data: { contactEmail: string; contactPhone: string; contactAddress: string; instagramUrl: string; facebookUrl: string; linkedinUrl: string }) => {
      const response = await fetch('/api/contact-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update contact info');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Contact information updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/contact-info'] });
    },
    onError: () => {
      toast({ title: "Failed to update contact information", variant: "destructive" });
    },
  });

  // Generate sitemap mutation
  const generateSitemapMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/generate-sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to generate sitemap');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Sitemap generated successfully",
        description: `Generated sitemap with ${data.pages} pages and ${data.videos} videos`
      });
    },
    onError: () => {
      toast({ title: "Failed to generate sitemap", variant: "destructive" });
    },
  });

  // Update website settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { section: string; backgroundImageId?: string; backgroundVideoId?: string }) => {
      const response = await fetch(`/api/website-settings/${data.section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundImageId: data.backgroundImageId,
          backgroundVideoId: data.backgroundVideoId
        }),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Background updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/website-settings'] });
    },
    onError: () => {
      toast({ title: "Failed to update background", variant: "destructive" });
    },
  });

  const handleMediaSelect = (section: string, mediaId: string, mediaType: 'image' | 'video') => {
    const updateData = {
      section,
      backgroundImageId: mediaType === 'image' ? mediaId : undefined,
      backgroundVideoId: mediaType === 'video' ? mediaId : undefined,
    };
    
    updateSettingsMutation.mutate(updateData);
  };

  const getCurrentBackground = (section: string) => {
    const setting = websiteSettings.find(s => s.section === section);
    return setting?.backgroundImage || setting?.backgroundVideo;
  };

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'hero': return 'Homepage Hero Section';
      case 'what_we_do': return 'Homepage What We Do Section';
      case 'who_we_work_with': return 'Homepage Who We Work With Section';
      case 'how_we_work': return 'Homepage How We Work Section';
      case 'retainer_partnerships': return 'Homepage Retainer Partnerships Section';
      case 'who_weve_worked_with': return 'Homepage Who We\'ve Worked With Section';
      case 'lets_connect': return 'Homepage Let\'s Connect Section';
      case 'portfolio_header': return 'Portfolio Page Header';
      case 'portfolio_gallery': return 'Portfolio Gallery Section';
      case 'about_header': return 'About Page Header';
      case 'about_mission_image': return 'About Page Mission Image';
      case 'about_values': return 'About Page Values Section';
      case 'services_header': return 'Services Page Header';
      case 'services_section': return 'Services Page Services Grid';
      case 'services_cta': return 'Services Page Call-to-Action';
      case 'contact_header': return 'Contact Page Header';
      case 'contact_info': return 'Contact Page Contact Information Section';
      default: return section;
    }
  };

  const getSectionDescription = (section: string) => {
    switch (section) {
      case 'hero': return 'Main banner background displayed at the top of the homepage';
      case 'what_we_do': return 'Background for the "What We Do" section showcasing your services';
      case 'who_we_work_with': return 'Background for the "Who We Work With" client types section';
      case 'how_we_work': return 'Background for the "How We Work" process overview section';
      case 'retainer_partnerships': return 'Background for the "Retainer Partnerships" ongoing services section';
      case 'who_weve_worked_with': return 'Background for the "Who We\'ve Worked With" client showcase section';
      case 'lets_connect': return 'Background for the "Let\'s Connect" call-to-action section';
      case 'portfolio_header': return 'Header banner background for the portfolio page';
      case 'portfolio_gallery': return 'Background for the portfolio gallery section';
      case 'about_header': return 'Header banner background for the about page';
      case 'about_mission_image': return 'Image for the "Our Mission" section on about page';
      case 'about_values': return 'Background for the "Our Values" section on about page';
      case 'services_header': return 'Header banner background for the services page';
      case 'services_section': return 'Background for the services grid section';
      case 'services_cta': return 'Background for the "Ready to bring your vision to life" call-to-action section';
      case 'contact_header': return 'Header banner background for the contact page';
      case 'contact_info': return 'Background for the contact information section on the contact page';
      default: return 'Section background configuration';
    }
  };

  const getPageGroup = (section: string) => {
    if (section.startsWith('hero') || section === 'what_we_do' || section === 'who_we_work_with' || section === 'how_we_work' || section === 'retainer_partnerships' || section === 'who_weve_worked_with' || section === 'lets_connect') return 'Homepage';
    if (section.startsWith('portfolio_')) return 'Portfolio Page';
    if (section.startsWith('about_')) return 'About Page';
    if (section.startsWith('services_')) return 'Services Page';
    if (section.startsWith('contact_')) return 'Contact Page';
    return 'Other';
  };

  if (isSettingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <AdminNavigation />
        <div className="container mx-auto p-6 pt-20">
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Group sections by page
  const pageGroups = {
    'Homepage': ['hero', 'what_we_do', 'who_we_work_with', 'how_we_work', 'retainer_partnerships', 'who_weve_worked_with', 'lets_connect'],
    'Portfolio': ['portfolio_header', 'portfolio_gallery'],
    'About': ['about_header', 'about_mission_image', 'about_values'],
    'Services': ['services_header', 'services_section', 'services_cta'],
    'Contact': ['contact_header', 'contact_info']
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <AdminNavigation />
      <div className="container mx-auto p-6 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Website Customization</h1>
          <p className="text-muted-foreground">
            Customize background images and videos for different sections across all pages of your website
          </p>
        </div>

        <Tabs defaultValue="Homepage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="Homepage">Homepage</TabsTrigger>
            <TabsTrigger value="Portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="About">About</TabsTrigger>
            <TabsTrigger value="Services">Services</TabsTrigger>
            <TabsTrigger value="Branding">Branding</TabsTrigger>
            <TabsTrigger value="SEO">SEO</TabsTrigger>
            <TabsTrigger value="Contact">Contact Info</TabsTrigger>
          </TabsList>

          {Object.entries(pageGroups).map(([pageName, sections]) => (
            <TabsContent key={pageName} value={pageName} className="space-y-6">
              <div className="grid gap-6">
                {sections.map((section) => {
            const currentBackground = getCurrentBackground(section);
            
            return (
              <Card key={section} className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      <div>
                        <h3 className="text-lg font-semibold">{getSectionTitle(section)}</h3>
                        <p className="text-sm text-muted-foreground font-normal">
                          {getSectionDescription(section)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setOpenDialog(section)}
                      disabled={updateSettingsMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {updateSettingsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Select New Background
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Current Background Display */}
                  {currentBackground ? (
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                      {currentBackground.type === 'image' ? (
                        <img
                          src={currentBackground.url}
                          alt={currentBackground.title}
                          className="w-24 h-24 object-cover rounded"
                        />
                      ) : (
                        <div className="relative">
                          <video
                            src={currentBackground.url}
                            className="w-24 h-24 object-cover rounded"
                            muted
                            preload="metadata"
                            onLoadedMetadata={(e) => {
                              const video = e.target as HTMLVideoElement;
                              video.currentTime = 2;
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                            <div className="bg-white/90 rounded-full p-1">
                              <Play className="w-3 h-3 text-black" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-lg">{currentBackground.title}</p>
                        <p className="text-sm text-muted-foreground capitalize mb-1">
                          {currentBackground.type}
                        </p>
                        {currentBackground.tags && currentBackground.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {currentBackground.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-lg font-medium mb-1">No background set</p>
                      <p className="text-sm">Click "Select New Background" to choose a background for this section</p>
                    </div>
                  )}
                </CardContent>

                {/* Media Selection Dialog */}
                <MediaSelectionDialog
                  section={section}
                  onSelect={(mediaId, mediaType) => handleMediaSelect(section, mediaId, mediaType)}
                  isOpen={openDialog === section}
                  onOpenChange={(open) => setOpenDialog(open ? section : null)}
                  mediaTypeFilter="all"
                />
              </Card>
            );
          })}
              </div>
            </TabsContent>
          ))}

          {/* Branding Tab */}
          <TabsContent value="Branding" className="space-y-6">
            <BrandingManager />
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="SEO" className="space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Search Engine Optimization
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure SEO settings, structured data, and search engine optimization
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic SEO</TabsTrigger>
                    <TabsTrigger value="social">Social Media</TabsTrigger>
                    <TabsTrigger value="business">Business Data</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                          id="metaTitle"
                          placeholder="Video Production Company | Luxury Events, Music & Brands | DT Visuals UK"
                          value={seoForm.metaTitle}
                          onChange={(e) => setSeoForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                          disabled={updateSeoMutation.isPending}
                        />
                        <p className="text-xs text-muted-foreground">{seoForm.metaTitle.length}/60 characters (recommended)</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <textarea
                          id="metaDescription"
                          placeholder="DT Visuals is a UK-based video production team creating cinematic content for luxury events, artists, brands and agencies. Based in Leicestershire, working UK-wide."
                          value={seoForm.metaDescription}
                          onChange={(e) => setSeoForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                          disabled={updateSeoMutation.isPending}
                          className="w-full min-h-[100px] p-3 border border-input bg-background rounded-md text-sm resize-y"
                        />
                        <p className="text-xs text-muted-foreground">{seoForm.metaDescription.length}/160 characters (recommended)</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="metaKeywords">Meta Keywords</Label>
                        <Input
                          id="metaKeywords"
                          placeholder="video production company UK, luxury event videographer, corporate video production"
                          value={seoForm.metaKeywords}
                          onChange={(e) => setSeoForm(prev => ({ ...prev, metaKeywords: e.target.value }))}
                          disabled={updateSeoMutation.isPending}
                        />
                        <p className="text-xs text-muted-foreground">Separate keywords with commas</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="canonicalUrl">Canonical URL</Label>
                        <Input
                          id="canonicalUrl"
                          type="url"
                          placeholder="https://dtvisuals.com/"
                          value={seoForm.canonicalUrl}
                          onChange={(e) => setSeoForm(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                          disabled={updateSeoMutation.isPending}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="social" className="space-y-4">
                    <div className="grid gap-6">
                      <div className="space-y-3">
                        <Label>Open Graph Image</Label>
                        <p className="text-sm text-muted-foreground">
                          This image will appear when your website is shared on Facebook, LinkedIn, and other social platforms. Recommended size: 1200x630 pixels.
                        </p>
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setOpenDialog('og-image')}
                              disabled={updateSeoMutation.isPending}
                            >
                              {seoForm.openGraphImageId ? 'Change Image' : 'Select Image'}
                            </Button>
                            {seoForm.openGraphImageId && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSeoForm(prev => ({ ...prev, openGraphImageId: '' }))}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          {(seoSettings?.openGraphImage || seoSettings?.openGraphImageUrl) && (
                            <div className="flex flex-col gap-2">
                              <div className="relative border rounded-lg overflow-hidden bg-muted/50">
                                <img
                                  src={seoSettings?.openGraphImageUrl || seoSettings?.openGraphImage?.url}
                                  alt="Open Graph preview"
                                  className="w-48 h-25 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                                    Preview
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Current: {seoSettings?.openGraphImage?.title || 'Social sharing image'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Twitter Card Image</Label>
                        <p className="text-sm text-muted-foreground">
                          This image will appear when your website is shared on Twitter/X. Recommended size: 1200x630 pixels for large cards.
                        </p>
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setOpenDialog('twitter-image')}
                              disabled={updateSeoMutation.isPending}
                            >
                              {seoForm.twitterImageId ? 'Change Image' : 'Select Image'}
                            </Button>
                            {seoForm.twitterImageId && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSeoForm(prev => ({ ...prev, twitterImageId: '' }))}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          {(seoSettings?.twitterImage || seoSettings?.twitterImageUrl) && (
                            <div className="flex flex-col gap-2">
                              <div className="relative border rounded-lg overflow-hidden bg-muted/50">
                                <img
                                  src={seoSettings?.twitterImageUrl || seoSettings?.twitterImage?.url}
                                  alt="Twitter Card preview"
                                  className="w-48 h-25 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                                    Preview
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Current: {seoSettings?.twitterImage?.title || 'Social sharing image'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="business" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            placeholder="DT Visuals"
                            value={seoForm.businessName}
                            onChange={(e) => setSeoForm(prev => ({ ...prev, businessName: e.target.value }))}
                            disabled={updateSeoMutation.isPending}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="businessUrl">Business URL</Label>
                          <Input
                            id="businessUrl"
                            type="url"
                            placeholder="https://dtvisuals.com"
                            value={seoForm.businessUrl}
                            onChange={(e) => setSeoForm(prev => ({ ...prev, businessUrl: e.target.value }))}
                            disabled={updateSeoMutation.isPending}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="businessDescription">Business Description</Label>
                        <textarea
                          id="businessDescription"
                          placeholder="Professional video production company specializing in luxury events, music videos, and branded content"
                          value={seoForm.businessDescription}
                          onChange={(e) => setSeoForm(prev => ({ ...prev, businessDescription: e.target.value }))}
                          disabled={updateSeoMutation.isPending}
                          className="w-full min-h-[80px] p-3 border border-input bg-background rounded-md text-sm resize-y"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="addressLocality">City/Locality</Label>
                          <Input
                            id="addressLocality"
                            placeholder="Leicestershire"
                            value={seoForm.addressLocality}
                            onChange={(e) => setSeoForm(prev => ({ ...prev, addressLocality: e.target.value }))}
                            disabled={updateSeoMutation.isPending}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="addressRegion">Region/State</Label>
                          <Input
                            id="addressRegion"
                            placeholder="England"
                            value={seoForm.addressRegion}
                            onChange={(e) => setSeoForm(prev => ({ ...prev, addressRegion: e.target.value }))}
                            disabled={updateSeoMutation.isPending}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="addressCountry">Country Code</Label>
                          <Input
                            id="addressCountry"
                            placeholder="GB"
                            value={seoForm.addressCountry}
                            onChange={(e) => setSeoForm(prev => ({ ...prev, addressCountry: e.target.value }))}
                            disabled={updateSeoMutation.isPending}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="services">Services (JSON Array)</Label>
                        <textarea
                          id="services"
                          placeholder='["Luxury Event Videography","Corporate Video Production","Music Video Production"]'
                          value={seoForm.services}
                          onChange={(e) => setSeoForm(prev => ({ ...prev, services: e.target.value }))}
                          disabled={updateSeoMutation.isPending}
                          className="w-full min-h-[80px] p-3 border border-input bg-background rounded-md text-sm font-mono resize-y"
                        />
                        <p className="text-xs text-muted-foreground">JSON array of services for structured data</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enableStructuredData"
                          checked={seoForm.enableStructuredData}
                          onChange={(e) => setSeoForm(prev => ({ ...prev, enableStructuredData: e.target.checked }))}
                          className="rounded"
                        />
                        <Label htmlFor="enableStructuredData">Enable Structured Data (JSON-LD)</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enableOpenGraph"
                          checked={seoForm.enableOpenGraph}
                          onChange={(e) => setSeoForm(prev => ({ ...prev, enableOpenGraph: e.target.checked }))}
                          className="rounded"
                        />
                        <Label htmlFor="enableOpenGraph">Enable Open Graph Tags</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enableTwitterCards"
                          checked={seoForm.enableTwitterCards}
                          onChange={(e) => setSeoForm(prev => ({ ...prev, enableTwitterCards: e.target.checked }))}
                          className="rounded"
                        />
                        <Label htmlFor="enableTwitterCards">Enable Twitter Cards</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Sitemap Generator</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => generateSitemapMutation.mutate()}
                            disabled={generateSitemapMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            {generateSitemapMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCcw className="h-4 w-4" />
                            )}
                            Regenerate Sitemap
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Generate updated sitemap including pages and video content</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => updateSeoMutation.mutate(seoForm)}
                    disabled={updateSeoMutation.isPending}
                    className="w-full"
                  >
                    {updateSeoMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating SEO Settings...
                      </>
                    ) : (
                      'Update SEO Settings'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Media Selection Dialog for SEO Images */}
            <MediaSelectionDialog
              section="SEO Images"
              onSelect={(mediaId, mediaType) => {
                if (openDialog === 'og-image') {
                  setSeoForm(prev => ({ ...prev, openGraphImageId: mediaId }));
                } else if (openDialog === 'twitter-image') {
                  setSeoForm(prev => ({ ...prev, twitterImageId: mediaId }));
                }
              }}
              isOpen={openDialog === 'og-image' || openDialog === 'twitter-image'}
              onOpenChange={(open) => setOpenDialog(open ? openDialog : null)}
              mediaTypeFilter="image"
            />
          </TabsContent>

          {/* Contact Information Tab */}
          <TabsContent value="Contact" className="space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Contact className="h-5 w-5" />
                  Contact Information & Social Links
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage the contact information and social media links displayed in the footer and contact page
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email Address</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="hello@company.com"
                      value={contactForm.contactEmail}
                      onChange={(e) => setContactForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                      disabled={updateContactMutation.isPending}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={contactForm.contactPhone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                      disabled={updateContactMutation.isPending}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactAddress">Address</Label>
                    <Input
                      id="contactAddress"
                      placeholder="City, State/Country"
                      value={contactForm.contactAddress}
                      onChange={(e) => setContactForm(prev => ({ ...prev, contactAddress: e.target.value }))}
                      disabled={updateContactMutation.isPending}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Social Media Links
                    </h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="instagramUrl">Instagram URL</Label>
                      <Input
                        id="instagramUrl"
                        type="url"
                        placeholder="https://instagram.com/username"
                        value={contactForm.instagramUrl}
                        onChange={(e) => setContactForm(prev => ({ ...prev, instagramUrl: e.target.value }))}
                        disabled={updateContactMutation.isPending}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl">Facebook URL</Label>
                      <Input
                        id="facebookUrl"
                        type="url"
                        placeholder="https://facebook.com/username"
                        value={contactForm.facebookUrl}
                        onChange={(e) => setContactForm(prev => ({ ...prev, facebookUrl: e.target.value }))}
                        disabled={updateContactMutation.isPending}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={contactForm.linkedinUrl}
                        onChange={(e) => setContactForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                        disabled={updateContactMutation.isPending}
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => updateContactMutation.mutate(contactForm)}
                    disabled={updateContactMutation.isPending}
                    className="w-full"
                  >
                    {updateContactMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Contact Information'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}