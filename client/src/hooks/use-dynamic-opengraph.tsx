import { useEffect } from "react";
import { useBrandingSettings } from "./use-branding-settings";
import { updateOpenGraphImage, validateOpenGraphImageUrl } from "@/lib/opengraph-utils";

export const useDynamicOpenGraph = () => {
  const { data: brandingSettings, isLoading } = useBrandingSettings();

  useEffect(() => {
    if (isLoading || !brandingSettings) return;

    const applyOpenGraphImage = async () => {
      const openGraphImageUrl = brandingSettings.openGraphImage?.url;
      
      if (openGraphImageUrl) {
        // Validate the OpenGraph image URL before applying
        const isValid = await validateOpenGraphImageUrl(openGraphImageUrl);
        if (isValid) {
          updateOpenGraphImage(openGraphImageUrl);
        } else {
          // Fallback to empty if image fails to load
          updateOpenGraphImage(null);
          console.warn("Failed to load OpenGraph image, using fallback");
        }
      } else {
        // No OpenGraph image set, use empty
        updateOpenGraphImage(null);
      }
    };

    applyOpenGraphImage();
  }, [brandingSettings, isLoading]);

  return {
    openGraphImageUrl: brandingSettings?.openGraphImage?.url || null,
    isLoading
  };
};