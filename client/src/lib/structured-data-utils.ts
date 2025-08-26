/**
 * Utilities for generating JSON-LD structured data for Google Rich Results
 */

export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization" | "LocalBusiness";
  name: string;
  description?: string;
  url: string;
  logo?: string;
  image?: string;
  telephone?: string;
  email?: string;
  address?: {
    "@type": "PostalAddress";
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  sameAs?: string[];
  contactPoint?: {
    "@type": "ContactPoint";
    telephone: string;
    contactType: string;
    availableLanguage: string;
  };
}

export interface VideoObjectSchema {
  "@context": "https://schema.org";
  "@type": "VideoObject";
  name: string;
  description: string;
  thumbnailUrl: string;
  contentUrl?: string;
  embedUrl?: string;
  uploadDate?: string;
  duration?: string;
  creator?: {
    "@type": "Organization";
    name: string;
  };
}

export interface ServiceSchema {
  "@context": "https://schema.org";
  "@type": "Service";
  name: string;
  description: string;
  provider: {
    "@type": "Organization";
    name: string;
  };
  areaServed: string;
  serviceType: string;
}

export interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export interface FAQPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

/**
 * Generate Organization/LocalBusiness structured data for DT Visuals
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "DT Visuals",
    description: "UK-based video production team creating cinematic content for luxury events, artists, brands and agencies. Based in Leicestershire, working UK-wide.",
    url: "https://dtvisuals.com",
    telephone: "+44-XXX-XXX-XXXX", // Will be dynamically populated from website settings
    email: "info@dtvisuals.com", // Will be dynamically populated from website settings
    address: {
      "@type": "PostalAddress",
      addressLocality: "Leicestershire",
      addressRegion: "East Midlands", 
      addressCountry: "GB"
    },
    sameAs: [
      // Will be populated with social media links when available
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+44-XXX-XXX-XXXX", // Will be dynamically populated
      contactType: "Customer Service",
      availableLanguage: "English"
    }
  };
}

/**
 * Generate Service structured data for video production services
 */
export function generateServicesSchema(): ServiceSchema[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Luxury Event Videography",
      description: "Professional videography services for luxury events, capturing cinematic moments with high-end production quality.",
      provider: {
        "@type": "Organization",
        name: "DT Visuals"
      },
      areaServed: "United Kingdom",
      serviceType: "Video Production"
    },
    {
      "@context": "https://schema.org",
      "@type": "Service", 
      name: "Corporate Video Production",
      description: "Professional corporate video production for brands and agencies, including promotional videos, branded content, and marketing materials.",
      provider: {
        "@type": "Organization",
        name: "DT Visuals"
      },
      areaServed: "United Kingdom",
      serviceType: "Video Production"
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Music Video Production",
      description: "Creative music video production for artists and musicians, delivering cinematic storytelling and high production value.",
      provider: {
        "@type": "Organization",
        name: "DT Visuals"
      },
      areaServed: "United Kingdom", 
      serviceType: "Video Production"
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Monthly Video Retainer",
      description: "Ongoing video content partnership providing consistent video production services for brands and agencies on a monthly retainer basis.",
      provider: {
        "@type": "Organization",
        name: "DT Visuals"
      },
      areaServed: "United Kingdom",
      serviceType: "Video Production"
    }
  ];
}

/**
 * Generate VideoObject structured data for featured videos
 */
export function generateVideoObjectSchema(video: {
  title: string;
  description?: string;
  thumbnailUrl: string;
  contentUrl?: string;
  uploadDate?: string;
  duration?: string;
}): VideoObjectSchema {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description || `Professional video production by DT Visuals - ${video.title}`,
    thumbnailUrl: video.thumbnailUrl,
    contentUrl: video.contentUrl,
    uploadDate: video.uploadDate,
    duration: video.duration,
    creator: {
      "@type": "Organization",
      name: "DT Visuals"
    }
  };
}

/**
 * Generate BreadcrumbList structured data for navigation
 */
export function generateBreadcrumbSchema(path: string): BreadcrumbListSchema {
  const breadcrumbs: Array<{ "@type": "ListItem"; position: number; name: string; item: string }> = [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://dtvisuals.com/" }
  ];

  const pathSegments = path.split('/').filter(Boolean);
  
  if (pathSegments.length > 0) {
    const pageNames: Record<string, string> = {
      'portfolio': 'Portfolio',
      'about': 'About',
      'services': 'Services', 
      'contact': 'Contact',
      'admin': 'Admin',
      'client': 'Client Portal'
    };

    pathSegments.forEach((segment, index) => {
      const name = pageNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      const item = `https://dtvisuals.com/${pathSegments.slice(0, index + 1).join('/')}`;
      breadcrumbs.push({
        "@type": "ListItem",
        position: index + 2,
        name,
        item
      });
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs
  };
}

/**
 * Generate FAQ structured data for video production questions
 */
export function generateFAQSchema(): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What types of video production services do you offer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We offer comprehensive video production services including luxury event videography, corporate video production, music video production, branded content creation, and monthly video retainer services for ongoing partnerships."
        }
      },
      {
        "@type": "Question", 
        name: "Where are you based and what areas do you serve?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DT Visuals is based in Leicestershire, UK, and we provide video production services throughout the United Kingdom. We work with clients across the UK for luxury events, corporate projects, and creative productions."
        }
      },
      {
        "@type": "Question",
        name: "Do you offer monthly video production retainers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, we offer monthly video retainer services for brands and agencies who need consistent, ongoing video content. This provides reliable access to our video production team and streamlined workflows for regular content creation."
        }
      },
      {
        "@type": "Question",
        name: "What makes your video production cinematic?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our cinematic approach combines high-end equipment, professional lighting, creative storytelling, and post-production techniques to create visually compelling content that stands out. We focus on creating engaging narratives and premium production quality."
        }
      }
    ]
  };
}

/**
 * Inject structured data into document head
 */
export function injectStructuredData(schema: any, id: string) {
  // Remove existing script with same ID
  const existingScript = document.getElementById(id);
  if (existingScript) {
    existingScript.remove();
  }

  // Create new script element
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  
  // Insert into head
  document.head.appendChild(script);
}

/**
 * Remove structured data from document head
 */
export function removeStructuredData(id: string) {
  const script = document.getElementById(id);
  if (script) {
    script.remove();
  }
}

/**
 * Update organization schema with dynamic data from website settings
 */
export function updateOrganizationSchemaWithSettings(
  baseSchema: OrganizationSchema,
  settings: {
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    logoUrl?: string;
  }
): OrganizationSchema {
  const updatedSchema = { ...baseSchema };

  if (settings.contactEmail) {
    updatedSchema.email = settings.contactEmail;
  }

  if (settings.contactPhone) {
    updatedSchema.telephone = settings.contactPhone;
    if (updatedSchema.contactPoint) {
      updatedSchema.contactPoint.telephone = settings.contactPhone;
    }
  }

  if (settings.logoUrl) {
    updatedSchema.logo = settings.logoUrl;
    updatedSchema.image = settings.logoUrl;
  }

  if (settings.contactAddress) {
    // Parse address if needed - for now keeping the default Leicestershire location
  }

  return updatedSchema;
}