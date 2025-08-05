import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Building, ImageIcon, Loader2, Plus, Save } from "lucide-react";
import { useBrandingSettings, useUpdateBrandingSettings } from "@/hooks/use-branding-settings";
import * as React from "react";

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

export function BrandingManager() {
  const { toast } = useToast();
  const { data: brandingSettings, isLoading: isLoadingBranding } = useBrandingSettings();
  const updateBrandingMutation = useUpdateBrandingSettings();
  const [brandingForm, setBrandingForm] = useState({
    companyName: "",
    showCompanyText: true,
    logoImageId: null as string | null,
    faviconImageId: null as string | null,
  });
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [faviconDialogOpen, setFaviconDialogOpen] = useState(false);

  // Fetch all media for logo/favicon selection
  const { data: allMedia = [], isLoading: isMediaLoading } = useQuery<MediaType[]>({
    queryKey: ['/api/media'],
  });

  // Update form when branding settings change
  React.useEffect(() => {
    if (brandingSettings) {
      setBrandingForm({
        companyName: brandingSettings.companyName || "dt.visuals",
        showCompanyText: brandingSettings.showCompanyText ?? true,
        logoImageId: brandingSettings.logoImageId,
        faviconImageId: brandingSettings.faviconImageId,
      });
    }
  }, [brandingSettings]);

  const handleSubmit = async () => {
    try {
      await updateBrandingMutation.mutateAsync(brandingForm);
      toast({
        title: "Success",
        description: "Branding settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update branding settings",
        variant: "destructive",
      });
    }
  };

  const getSelectedMedia = (mediaId: string | null) => {
    if (!mediaId) return null;
    return allMedia.find(m => m.id === mediaId);
  };

  if (isLoadingBranding) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Name Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Identity
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your company name and text display preferences
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={brandingForm.companyName}
              onChange={(e) => setBrandingForm(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Enter your company name"
              disabled={updateBrandingMutation.isPending}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="showCompanyText"
              checked={brandingForm.showCompanyText}
              onCheckedChange={(checked) => setBrandingForm(prev => ({ ...prev, showCompanyText: checked }))}
              disabled={updateBrandingMutation.isPending}
            />
            <Label htmlFor="showCompanyText">Show company name text in navigation</Label>
          </div>
        </CardContent>
      </Card>

      {/* Logo Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo Image
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload and manage your company logo displayed in the navigation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {brandingForm.logoImageId && getSelectedMedia(brandingForm.logoImageId) ? (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
              <img
                src={getSelectedMedia(brandingForm.logoImageId)!.url}
                alt="Company Logo"
                className="w-16 h-16 object-contain rounded"
              />
              <div className="flex-1">
                <p className="font-medium">{getSelectedMedia(brandingForm.logoImageId)!.title}</p>
                <p className="text-sm text-muted-foreground">Current logo</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setBrandingForm(prev => ({ ...prev, logoImageId: null }))}
                disabled={updateBrandingMutation.isPending}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium mb-1">No logo set</p>
              <p className="text-sm">Click "Select Logo" to choose an image</p>
            </div>
          )}
          
          <Button
            onClick={() => setLogoDialogOpen(true)}
            disabled={updateBrandingMutation.isPending}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Select Logo
          </Button>
        </CardContent>
      </Card>

      {/* Favicon Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Favicon
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set the small icon that appears in browser tabs and bookmarks
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {brandingForm.faviconImageId && getSelectedMedia(brandingForm.faviconImageId) ? (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
              <img
                src={getSelectedMedia(brandingForm.faviconImageId)!.url}
                alt="Favicon"
                className="w-8 h-8 object-contain rounded"
              />
              <div className="flex-1">
                <p className="font-medium">{getSelectedMedia(brandingForm.faviconImageId)!.title}</p>
                <p className="text-sm text-muted-foreground">Current favicon</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setBrandingForm(prev => ({ ...prev, faviconImageId: null }))}
                disabled={updateBrandingMutation.isPending}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium mb-1">No favicon set</p>
              <p className="text-sm">Click "Select Favicon" to choose an image</p>
            </div>
          )}
          
          <Button
            onClick={() => setFaviconDialogOpen(true)}
            disabled={updateBrandingMutation.isPending}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Select Favicon
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSubmit}
        disabled={updateBrandingMutation.isPending}
        className="w-full"
        size="lg"
      >
        {updateBrandingMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Branding Settings
          </>
        )}
      </Button>

      {/* Logo Selection Dialog */}
      <Dialog open={logoDialogOpen} onOpenChange={setLogoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Logo Image</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {allMedia.filter(media => media.type === 'image').map((media) => (
                <div
                  key={media.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                  onClick={() => {
                    setBrandingForm(prev => ({ ...prev, logoImageId: media.id }));
                    setLogoDialogOpen(false);
                  }}
                >
                  <img
                    src={media.url}
                    alt={media.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-medium text-center px-2">{media.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Favicon Selection Dialog */}
      <Dialog open={faviconDialogOpen} onOpenChange={setFaviconDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Favicon Image</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {allMedia.filter(media => media.type === 'image').map((media) => (
                <div
                  key={media.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                  onClick={() => {
                    setBrandingForm(prev => ({ ...prev, faviconImageId: media.id }));
                    setFaviconDialogOpen(false);
                  }}
                >
                  <img
                    src={media.url}
                    alt={media.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-medium text-center px-2">{media.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}