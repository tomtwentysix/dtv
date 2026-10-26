# Thumbnail Generation and Portfolio Visibility Improvements

## Overview

This update addresses two main issues:

1. **Thumbnail Generation**: Automatically generates optimized thumbnails for uploaded media to improve site performance
2. **Portfolio Visibility**: Fixes the default behavior where all media was automatically added to the public portfolio

## Changes Made

### 1. Database Schema Changes (`shared/schema.ts`)

- Added `thumbnailUrl` field to store generated thumbnail URLs
- Changed `showInPortfolio` default from `true` to `false`

### 2. Thumbnail Generation (`server/media-processing.ts`)

- New utility functions for generating image and video thumbnails
- Uses `sharp` for image thumbnail generation (400x300px, 80% quality)
- Uses `ffmpeg` for video thumbnail generation (screenshot at 10% duration)
- Automatic fallback if thumbnail generation fails (upload continues successfully)

### 3. Upload Process Updates (`server/routes.ts`)

- Thumbnails are generated automatically during media upload
- Thumbnails are stored in `/uploads/thumbnails/` directory
- Upload form now defaults portfolio visibility to `false` (requires explicit user choice)

### 4. UI Improvements

#### Portfolio Page (`client/src/pages/portfolio.tsx`)
- Uses thumbnails for grid view (falls back to original if thumbnail unavailable)
- Videos use thumbnail as poster image when available

#### Admin Media Page (`client/src/pages/admin/media.tsx`)
- Uses thumbnails in media grid for better performance
- Graceful fallback to original images if thumbnails fail to load
- Upload form defaults `showInPortfolio` to `false`

## Installation Requirements

New dependencies added:
- `sharp` - High-performance image processing
- `ffmpeg-static` - Static ffmpeg binary for video processing
- `fluent-ffmpeg` - Node.js ffmpeg wrapper
- `@types/fluent-ffmpeg` - TypeScript definitions

Install with:
```bash
npm install sharp ffmpeg-static fluent-ffmpeg @types/fluent-ffmpeg
```

## Database Migration

For existing databases, run the migration script:
```sql
-- See migrations/manual_add_thumbnails.sql
```

## Thumbnail Specifications

- **Size**: 400x300 pixels (4:3 aspect ratio)
- **Format**: JPEG for all thumbnails (including video thumbnails)
- **Quality**: 80%
- **Fit**: Cover (maintains aspect ratio, crops if needed)
- **Video timing**: Screenshot taken at 10% of video duration

## Directory Structure

```
uploads/
├── [original files]          # Original uploaded media
└── thumbnails/
    ├── thumb_image1.jpg      # Generated thumbnails
    ├── thumb_video1.jpg
    └── ...
```

## Performance Benefits

1. **Faster Loading**: Thumbnails are much smaller than original files
2. **Better UX**: Grid views load quickly with optimized images
3. **Bandwidth Savings**: Reduced data usage for users browsing galleries
4. **SEO Friendly**: Faster page load times improve search rankings

## Portfolio Visibility Fix

**Before**: All uploaded media automatically appeared in public portfolio (potentially exposing unfinished work)

**After**: Media only appears in portfolio when explicitly enabled by the user during upload

This prevents accidental exposure of:
- Work-in-progress media
- Private client content
- Test uploads
- Unfinished projects

## Backward Compatibility

- Existing media without thumbnails will fall back to original URLs
- Existing media with `showInPortfolio: true` remains visible (no automatic hiding)
- All UI components gracefully handle missing thumbnail URLs

## Error Handling

- Thumbnail generation failures don't prevent media upload
- UI components have fallback logic for missing thumbnails
- Console logging helps debug thumbnail generation issues
- Proper error boundaries prevent crashes from thumbnail failures