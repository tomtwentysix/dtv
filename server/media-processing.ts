import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

// Set ffmpeg binary path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 300;
const THUMBNAIL_QUALITY = 80;

/**
 * Generate thumbnail for an image file
 */
export async function generateImageThumbnail(
  inputPath: string, 
  outputPath: string
): Promise<void> {
  try {
    await sharp(inputPath)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toFile(outputPath);
      
    console.log(`✅ Image thumbnail generated: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to generate image thumbnail:`, error);
    throw error;
  }
}

/**
 * Generate WebP thumbnail for an image file
 */
export async function generateWebPThumbnail(
  inputPath: string, 
  outputPath: string
): Promise<void> {
  try {
    await sharp(inputPath)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
      
    console.log(`✅ WebP thumbnail generated: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to generate WebP thumbnail:`, error);
    throw error;
  }
}

/**
 * Generate WebP thumbnail for a video file
 */
export async function generateWebPVideoThumbnail(
  inputPath: string, 
  outputPath: string
): Promise<void> {
  // First generate a temporary JPEG thumbnail
  const tempJpegPath = outputPath.replace('.webp', '_temp.jpg');
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['10%'], // Take screenshot at 10% of video duration
        filename: path.basename(tempJpegPath),
        folder: path.dirname(tempJpegPath),
        size: `${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}`,
      })
      .on('end', async () => {
        try {
          // Convert the JPEG to WebP
          await sharp(tempJpegPath)
            .webp({ quality: 80 })
            .toFile(outputPath);
            
          // Clean up temp file
          if (fs.existsSync(tempJpegPath)) {
            fs.unlinkSync(tempJpegPath);
          }
          
          console.log(`✅ WebP video thumbnail generated: ${outputPath}`);
          resolve();
        } catch (error) {
          console.error(`❌ Failed to convert video thumbnail to WebP:`, error);
          reject(error);
        }
      })
      .on('error', (err) => {
        console.error(`❌ Failed to generate video thumbnail:`, err);
        reject(err);
      });
  });
}

/**
 * Generate WebP thumbnail for any media file
 */
export async function generateWebPThumbnailForMedia(
  inputPath: string,
  outputPath: string,
  mimeType: string
): Promise<void> {
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (mimeType.startsWith('image/')) {
    await generateWebPThumbnail(inputPath, outputPath);
  } else if (mimeType.startsWith('video/')) {
    await generateWebPVideoThumbnail(inputPath, outputPath);
  } else {
    throw new Error(`Unsupported mime type for WebP thumbnail generation: ${mimeType}`);
  }
}

/**
 * Generate thumbnail for any media file
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  mimeType: string
): Promise<void> {
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (mimeType.startsWith('image/')) {
    await generateImageThumbnail(inputPath, outputPath);
  } else if (mimeType.startsWith('video/')) {
    await generateVideoThumbnail(inputPath, outputPath);
  } else {
    throw new Error(`Unsupported mime type for thumbnail generation: ${mimeType}`);
  }
}

/**
 * Get thumbnail filename from original filename
 */
export function getThumbnailFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  return `thumb_${baseName}.jpg`;
}

/**
 * Get thumbnail path from original path
 */
export function getThumbnailPath(uploadDir: string, originalFilename: string): string {
  const thumbnailDir = path.join(uploadDir, 'thumbnails');
  const thumbnailFilename = getThumbnailFilename(originalFilename);
  return path.join(thumbnailDir, thumbnailFilename);
}

/**
 * Get thumbnail URL from thumbnail path
 */
export function getThumbnailUrl(thumbnailPath: string, uploadDir: string): string {
  const relativePath = path.relative(uploadDir, thumbnailPath);
  return `/uploads/${relativePath}`;
}

/**
 * Generate thumbnail for a video file
 */
export async function generateVideoThumbnail(
  inputPath: string, 
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['10%'], // Take screenshot at 10% of video duration
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: `${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}`,
      })
      .on('end', () => {
        console.log(`✅ Video thumbnail generated: ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`❌ Failed to generate video thumbnail:`, err);
        reject(err);
      });
  });
}

/**
 * Get WebP thumbnail filename from original filename
 */
export function getWebPThumbnailFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  return `thumb_${baseName}.webp`;
}

/**
 * Get WebP thumbnail path from original path
 */
export function getWebPThumbnailPath(uploadDir: string, originalFilename: string): string {
  const thumbnailDir = path.join(uploadDir, 'thumbnails', 'webp');
  const thumbnailFilename = getWebPThumbnailFilename(originalFilename);
  return path.join(thumbnailDir, thumbnailFilename);
}

/**
 * Get WebP thumbnail URL from WebP thumbnail path
 */
export function getWebPThumbnailUrl(thumbnailPath: string, uploadDir: string): string {
  const relativePath = path.relative(uploadDir, thumbnailPath);
  return `/uploads/${relativePath}`;
}

/**
 * Check if WebP thumbnail exists for a given media
 */
export function webpThumbnailExists(webpThumbnailPath: string): boolean {
  return fs.existsSync(webpThumbnailPath);
}

/**
 * Generate WebP version of an image for background optimization
 */
export async function generateWebPBackground(
  inputPath: string,
  outputPath: string,
  maxWidth: number = 1920
): Promise<void> {
  try {
    await sharp(inputPath)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
      
    console.log(`✅ WebP background generated: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to generate WebP background:`, error);
    throw error;
  }
}

/**
 * Get WebP filename from original filename
 */
export function getWebPFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  return `${baseName}.webp`;
}

/**
 * Get WebP path from original path
 */
export function getWebPPath(uploadDir: string, originalFilename: string): string {
  const webpDir = path.join(uploadDir, 'webp');
  const webpFilename = getWebPFilename(originalFilename);
  return path.join(webpDir, webpFilename);
}

/**
 * Get WebP URL from WebP path
 */
export function getWebPUrl(webpPath: string, uploadDir: string): string {
  const relativePath = path.relative(uploadDir, webpPath);
  return `/uploads/${relativePath}`;
}

/**
 * Check if WebP version exists for a given image
 */
export function webpExists(webpPath: string): boolean {
  return fs.existsSync(webpPath);
}