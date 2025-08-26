import { useQuery } from "@tanstack/react-query";

interface SeoSettings {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoAuthor?: string;
  seoRobots?: string;
  seoCanonicalUrl?: string;
  seoOgImageUrl?: string;
  seoTwitterImageUrl?: string;
}

export function useSeoSettings() {
  return useQuery<SeoSettings>({
    queryKey: ["/api/seo-settings"],
  });
}