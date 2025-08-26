import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useWebsiteSettings } from "./use-website-settings";
import { useBrandingSettings } from "./use-branding-settings";
import {
  generateOrganizationSchema,
  generateServicesSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateVideoObjectSchema,
  injectStructuredData,
  removeStructuredData,
  updateOrganizationSchemaWithSettings,
  type VideoObjectSchema
} from "@/lib/structured-data-utils";

/**
 * Hook to manage dynamic structured data injection for SEO rich results
 */
export const useStructuredData = () => {
  const [location] = useLocation();
  const { data: websiteSettings, isLoading: websiteLoading } = useWebsiteSettings();
  const { data: brandingSettings, isLoading: brandingLoading } = useBrandingSettings();

  // Fetch featured media for VideoObject schema
  const { data: featuredMedia, isLoading: mediaLoading } = useQuery<any[]>({
    queryKey: ["/api/media/featured"],
  });

  useEffect(() => {
    if (websiteLoading || brandingLoading) return;

    // Generate and inject organization schema
    const generateAndInjectOrganizationSchema = () => {
      const baseOrganizationSchema = generateOrganizationSchema();
      
      // Find contact info from website settings array
      const contactSettings = websiteSettings?.find((setting: any) => setting.contactEmail || setting.contactPhone || setting.contactAddress);
      
      const settings = {
        contactEmail: contactSettings?.contactEmail,
        contactPhone: contactSettings?.contactPhone,
        contactAddress: contactSettings?.contactAddress,
        logoUrl: brandingSettings?.logoLightImage?.url || brandingSettings?.logoDarkImage?.url
      };

      const organizationSchema = updateOrganizationSchemaWithSettings(baseOrganizationSchema, settings);
      injectStructuredData(organizationSchema, 'organization-schema');
    };

    // Generate and inject services schema  
    const generateAndInjectServicesSchema = () => {
      const servicesSchema = generateServicesSchema();
      injectStructuredData(servicesSchema, 'services-schema');
    };

    // Generate and inject breadcrumb schema
    const generateAndInjectBreadcrumbSchema = () => {
      const breadcrumbSchema = generateBreadcrumbSchema(location);
      injectStructuredData(breadcrumbSchema, 'breadcrumb-schema');
    };

    // Generate and inject FAQ schema (only on home page)
    const generateAndInjectFAQSchema = () => {
      if (location === '/' || location === '') {
        const faqSchema = generateFAQSchema();
        injectStructuredData(faqSchema, 'faq-schema');
      } else {
        removeStructuredData('faq-schema');
      }
    };

    // Generate and inject video schema for featured content
    const generateAndInjectVideoSchema = () => {
      if (!mediaLoading && featuredMedia && featuredMedia.length > 0) {
        const featuredVideo = featuredMedia[0]; // Use first featured video
        
        if (featuredVideo && featuredVideo.type === 'video') {
          const videoSchema = generateVideoObjectSchema({
            title: featuredVideo.title || featuredVideo.filename || 'Featured Video',
            description: `Professional video production by DT Visuals featuring ${featuredVideo.title || 'cinematic content'}`,
            thumbnailUrl: featuredVideo.thumbnailUrl || featuredVideo.url,
            contentUrl: featuredVideo.url,
            uploadDate: featuredVideo.createdAt,
            duration: featuredVideo.duration
          });
          
          injectStructuredData(videoSchema, 'video-schema');
        } else {
          removeStructuredData('video-schema');
        }
      } else {
        removeStructuredData('video-schema');
      }
    };

    // Inject all structured data
    generateAndInjectOrganizationSchema();
    generateAndInjectServicesSchema();
    generateAndInjectBreadcrumbSchema();
    generateAndInjectFAQSchema();
    generateAndInjectVideoSchema();

  }, [location, websiteSettings, brandingSettings, featuredMedia, websiteLoading, brandingLoading, mediaLoading]);

  // Cleanup function to remove all structured data
  useEffect(() => {
    return () => {
      removeStructuredData('organization-schema');
      removeStructuredData('services-schema');
      removeStructuredData('breadcrumb-schema');
      removeStructuredData('faq-schema');
      removeStructuredData('video-schema');
    };
  }, []);

  return {
    isLoading: websiteLoading || brandingLoading || mediaLoading,
    hasOrganizationData: !!(websiteSettings || brandingSettings),
    hasFeaturedVideo: !!(featuredMedia && featuredMedia.length > 0),
  };
};