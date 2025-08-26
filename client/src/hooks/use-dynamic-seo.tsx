import { useEffect } from "react";
import { useSeoSettings } from "./use-seo-settings";
import { applySeoData } from "@/lib/seo-utils";

export const useDynamicSeo = () => {
  const { data: seoSettings, isLoading } = useSeoSettings();

  useEffect(() => {
    if (isLoading || !seoSettings) return;

    // Apply SEO settings to the document
    applySeoData({
      title: seoSettings.seoTitle,
      description: seoSettings.seoDescription,
      keywords: seoSettings.seoKeywords,
      author: seoSettings.seoAuthor,
      robots: seoSettings.seoRobots,
      canonicalUrl: seoSettings.seoCanonicalUrl,
      ogImageUrl: seoSettings.seoOgImageUrl,
      twitterImageUrl: seoSettings.seoTwitterImageUrl,
    });
  }, [seoSettings, isLoading]);

  return {
    seoSettings,
    isLoading
  };
};