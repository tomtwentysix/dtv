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
      
      // Use OpenGraph image for both og:image and twitter:image if twitter image is not set
      const finalImageUrl = openGraphImageUrl || twitterImageUrl;
      
      if (finalImageUrl) {
        // Validate the image URL before applying
        const isValid = await validateOpenGraphImageUrl(finalImageUrl);
        if (isValid) {
          updateOpenGraphImage(finalImageUrl, twitterImageUrl || finalImageUrl);
        } else {
          // Fallback to empty if image fails to load
          updateOpenGraphImage(null, null);
          console.warn("Failed to load OpenGraph/Twitter image, using fallback");
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