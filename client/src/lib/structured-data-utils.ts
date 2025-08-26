/**
 * Structured Data Utilities for JSON-LD Schema Markup
 * Generates various schema.org structured data for SEO and Rich Results
 */

export interface SeoSettings {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  openGraphImageId?: string;
  twitterImageId?: string;
  businessName?: string;
  businessDescription?: string;
  businessType?: string;
  businessUrl?: string;
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
  postalCode?: string;
  streetAddress?: string;
  latitude?: string;
  longitude?: string;
  businessEmail?: string;
  businessPhone?: string;
  services?: string;
  faqs?: string;
  enableStructuredData?: boolean;
  enableOpenGraph?: boolean;
  enableTwitterCards?: boolean;
  robotsDirective?: string;
  openGraphImage?: { url: string; title: string };
  twitterImage?: { url: string; title: string };
}

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  type: 'image' | 'video';
  posterUrl?: string;
  notes?: string;
  tags?: string[];
}

/**
 * Generate LocalBusiness structured data
 */
export function generateLocalBusinessSchema(seoSettings: SeoSettings): object {
  const services = seoSettings.services ? JSON.parse(seoSettings.services) : [];
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": seoSettings.businessUrl || "https://dtvisuals.com",
    "name": seoSettings.businessName || "DT Visuals",
    "description": seoSettings.businessDescription || "Professional video production company specializing in luxury events, music videos, and branded content",
    "url": seoSettings.businessUrl || "https://dtvisuals.com",
    "telephone": seoSettings.businessPhone,
    "email": seoSettings.businessEmail || "hello@dtvisuals.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": seoSettings.addressLocality || "Leicestershire",
      "addressRegion": seoSettings.addressRegion || "England", 
      "addressCountry": seoSettings.addressCountry || "GB",
      "postalCode": seoSettings.postalCode,
      "streetAddress": seoSettings.streetAddress
    },
    "geo": seoSettings.latitude && seoSettings.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": seoSettings.latitude,
      "longitude": seoSettings.longitude
    } : {
      "@type": "GeoCoordinates",
      "latitude": "52.6369",
      "longitude": "-1.1398"
    },
    "sameAs": [
      "https://www.instagram.com/dtvisuals",
      "https://www.facebook.com/dtvisuals",
      "https://www.linkedin.com/company/dtvisuals"
    ],
    "priceRange": "£££",
    "areaServed": {
      "@type": "Country",
      "name": "United Kingdom"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Video Production Services",
      "itemListElement": services.map((service: string, index: number) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service,
          "description": `Professional ${service.toLowerCase()} services in the UK`
        }
      }))
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": seoSettings.businessPhone,
      "email": seoSettings.businessEmail || "hello@dtvisuals.com",
      "contactType": "Customer Service",
      "availableLanguage": "English"
    }
  };
}

/**
 * Generate Organization structured data  
 */
export function generateOrganizationSchema(seoSettings: SeoSettings): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization", 
    "@id": seoSettings.businessUrl || "https://dtvisuals.com",
    "name": seoSettings.businessName || "DT Visuals",
    "url": seoSettings.businessUrl || "https://dtvisuals.com",
    "logo": seoSettings.openGraphImage?.url || `${seoSettings.businessUrl || 'https://dtvisuals.com'}/logo.png`,
    "description": seoSettings.businessDescription || "Professional video production company specializing in luxury events, music videos, and branded content",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": seoSettings.businessPhone,
      "email": seoSettings.businessEmail || "hello@dtvisuals.com",
      "contactType": "Customer Service"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": seoSettings.addressLocality || "Leicestershire",
      "addressRegion": seoSettings.addressRegion || "England",
      "addressCountry": seoSettings.addressCountry || "GB"
    }
  };
}

/**
 * Generate VideoObject structured data for individual videos
 */
export function generateVideoObjectSchema(video: MediaItem, seoSettings: SeoSettings): object {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.notes || video.title,
    "contentUrl": video.url,
    "thumbnailUrl": video.posterUrl || video.url,
    "uploadDate": new Date().toISOString(),
    "publisher": {
      "@type": "Organization",
      "name": seoSettings.businessName || "DT Visuals",
      "url": seoSettings.businessUrl || "https://dtvisuals.com"
    },
    "keywords": video.tags?.join(", ") || "video production, UK"
  };
}

/**
 * Generate BreadcrumbList structured data for navigation
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
}

/**
 * Generate FAQPage structured data
 */
export function generateFAQSchema(faqs: Array<{question: string, answer: string}>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate Service structured data
 */
export function generateServiceSchema(seoSettings: SeoSettings): object {
  const services = seoSettings.services ? JSON.parse(seoSettings.services) : [];
  
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Video Production Services",
    "description": seoSettings.businessDescription || "Professional video production services",
    "provider": {
      "@type": "LocalBusiness",
      "name": seoSettings.businessName || "DT Visuals",
      "url": seoSettings.businessUrl || "https://dtvisuals.com"
    },
    "areaServed": {
      "@type": "Country", 
      "name": "United Kingdom"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Video Production Services",
      "itemListElement": services.map((service: string) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service
        }
      }))
    }
  };
}

/**
 * Generate WebSite structured data with search functionality
 */
export function generateWebSiteSchema(seoSettings: SeoSettings): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": seoSettings.businessUrl || "https://dtvisuals.com",
    "name": seoSettings.businessName || "DT Visuals",
    "description": seoSettings.metaDescription || seoSettings.businessDescription,
    "url": seoSettings.businessUrl || "https://dtvisuals.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${seoSettings.businessUrl || 'https://dtvisuals.com'}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Get default FAQ data for DT Visuals
 */
export function getDefaultFAQs(): Array<{question: string, answer: string}> {
  return [
    {
      question: "What types of video production services do you offer?",
      answer: "We specialize in luxury event videography, corporate video production, music video production, branded content creation, and creative direction for agencies and businesses across the UK."
    },
    {
      question: "Do you work with clients outside of Leicestershire?",
      answer: "Yes, while we're based in Leicestershire, we provide video production services across the entire UK, working with clients in London, Manchester, Birmingham, and beyond."
    },
    {
      question: "Do you offer monthly retainer partnerships?",
      answer: "Absolutely! We offer ongoing monthly retainer partnerships for agencies, brands, and businesses who need regular video content creation and creative support."
    },
    {
      question: "What makes your video production approach unique?",
      answer: "Our cinematic approach combines technical excellence with creative storytelling, ensuring every project captures the essence of your brand or event with luxury production values and attention to detail."
    }
  ];
}