import path from 'path';
import fs from 'fs';
import { IStorage } from './storage';

/**
 * Service to handle social media images (Open Graph and Twitter cards)
 * Creates properly named copies of media files for social sharing
 */
export class SocialImageService {
  private socialDir: string;

  constructor(
    private storage: IStorage,
    private uploadDir: string = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads")
  ) {
    this.socialDir = path.join(this.uploadDir, 'social');
    this.ensureSocialDirectory();
  }

  /**
   * Ensure the social images directory exists
   */
  private ensureSocialDirectory(): void {
    if (!fs.existsSync(this.socialDir)) {
      console.log(`📁 Creating social images directory: ${this.socialDir}`);
      fs.mkdirSync(this.socialDir, { recursive: true, mode: 0o755 });
    }
  }

  /**
   * Get file extension from mime type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg', 
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };
    return mimeToExt[mimeType.toLowerCase()] || '.jpg';
  }

  /**
   * Create or update Open Graph image from media ID
   */
  async updateOpenGraphImage(mediaId: string | null): Promise<string | null> {
    const ogImagePath = path.join(this.socialDir, 'og-image.jpg');
    
    // Remove existing image if no media ID provided
    if (!mediaId) {
      if (fs.existsSync(ogImagePath)) {
        fs.unlinkSync(ogImagePath);
        console.log('🗑️ Removed existing Open Graph image');
      }
      return null;
    }

    // Get media item
    const media = await this.storage.getMedia(mediaId);
    if (!media || media.type !== 'image') {
      console.log(`⚠️ Media ${mediaId} not found or not an image`);
      return null;
    }

    try {
      // Source file path (media files are stored with their ID as filename)
      const sourcePath = path.join(this.uploadDir, media.id + this.getExtensionFromMimeType(media.mimeType || ''));
      
      // Fallback to checking with original filename if ID-based path doesn't exist
      if (!fs.existsSync(sourcePath)) {
        const fallbackPath = path.join(this.uploadDir, media.filename);
        if (fs.existsSync(fallbackPath)) {
          fs.copyFileSync(fallbackPath, ogImagePath);
        } else {
          console.log(`⚠️ Source file not found for media ${mediaId}`);
          return null;
        }
      } else {
        // Copy file to social directory with standardized name
        fs.copyFileSync(sourcePath, ogImagePath);
      }

      console.log(`✅ Created Open Graph image: ${ogImagePath}`);
      return '/uploads/social/og-image.jpg';
    } catch (error) {
      console.error('Error creating Open Graph image:', error);
      return null;
    }
  }

  /**
   * Create or update Twitter card image from media ID
   */
  async updateTwitterCardImage(mediaId: string | null): Promise<string | null> {
    const twitterImagePath = path.join(this.socialDir, 'twitter-card.jpg');
    
    // Remove existing image if no media ID provided
    if (!mediaId) {
      if (fs.existsSync(twitterImagePath)) {
        fs.unlinkSync(twitterImagePath);
        console.log('🗑️ Removed existing Twitter card image');
      }
      return null;
    }

    // Get media item
    const media = await this.storage.getMedia(mediaId);
    if (!media || media.type !== 'image') {
      console.log(`⚠️ Media ${mediaId} not found or not an image`);
      return null;
    }

    try {
      // Source file path (media files are stored with their ID as filename)
      const sourcePath = path.join(this.uploadDir, media.id + this.getExtensionFromMimeType(media.mimeType || ''));
      
      // Fallback to checking with original filename if ID-based path doesn't exist
      if (!fs.existsSync(sourcePath)) {
        const fallbackPath = path.join(this.uploadDir, media.filename);
        if (fs.existsSync(fallbackPath)) {
          fs.copyFileSync(fallbackPath, twitterImagePath);
        } else {
          console.log(`⚠️ Source file not found for media ${mediaId}`);
          return null;
        }
      } else {
        // Copy file to social directory with standardized name
        fs.copyFileSync(sourcePath, twitterImagePath);
      }

      console.log(`✅ Created Twitter card image: ${twitterImagePath}`);
      return '/uploads/social/twitter-card.jpg';
    } catch (error) {
      console.error('Error creating Twitter card image:', error);
      return null;
    }
  }

  /**
   * Update both social images
   */
  async updateSocialImages(openGraphImageId: string | null, twitterImageId: string | null): Promise<{
    openGraphImageUrl: string | null;
    twitterImageUrl: string | null;
  }> {
    const [openGraphImageUrl, twitterImageUrl] = await Promise.all([
      this.updateOpenGraphImage(openGraphImageId),
      this.updateTwitterCardImage(twitterImageId)
    ]);

    return {
      openGraphImageUrl,
      twitterImageUrl
    };
  }

  /**
   * Get current social image URLs
   */
  getSocialImageUrls(): { openGraphImageUrl: string | null; twitterImageUrl: string | null } {
    const ogImagePath = path.join(this.socialDir, 'og-image.jpg');
    const twitterImagePath = path.join(this.socialDir, 'twitter-card.jpg');

    return {
      openGraphImageUrl: fs.existsSync(ogImagePath) ? '/uploads/social/og-image.jpg' : null,
      twitterImageUrl: fs.existsSync(twitterImagePath) ? '/uploads/social/twitter-card.jpg' : null
    };
  }
}