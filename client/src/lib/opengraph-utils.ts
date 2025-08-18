// Utility functions for dynamic OpenGraph meta tag management
export const updateOpenGraphImage = (imageUrl: string | null) => {
  // Update og:image meta tag
  let ogImageMeta = document.querySelector('meta[property="og:image"]');
  if (!ogImageMeta) {
    ogImageMeta = document.createElement('meta');
    ogImageMeta.setAttribute('property', 'og:image');
    document.head.appendChild(ogImageMeta);
  }
  
  if (imageUrl) {
    ogImageMeta.setAttribute('content', imageUrl);
  } else {
    ogImageMeta.setAttribute('content', '');
  }

  // Update twitter:image meta tag
  let twitterImageMeta = document.querySelector('meta[property="twitter:image"]');
  if (!twitterImageMeta) {
    twitterImageMeta = document.createElement('meta');
    twitterImageMeta.setAttribute('property', 'twitter:image');
    document.head.appendChild(twitterImageMeta);
  }
  
  if (imageUrl) {
    twitterImageMeta.setAttribute('content', imageUrl);
  } else {
    twitterImageMeta.setAttribute('content', '');
  }
};

// Check if the OpenGraph image URL is valid/accessible
export const validateOpenGraphImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};