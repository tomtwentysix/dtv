import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface SeoSettings {
  id?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  openGraphImageId?: string | null;
  twitterImageId?: string | null;
  businessName?: string;
  businessDescription?: string;
  businessType?: string;
  businessUrl?: string;
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
  latitude?: string;
  longitude?: string;
  businessEmail?: string;
  services?: string;
  faqs?: string;
  enableStructuredData?: boolean;
  updatedBy?: string;
  updatedAt?: string;
  openGraphImage?: {
    id: string;
    url: string;
    type: string;
    title: string;
  } | null;
  twitterImage?: {
    id: string;
    url: string;
    type: string;
    title: string;
  } | null;
}

export function useSeoSettings() {
  return useQuery<SeoSettings>({
    queryKey: ["/api/seo-settings"],
  });
}

export function useUpdateSeoSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<SeoSettings>) => {
      const response = await apiRequest("PUT", "/api/seo-settings", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo-settings"] });
    },
  });
}