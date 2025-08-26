import { useEffect } from "react";
import { useSeoSettings } from "./use-seo-settings";
import { updateOpenGraphImage, validateOpenGraphImageUrl } from "@/lib/opengraph-utils";

export const useDynamicOpenGraph = () => {
  const { data: seoSettings, isLoading } = useSeoSettings();

  useEffect(() => {
    if (isLoading || !seoSettings) return;

    const applyOpenGraphImage = async () => {
      const openGraphImageUrl = seoSettings.openGraphImage?.url;
      const twitterImageUrl = seoSettings.twitterImage?.url;
      
      // Use OpenGraph image preferentially, but fall back to Twitter image if OG is not set
      const finalOpenGraphUrl = openGraphImageUrl || twitterImageUrl || null;
      const finalTwitterUrl = twitterImageUrl || openGraphImageUrl || null;
      
      if (finalOpenGraphUrl || finalTwitterUrl) {
        // Validate the primary image URL before applying
        const primaryUrl = finalOpenGraphUrl || finalTwitterUrl;
        if (primaryUrl) {
          const isValid = await validateOpenGraphImageUrl(primaryUrl);
          if (isValid) {
            updateOpenGraphImage(finalOpenGraphUrl, finalTwitterUrl);
          } else {
            // Fallback to empty if image fails to load
            updateOpenGraphImage(null, null);
            console.warn("Failed to load OpenGraph/Twitter image, using fallback");
          }
        } else {
          updateOpenGraphImage(null, null);
        }
      } else {
        // No OpenGraph or Twitter image set, use empty
        updateOpenGraphImage(null, null);
      }
    };

    applyOpenGraphImage();
  }, [seoSettings, isLoading]);

  return {
    openGraphImageUrl: seoSettings?.openGraphImage?.url || null,
    twitterImageUrl: seoSettings?.twitterImage?.url || null,
    isLoading
  };
};