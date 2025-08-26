/**
 * React hook for managing dynamic SEO meta tags
 * Updates document meta tags based on page context and SEO settings
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SeoSettings } from '@/lib/structured-data-utils';

interface SEOMetaOptions {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

/**
 * Hook to dynamically update SEO meta tags
 */
export function useSEOMeta(options: SEOMetaOptions = {}) {
  // Fetch SEO settings
  const { data: seoSettings } = useQuery<SeoSettings>({
    queryKey: ['/api/seo-settings'],
  });

  useEffect(() => {
    if (!seoSettings) return;

    // Update document title
    if (options.title || seoSettings.metaTitle) {
      document.title = options.title || seoSettings.metaTitle || 'DT Visuals';
    }

    // Update or create meta description
    updateMetaTag('name', 'description', 
      options.description || seoSettings.metaDescription || 'Professional video production company'
    );

    // Update or create meta keywords
    if (options.keywords || seoSettings.metaKeywords) {
      updateMetaTag('name', 'keywords', 
        options.keywords || seoSettings.metaKeywords || 'video production, UK'
      );
    }

    // Update robots directive
    if (seoSettings.robotsDirective) {
      updateMetaTag('name', 'robots', seoSettings.robotsDirective);
    }

    // Update canonical URL
    updateLinkTag('canonical', options.url || seoSettings.canonicalUrl || window.location.href);

    // Update Open Graph tags if enabled
    if (seoSettings.enableOpenGraph !== false) {
      updateMetaTag('property', 'og:title', 
        options.title || seoSettings.metaTitle || 'DT Visuals'
      );
      updateMetaTag('property', 'og:description', 
        options.description || seoSettings.metaDescription || 'Professional video production company'
      );
      updateMetaTag('property', 'og:url', 
        options.url || seoSettings.canonicalUrl || window.location.href
      );
      updateMetaTag('property', 'og:type', options.type || 'website');
      
      // Update Open Graph image
      if (options.image || (seoSettings.openGraphImage?.url)) {
        updateMetaTag('property', 'og:image', 
          options.image || seoSettings.openGraphImage?.url || ''
        );
      }
    }

    // Update Twitter Card tags if enabled
    if (seoSettings.enableTwitterCards !== false) {
      updateMetaTag('name', 'twitter:card', 'summary_large_image');
      updateMetaTag('name', 'twitter:title', 
        options.title || seoSettings.metaTitle || 'DT Visuals'
      );
      updateMetaTag('name', 'twitter:description', 
        options.description || seoSettings.metaDescription || 'Professional video production company'
      );
      
      // Update Twitter image
      if (options.image || (seoSettings.twitterImage?.url)) {
        updateMetaTag('name', 'twitter:image', 
          options.image || seoSettings.twitterImage?.url || ''
        );
      }
    }

  }, [seoSettings, options]);
}

/**
 * Helper function to update or create meta tags
 */
function updateMetaTag(attribute: string, name: string, content: string) {
  if (!content) return;

  let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (tag) {
    tag.content = content;
  } else {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    tag.content = content;
    document.head.appendChild(tag);
  }
}

/**
 * Helper function to update or create link tags
 */
function updateLinkTag(rel: string, href: string) {
  if (!href) return;

  let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (tag) {
    tag.href = href;
  } else {
    tag = document.createElement('link');
    tag.rel = rel;
    tag.href = href;
    document.head.appendChild(tag);
  }
}

/**
 * Hook for homepage SEO
 */
export function useHomePageSEO() {
  useSEOMeta({
    url: 'https://dtvisuals.com/',
    type: 'website'
  });
}

/**
 * Hook for portfolio page SEO
 */
export function usePortfolioSEO() {
  useSEOMeta({
    title: 'Portfolio - DT Visuals | Video Production Work & Projects',
    description: 'Explore our portfolio of luxury event videography, corporate videos, and creative projects. See examples of our cinematic video production work across the UK.',
    url: 'https://dtvisuals.com/portfolio',
    type: 'website'
  });
}

/**
 * Hook for about page SEO
 */
export function useAboutSEO() {
  useSEOMeta({
    title: 'About Us - DT Visuals | UK Video Production Team',
    description: 'Meet the DT Visuals team. Based in Leicestershire, we are a passionate video production company specializing in luxury events, music videos, and branded content.',
    url: 'https://dtvisuals.com/about',
    type: 'website'
  });
}

/**
 * Hook for services page SEO
 */
export function useServicesSEO() {
  useSEOMeta({
    title: 'Video Production Services - DT Visuals | UK Creative Agency',
    description: 'Professional video production services including luxury event videography, corporate videos, music video production, and creative direction. Serving clients across the UK.',
    url: 'https://dtvisuals.com/services',
    type: 'website'
  });
}

/**
 * Hook for contact page SEO
 */
export function useContactSEO() {
  useSEOMeta({
    title: 'Contact Us - DT Visuals | Get In Touch For Video Production',
    description: 'Get in touch with DT Visuals for your video production needs. Based in Leicestershire, serving clients across the UK. Contact us for quotes and consultations.',
    url: 'https://dtvisuals.com/contact',
    type: 'website'
  });
}