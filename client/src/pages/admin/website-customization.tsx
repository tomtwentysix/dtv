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
  Contact
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

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
  section: 'hero' | 'featured_work' | 'services' | 'portfolio_header' | 'portfolio_gallery' | 'about_header' | 'about_values' | 'services_header' | 'services_section' | 'services_cta';
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
  onOpenChange 
}: { 
  section: string;
  onSelect: (mediaId: string, mediaType: 'image' | 'video') => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all media
  const { data: allMedia = [], isLoading: isMediaLoading } = useQuery<MediaType[]>({
    queryKey: ['/api/media'],
  });

  // Filter media based on search query
  const filteredMedia = allMedia.filter(media => 
    media.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    media.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
    contactAddress: ''
  });

  // Initialize contact form when data loads
  React.useEffect(() => {
    if (contactInfo) {
      setContactForm({
        contactEmail: contactInfo.contactEmail || '',
        contactPhone: contactInfo.contactPhone || '',
        contactAddress: contactInfo.contactAddress || ''
      });
    }
  }, [contactInfo]);

  // Update contact information mutation
  const updateContactMutation = useMutation({
    mutationFn: async (data: { contactEmail: string; contactPhone: string; contactAddress: string }) => {
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

  // Update website settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { section: string; background_image_id?: string; background_video_id?: string }) => {
      const response = await fetch('/api/website-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      background_image_id: mediaType === 'image' ? mediaId : undefined,
      background_video_id: mediaType === 'video' ? mediaId : undefined,
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
      case 'featured_work': return 'Homepage Featured Work Section';
      case 'services': return 'Homepage Services Section';
      case 'portfolio_header': return 'Portfolio Page Header';
      case 'portfolio_gallery': return 'Portfolio Gallery Section';
      case 'about_header': return 'About Page Header';
      case 'about_values': return 'About Page Values Section';
      case 'services_header': return 'Services Page Header';
      case 'services_section': return 'Services Page Services Grid';
      case 'services_cta': return 'Services Page Call-to-Action';
      default: return section;
    }
  };

  const getSectionDescription = (section: string) => {
    switch (section) {
      case 'hero': return 'Main banner background displayed at the top of the homepage';
      case 'featured_work': return 'Background image for the featured work showcase section on homepage';
      case 'services': return 'Background image for the services overview section on homepage';
      case 'portfolio_header': return 'Header banner background for the portfolio page';
      case 'portfolio_gallery': return 'Background for the portfolio gallery section';
      case 'about_header': return 'Header banner background for the about page';
      case 'about_values': return 'Background for the "Our Values" section on about page';
      case 'services_header': return 'Header banner background for the services page';
      case 'services_section': return 'Background for the services grid section';
      case 'services_cta': return 'Background for the "Ready to bring your vision to life" call-to-action section';
      default: return 'Section background configuration';
    }
  };

  const getPageGroup = (section: string) => {
    if (section.startsWith('hero') || section === 'featured_work' || section === 'services') return 'Homepage';
    if (section.startsWith('portfolio_')) return 'Portfolio Page';
    if (section.startsWith('about_')) return 'About Page';
    if (section.startsWith('services_')) return 'Services Page';
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
    'Homepage': ['hero', 'featured_work', 'services'],
    'Portfolio': ['portfolio_header', 'portfolio_gallery'],
    'About': ['about_header', 'about_values'],
    'Services': ['services_header', 'services_section', 'services_cta']
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="Homepage">Homepage</TabsTrigger>
            <TabsTrigger value="Portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="About">About</TabsTrigger>
            <TabsTrigger value="Services">Services</TabsTrigger>
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
                />
              </Card>
            );
          })}
              </div>
            </TabsContent>
          ))}

          {/* Contact Information Tab */}
          <TabsContent value="Contact" className="space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Contact className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage the contact information displayed in the footer and contact page
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