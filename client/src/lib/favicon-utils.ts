// Utility functions for dynamic favicon management
export const updateFavicon = (iconUrl: string | null) => {
  // Remove existing favicon links
  const existingLinks = document.querySelectorAll('link[rel*="icon"]');
  existingLinks.forEach(link => link.remove());

  if (iconUrl) {
    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = iconUrl;
    document.head.appendChild(link);

    // Also create apple-touch-icon for better mobile support
    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = iconUrl;
    document.head.appendChild(appleLink);
  } else {
    // Fallback to prevent 404s
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = 'data:,';
    document.head.appendChild(link);
  }
};

// Check if the favicon URL is valid/accessible
export const validateFaviconUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};