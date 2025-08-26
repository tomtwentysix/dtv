/**
 * React hook for managing structured data (JSON-LD) injection
 * Dynamically injects and removes structured data based on page context
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  generateLocalBusinessSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateWebSiteSchema,
  getDefaultFAQs,
  type SeoSettings
} from '@/lib/structured-data-utils';

interface StructuredDataOptions {
  includeLocalBusiness?: boolean;
  includeOrganization?: boolean;
  includeBreadcrumbs?: boolean;
  includeFAQ?: boolean;
  includeWebSite?: boolean;
  breadcrumbs?: Array<{name: string, url: string}>;
  customSchemas?: object[];
}

/**
 * Hook to inject structured data into document head
 */
export function useStructuredData(options: StructuredDataOptions = {}) {
  const [location] = useLocation();
  
  // Fetch SEO settings
  const { data: seoSettings } = useQuery<SeoSettings>({
    queryKey: ['/api/seo-settings'],
  });

  useEffect(() => {
    if (!seoSettings || !seoSettings.enableStructuredData) {
      return;
    }

    // Clean up any existing structured data scripts
    const existingScripts = document.querySelectorAll('script[data-structured-data="true"]');
    existingScripts.forEach(script => script.remove());

    const schemas: object[] = [];

    // Add LocalBusiness schema (usually for homepage or contact page)
    if (options.includeLocalBusiness !== false) {
      schemas.push(generateLocalBusinessSchema(seoSettings));
    }

    // Add Organization schema
    if (options.includeOrganization) {
      schemas.push(generateOrganizationSchema(seoSettings));
    }

    // Add WebSite schema (for homepage)
    if (options.includeWebSite && location === '/') {
      schemas.push(generateWebSiteSchema(seoSettings));
    }

    // Add Breadcrumb schema
    if (options.includeBreadcrumbs && options.breadcrumbs && options.breadcrumbs.length > 0) {
      schemas.push(generateBreadcrumbSchema(options.breadcrumbs));
    }

    // Add FAQ schema
    if (options.includeFAQ) {
      const faqData = seoSettings.faqs ? JSON.parse(seoSettings.faqs) : getDefaultFAQs();
      if (faqData.length > 0) {
        schemas.push(generateFAQSchema(faqData));
      }
    }

    // Add custom schemas
    if (options.customSchemas) {
      schemas.push(...options.customSchemas);
    }

    // Inject all schemas into the document head
    schemas.forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-structured-data', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    // Cleanup function to remove scripts when component unmounts
    return () => {
      const scripts = document.querySelectorAll('script[data-structured-data="true"]');
      scripts.forEach(script => script.remove());
    };
  }, [seoSettings, location, options]);
}

/**
 * Hook for homepage structured data
 */
export function useHomePageStructuredData() {
  const [location] = useLocation();
  
  const breadcrumbs = [
    { name: 'Home', url: 'https://dtvisuals.com/' }
  ];

  useStructuredData({
    includeLocalBusiness: true,
    includeOrganization: true,
    includeWebSite: true,
    includeFAQ: true,
    breadcrumbs: location === '/' ? breadcrumbs : undefined
  });
}

/**
 * Hook for portfolio page structured data
 */
export function usePortfolioStructuredData() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://dtvisuals.com/' },
    { name: 'Portfolio', url: 'https://dtvisuals.com/portfolio' }
  ];

  useStructuredData({
    includeOrganization: true,
    includeBreadcrumbs: true,
    breadcrumbs
  });
}

/**
 * Hook for about page structured data
 */
export function useAboutStructuredData() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://dtvisuals.com/' },
    { name: 'About', url: 'https://dtvisuals.com/about' }
  ];

  useStructuredData({
    includeOrganization: true,
    includeBreadcrumbs: true,
    breadcrumbs
  });
}

/**
 * Hook for services page structured data
 */
export function useServicesStructuredData() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://dtvisuals.com/' },
    { name: 'Services', url: 'https://dtvisuals.com/services' }
  ];

  useStructuredData({
    includeOrganization: true,
    includeBreadcrumbs: true,
    includeFAQ: true,
    breadcrumbs
  });
}

/**
 * Hook for contact page structured data
 */
export function useContactStructuredData() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://dtvisuals.com/' },
    { name: 'Contact', url: 'https://dtvisuals.com/contact' }
  ];

  useStructuredData({
    includeLocalBusiness: true,
    includeOrganization: true,
    includeBreadcrumbs: true,
    breadcrumbs
  });
}