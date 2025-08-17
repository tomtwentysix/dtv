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