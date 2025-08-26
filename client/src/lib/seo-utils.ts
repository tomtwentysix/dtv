/**
 * Utilities for dynamically updating SEO meta tags
 */

export interface SeoData {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  robots?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  twitterImageUrl?: string;
}

/**
 * Update the document title
 */
export function updateTitle(title: string) {
  document.title = title;
}

/**
 * Update or create a meta tag
 */
export function updateMetaTag(attribute: string, value: string, content: string) {
  let meta = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement;
  
  if (meta) {
    meta.content = content;
  } else {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, value);
    meta.content = content;
    document.head.appendChild(meta);
  }
}

/**
 * Update or create a link tag
 */
export function updateLinkTag(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (link) {
    link.href = href;
  } else {
    link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    document.head.appendChild(link);
  }
}

/**
 * Apply all SEO data to the document
 */
export function applySeoData(seoData: SeoData) {
  if (seoData.title) {
    updateTitle(seoData.title);
    updateMetaTag('property', 'og:title', seoData.title);
    updateMetaTag('property', 'twitter:title', seoData.title);
  }

  if (seoData.description) {
    updateMetaTag('name', 'description', seoData.description);
    updateMetaTag('property', 'og:description', seoData.description);
    updateMetaTag('property', 'twitter:description', seoData.description);
  }

  if (seoData.keywords) {
    updateMetaTag('name', 'keywords', seoData.keywords);
  }

  if (seoData.author) {
    updateMetaTag('name', 'author', seoData.author);
  }

  if (seoData.robots) {
    updateMetaTag('name', 'robots', seoData.robots);
  }

  if (seoData.canonicalUrl) {
    updateLinkTag('canonical', seoData.canonicalUrl);
    updateMetaTag('property', 'og:url', seoData.canonicalUrl);
    updateMetaTag('property', 'twitter:url', seoData.canonicalUrl);
  }

  if (seoData.ogImageUrl) {
    updateMetaTag('property', 'og:image', seoData.ogImageUrl);
  }

  if (seoData.twitterImageUrl) {
    updateMetaTag('property', 'twitter:image', seoData.twitterImageUrl);
  }
}