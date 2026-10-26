# OpenGraph/Twitter Images & Dark Mode Implementation

## Summary of Changes

This implementation fixes two key issues:

1. **OpenGraph and Twitter images are now properly populated from the website customization page**
2. **Dark mode is now the default for public-facing pages regardless of user's system settings**

## How to Use

### Setting OpenGraph/Twitter Images

1. Log into the admin dashboard
2. Navigate to **Website Customization**
3. Click on the **SEO** tab
4. In the **Social Media** section:
   - Click "Select Image" next to "Open Graph Image" to choose an image for Facebook/LinkedIn sharing
   - Click "Select Image" next to "Twitter Card Image" to choose an image for Twitter sharing
   - You can use the same image for both, or different images
5. Click "Update SEO Settings" to save

### Image Fallback Logic

- If only OpenGraph image is set → Used for both Facebook and Twitter
- If only Twitter image is set → Used for both Facebook and Twitter  
- If both are set → Each platform uses its specific image
- If neither is set → No images in social sharing

### Dark Mode Behavior

**Public Pages** (automatically dark by default):
- `/` (homepage)
- `/about`
- `/portfolio` 
- `/services`
- `/contact`

**Admin/Client Pages** (respect user's system preference):
- `/admin/*` (all admin pages)
- `/client/*` (all client pages)

Users can still manually change theme preference using the theme toggle, and their preference will be remembered.

## Technical Implementation

### Files Modified

1. **`client/src/hooks/use-seo-settings.tsx`** - New hook for managing SEO settings
2. **`client/src/hooks/use-dynamic-opengraph.tsx`** - Updated to use SEO settings instead of branding settings
3. **`client/src/hooks/use-theme.tsx`** - Added logic to default public pages to dark mode
4. **`client/src/lib/opengraph-utils.ts`** - Enhanced to handle separate Twitter images
5. **`client/src/pages/admin/website-customization.tsx`** - Integrated with proper SEO settings hook

### How It Works

1. **SEO Images**: The `useDynamicOpenGraph` hook runs when pages load, fetches SEO settings from the API, and dynamically updates the `og:image` and `twitter:image` meta tags in the HTML head
2. **Dark Mode**: The `ThemeProvider` detects the current route and sets dark mode as default for public routes, while maintaining user preference storage

## Testing

To verify the implementation is working:

### OpenGraph/Twitter Images
1. Set images via the admin panel
2. Check the page source - the meta tags should show:
   ```html
   <meta property="og:image" content="https://yourdomain.com/uploads/your-image.jpg" />
   <meta property="twitter:image" content="https://yourdomain.com/uploads/your-image.jpg" />
   ```
3. Test social sharing on Facebook/LinkedIn and Twitter to confirm images appear

### Dark Mode
1. Visit public pages in a new browser (no stored preferences)
2. Pages should load in dark mode regardless of OS theme preference
3. Admin pages should respect OS theme preference
4. Theme toggle should still work and remember user choice

## Database Schema

The implementation uses the existing `seoSettings` table with these relevant fields:
- `openGraphImageId` - References the media table for OpenGraph images
- `twitterImageId` - References the media table for Twitter images

Both fields are optional and can be null.