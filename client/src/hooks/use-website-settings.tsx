import { useQuery } from "@tanstack/react-query";

interface WebsiteSetting {
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
}

export function useWebsiteSettings() {
  return useQuery<WebsiteSetting[]>({
    queryKey: ["/api/website-settings"],
  });
}

export function useWebsiteSetting(section: string) {
  const { data: settings, isLoading, error } = useWebsiteSettings();
  
  const setting = settings?.find(s => s.section === section);
  
  return {
    setting,
    isLoading,
    error,
    backgroundUrl: setting?.backgroundImage?.url || setting?.backgroundVideo?.url,
    backgroundType: setting?.backgroundImage ? 'image' : setting?.backgroundVideo ? 'video' : null,
    backgroundTitle: setting?.backgroundImage?.title || setting?.backgroundVideo?.title
  };
}