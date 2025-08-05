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
  };
  backgroundVideo?: {
    id: string;
    url: string;
    title: string;
    type: string;
  };
};

// Get background media for a section with theme-based fallback
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
      url: setting.backgroundImage.url,
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