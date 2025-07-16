import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// R2 Configuration
const R2_CONFIG = {
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
};

const r2Client = new S3Client(R2_CONFIG);

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'manga-images';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;
export const R2_CUSTOM_DOMAIN = process.env.R2_CUSTOM_DOMAIN;

// Get the public URL for an object
export function getR2Url(key: string): string {
  const baseUrl = R2_CUSTOM_DOMAIN ? `https://${R2_CUSTOM_DOMAIN}` : R2_PUBLIC_URL;
  return `${baseUrl}/${key}`;
}

// Upload a file to R2
export async function uploadToR2(
  file: File | Buffer,
  key: string,
  contentType?: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType || 'image/webp',
      CacheControl: 'public, max-age=31536000', // 1 year cache
    });

    await r2Client.send(command);
    return getR2Url(key);
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload to R2');
  }
}

// Upload multiple chapter pages
export async function uploadChapterPages(
  comicId: string,
  chapterNumber: string,
  files: File[]
): Promise<string[]> {
  const uploadPromises = files.map(async (file, index) => {
    const paddedIndex = String(index + 1).padStart(3, '0');
    const extension = file.name.split('.').pop() || 'webp';
    const key = `${comicId}/chapter-${chapterNumber}/page-${paddedIndex}.${extension}`;

    return uploadToR2(file, key, file.type);
  });

  return Promise.all(uploadPromises);
}

// Upload from URL (for admin panel URL input)
export async function uploadFromUrl(
  imageUrl: string,
  comicId: string,
  chapterNumber: string,
  pageNumber: number
): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/webp';
    const extension = contentType.includes('png') ? 'png' :
                     contentType.includes('jpeg') ? 'jpg' : 'webp';

    const paddedPage = String(pageNumber).padStart(3, '0');
    const key = `${comicId}/chapter-${chapterNumber}/page-${paddedPage}.${extension}`;

    return uploadToR2(imageBuffer, key, contentType);
  } catch (error) {
    console.error('Upload from URL error:', error);
    throw new Error(`Failed to upload from URL: ${imageUrl}`);
  }
}

// Delete chapter from R2
export async function deleteChapter(comicId: string, chapterNumber: string): Promise<void> {
  try {
    const prefix = `${comicId}/chapter-${chapterNumber}/`;

    // List all objects with the prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
    });

    const listResponse = await r2Client.send(listCommand);

    if (listResponse.Contents) {
      // Delete all objects
      const deletePromises = listResponse.Contents.map(object => {
        if (object.Key) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: object.Key,
          });
          return r2Client.send(deleteCommand);
        }
      });

      await Promise.all(deletePromises);
    }
  } catch (error) {
    console.error('Delete chapter error:', error);
    throw new Error('Failed to delete chapter from R2');
  }
}

// Generate optimized URLs with transformations (if using custom domain with transformations)
export function getOptimizedR2Url(
  key: string,
  options: {
    width?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string {
  const baseUrl = getR2Url(key);

  // If you're using Cloudflare Image Resizing, you can add transformations here
  // Example: https://developers.cloudflare.com/images/transform-images/

  return baseUrl;
}

// Helper function to generate chapter page URLs
export function generateChapterPageUrls(
  comicId: string,
  chapterNumber: string,
  pageCount: number
): string[] {
  const urls: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const paddedPage = String(i).padStart(3, '0');
    const key = `${comicId}/chapter-${chapterNumber}/page-${paddedPage}.webp`;
    urls.push(getR2Url(key));
  }

  return urls;
}
