import { IStorage } from './storage';
import { 
  generateWebPBackground, 
  getWebPPath, 
  getWebPUrl, 
  webpExists,
  generateWebPThumbnailForMedia,
  getWebPThumbnailPath,
  getWebPThumbnailUrl,
  webpThumbnailExists
} from './media-processing';
import path from 'path';
import fs from 'fs';

/**
 * Comprehensive service to handle WebP optimization for all public-facing images
 * This includes backgrounds, thumbnails, and any images displayed on public pages
 */
export class ImageOptimizationService {
  constructor(
    private storage: IStorage,
    private uploadDir: string = process.env.UPLOAD_DIR || 'uploads'
  ) {}

  /**
   * Generate WebP version for a background image if it doesn't exist
   */
  async optimizeBackgroundImage(mediaId: string): Promise<void> {
    const mediaItem = await this.storage.getMedia(mediaId);
    if (!mediaItem || mediaItem.type !== 'image') {
      console.log(`⏭️ Skipping non-image media for background: ${mediaId}`);
      return;
    }

    // Check if WebP already exists
    if (mediaItem.webpUrl) {
      const webpFilePath = path.join(this.uploadDir, 'webp', path.basename(mediaItem.webpUrl));
      if (webpExists(webpFilePath)) {
        console.log(`✅ Background WebP already exists for ${mediaItem.filename}`);
        return;
      }
    }

    try {
      // Generate WebP version - use actual stored file path from URL instead of original filename
      const originalPath = path.join(this.uploadDir, path.basename(mediaItem.url));
      const webpPath = getWebPPath(this.uploadDir, path.basename(mediaItem.url));
      
      // Ensure webp directory exists
      const webpDir = path.dirname(webpPath);
      if (!fs.existsSync(webpDir)) {
        fs.mkdirSync(webpDir, { recursive: true });
      }

      await generateWebPBackground(originalPath, webpPath);
      
      // Update media record with WebP URL
      const webpUrl = getWebPUrl(webpPath, this.uploadDir);
      await this.storage.updateMediaWebpUrl(mediaId, webpUrl);
      
      console.log(`✅ Background WebP optimized: ${mediaItem.filename} -> ${webpUrl}`);
    } catch (error) {
      console.error(`❌ Failed to optimize background image ${mediaItem.filename}:`, error);
    }
  }

  /**
   * Generate WebP thumbnail for media if it doesn't exist
   */
  async optimizeThumbnail(mediaId: string): Promise<void> {
    const mediaItem = await this.storage.getMedia(mediaId);
    if (!mediaItem) {
      console.log(`⏭️ Media not found: ${mediaId}`);
      return;
    }

    // Check if WebP thumbnail already exists
    if (mediaItem.thumbnailWebpUrl) {
      const webpThumbnailFilePath = path.join(this.uploadDir, 'thumbnails', 'webp', path.basename(mediaItem.thumbnailWebpUrl));
      if (webpThumbnailExists(webpThumbnailFilePath)) {
        console.log(`✅ Thumbnail WebP already exists for ${mediaItem.filename}`);
        return;
      }
    }

    try {
      // Generate WebP thumbnail - use the original file as input
      const originalPath = path.join(this.uploadDir, path.basename(mediaItem.url));
      const webpThumbnailPath = getWebPThumbnailPath(this.uploadDir, path.basename(mediaItem.url));
      
      // Ensure webp thumbnail directory exists
      const webpThumbnailDir = path.dirname(webpThumbnailPath);
      if (!fs.existsSync(webpThumbnailDir)) {
        fs.mkdirSync(webpThumbnailDir, { recursive: true });
      }

      await generateWebPThumbnailForMedia(originalPath, webpThumbnailPath, mediaItem.mimeType || '');
      
      // Update media record with WebP thumbnail URL
      const thumbnailWebpUrl = getWebPThumbnailUrl(webpThumbnailPath, this.uploadDir);
      await this.storage.updateMediaThumbnailWebpUrl(mediaId, thumbnailWebpUrl);
      
      console.log(`✅ Thumbnail WebP optimized: ${mediaItem.filename} -> ${thumbnailWebpUrl}`);
    } catch (error) {
      console.error(`❌ Failed to optimize thumbnail for ${mediaItem.filename}:`, error);
    }
  }

  /**
   * Optimize all existing background images at startup
   */
  async optimizeAllBackgrounds(): Promise<void> {
    console.log('🚀 Starting background optimization...');
    
    try {
      const backgroundImages = await this.storage.getBackgroundImages();
      console.log(`📸 Found ${backgroundImages.length} background images to process`);
      
      for (const image of backgroundImages) {
        await this.optimizeBackgroundImage(image.id);
      }
      
      console.log('✅ Background optimization completed');
    } catch (error) {
      console.error('❌ Background optimization failed:', error);
    }
  }

  /**
   * Optimize thumbnails for all media that appears on public pages
   * This includes portfolio media and featured media
   */
  async optimizeAllPublicThumbnails(): Promise<void> {
    console.log('🚀 Starting public thumbnail optimization...');
    
    try {
      // Get portfolio media (public-facing)
      const portfolioMedia = await this.storage.getPortfolioMedia();
      console.log(`🖼️  Found ${portfolioMedia.length} portfolio media items to optimize thumbnails`);
      
      for (const media of portfolioMedia) {
        await this.optimizeThumbnail(media.id);
      }

      // Get featured media (public-facing)
      const featuredMedia = await this.storage.getFeaturedMedia();
      console.log(`⭐ Found ${featuredMedia.length} featured media items to optimize thumbnails`);
      
      for (const media of featuredMedia) {
        await this.optimizeThumbnail(media.id);
      }
      
      console.log('✅ Public thumbnail optimization completed');
    } catch (error) {
      console.error('❌ Public thumbnail optimization failed:', error);
    }
  }

  /**
   * Optimize all public-facing images (backgrounds + thumbnails)
   */
  async optimizeAllPublicImages(): Promise<void> {
    console.log('🎨 Starting comprehensive public image optimization...');
    
    await this.optimizeAllBackgrounds();
    await this.optimizeAllPublicThumbnails();
    
    console.log('🎉 Comprehensive public image optimization completed!');
  }

  /**
   * Optimize a single media item when it's uploaded or selected
   * This handles both background and thumbnail optimization
   */
  async optimizeMediaItem(mediaId: string): Promise<void> {
    const mediaItem = await this.storage.getMedia(mediaId);
    if (!mediaItem) {
      console.log(`⏭️ Media not found: ${mediaId}`);
      return;
    }

    // Always optimize thumbnails for new uploads
    await this.optimizeThumbnail(mediaId);

    // Also optimize as background if it's an image (for potential use as background)
    if (mediaItem.type === 'image') {
      await this.optimizeBackgroundImage(mediaId);
    }
  }

  /**
   * Optimize when media is marked as featured or for portfolio (making it public)
   */
  async optimizeForPublicDisplay(mediaId: string): Promise<void> {
    console.log(`🌟 Optimizing media for public display: ${mediaId}`);
    await this.optimizeThumbnail(mediaId);
  }
}