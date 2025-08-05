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

