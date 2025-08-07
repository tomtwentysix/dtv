import { useEffect } from "react";
import { useBrandingSettings } from "./use-branding-settings";
import { updateFavicon, validateFaviconUrl } from "@/lib/favicon-utils";

export const useDynamicFavicon = () => {
  const { data: brandingSettings, isLoading } = useBrandingSettings();

  useEffect(() => {
    if (isLoading || !brandingSettings) return;

    const applyFavicon = async () => {
      const faviconUrl = brandingSettings.faviconImage?.url;
      
      if (faviconUrl) {
        // Validate the favicon URL before applying
        const isValid = await validateFaviconUrl(faviconUrl);
        if (isValid) {
          updateFavicon(faviconUrl);
        } else {
          // Fallback to default if image fails to load
          updateFavicon(null);
          console.warn("Failed to load favicon image, using fallback");
        }
      } else {
        // No favicon set, use fallback
        updateFavicon(null);
      }
    };

    applyFavicon();
  }, [brandingSettings, isLoading]);

  return {
    faviconUrl: brandingSettings?.faviconImage?.url || null,
    isLoading
  };
};