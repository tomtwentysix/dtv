import { IStorage } from './storage';
import { generateWebPBackground, getWebPPath, getWebPUrl, webpExists } from './media-processing';
import path from 'path';
import fs from 'fs';

/**
 * Service to handle WebP optimization for background images
 */
export class BackgroundOptimizationService {
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
      console.log(`⏭️ Skipping non-image media: ${mediaId}`);
      return;
    }

    // Check if WebP already exists
    if (mediaItem.webpUrl) {
      const webpFilePath = path.join(this.uploadDir, 'webp', path.basename(mediaItem.webpUrl));
      if (webpExists(webpFilePath)) {
        console.log(`✅ WebP already exists for ${mediaItem.filename}`);
        return;
      }
    }

    try {
      // Generate WebP version
      const originalPath = path.join(this.uploadDir, mediaItem.filename);
      const webpPath = getWebPPath(this.uploadDir, mediaItem.filename);
      
      // Ensure webp directory exists
      const webpDir = path.dirname(webpPath);
      if (!fs.existsSync(webpDir)) {
        fs.mkdirSync(webpDir, { recursive: true });
      }

      await generateWebPBackground(originalPath, webpPath);
      
      // Update media record with WebP URL
      const webpUrl = getWebPUrl(webpPath, this.uploadDir);
      await this.storage.updateMediaWebpUrl(mediaId, webpUrl);
      
      console.log(`✅ WebP background optimized: ${mediaItem.filename} -> ${webpUrl}`);
    } catch (error) {
      console.error(`❌ Failed to optimize background image ${mediaItem.filename}:`, error);
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
   * Optimize a single background when it's selected in admin
   */
  async optimizeOnSelection(mediaId: string): Promise<void> {
    await this.optimizeBackgroundImage(mediaId);
  }
}