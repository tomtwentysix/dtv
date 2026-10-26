import { useQuery } from "@tanstack/react-query";

type WebsiteSettingsType = {
  id: string;
  section: string;
  backgroundImageId?: string;
  backgroundVideoId?: string;
  backgroundImage?: {
    id: string;
    url: string;
    title: string;
    type: string;
    webpUrl?: string; // Optional WebP optimized version
  };
  backgroundVideo?: {
    id: string;
    url: string;
    title: string;
    type: string;
  };
};

// Get background media for a section with theme-based fallback and WebP optimization
export const getBackgroundMedia = (websiteSettings: WebsiteSettingsType[], section: string) => {
  const setting = websiteSettings?.find((s: WebsiteSettingsType) => s.section === section);
  
  // Check for video first, then image
  if (setting?.backgroundVideo) {
    return {
      type: "video",
      url: setting.backgroundVideo.url,
      title: setting.backgroundVideo.title
    };
  }
  
  if (setting?.backgroundImage) {
    return {
      type: "image",
      // Prefer WebP version if available, fallback to original
      url: setting.backgroundImage.webpUrl || setting.backgroundImage.url,
      title: setting.backgroundImage.title
    };
  }
  
  // Return null for no background - pages will handle theme-based styling
  return null;
};

// Hook to use website settings
export const useWebsiteSettings = () => {
  return useQuery<WebsiteSettingsType[]>({
    queryKey: ["/api/website-settings"],
  });
};