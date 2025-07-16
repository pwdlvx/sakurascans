// CDN Configuration
export const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://images.your-domain.com';
export const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || 'https://pub-xxxxx.r2.dev';

// Get the CDN URL (use custom domain if available, fallback to R2)
export function getCDNUrl(): string {
  // If CDN_BASE_URL contains placeholder text, use R2_BASE_URL
  if (CDN_BASE_URL.includes('your-domain.com')) {
    return R2_BASE_URL;
  }
  // If R2_BASE_URL also contains placeholder, return a working example
  if (R2_BASE_URL.includes('your-bucket-id')) {
    return 'https://pub-demo123.r2.dev'; // Example URL for demo
  }
  return CDN_BASE_URL;
}

// Generate chapter page URLs
export function generateChapterPageUrls(
  comicSlug: string,
  chapterNumber: string | number,
  pageCount: number
): string[] {
  const baseUrl = getCDNUrl();
  const paddedChapter = String(chapterNumber).padStart(3, '0');
  const urls: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const paddedPage = String(i).padStart(3, '0');
    const url = `${baseUrl}/comics/${comicSlug}/chapter-${paddedChapter}/page-${paddedPage}.webp`;
    urls.push(url);
  }

  return urls;
}

// Generate cover image URL
export function getCoverImageUrl(comicSlug: string): string {
  const baseUrl = getCDNUrl();
  return `${baseUrl}/comics/${comicSlug}/cover.webp`;
}

// Generate optimized image URL with Cloudflare transforms
export function getOptimizedImageUrl(
  path: string,
  options: {
    width?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'auto';
  } = {}
): string {
  const baseUrl = getCDNUrl();
  let url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  // Add Cloudflare image optimization parameters if using custom domain
  if (baseUrl.includes('your-domain.com') && Object.keys(options).length > 0) {
    const params = new URLSearchParams();

    if (options.width) params.set('width', options.width.toString());
    if (options.quality) params.set('quality', options.quality.toString());
    if (options.format) params.set('format', options.format);

    url += `?${params.toString()}`;
  }

  return url;
}

// Helper to convert comic title to slug
export function createComicSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Validate if URL is from our CDN
export function isCDNUrl(url: string): boolean {
  return url.includes(CDN_BASE_URL) || url.includes(R2_BASE_URL);
}

// Convert external URL to our CDN path structure
export function convertToCDNPath(
  comicTitle: string,
  chapterNumber: string | number,
  pageNumber: number
): string {
  const slug = createComicSlug(comicTitle);
  const paddedChapter = String(chapterNumber).padStart(3, '0');
  const paddedPage = String(pageNumber).padStart(3, '0');

  return `/comics/${slug}/chapter-${paddedChapter}/page-${paddedPage}.webp`;
}

// Bulk URL generator for admin panel
export function generateBulkChapterUrls(
  comicTitle: string,
  chapterNumber: string | number,
  pageCount: number
): string {
  const urls = generateChapterPageUrls(
    createComicSlug(comicTitle),
    chapterNumber,
    pageCount
  );

  return urls.join('\n');
}

// URL validation for admin panel
export function validateImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validExtensions = ['.webp', '.jpg', '.jpeg', '.png'];
    const hasValidExtension = validExtensions.some(ext =>
      urlObj.pathname.toLowerCase().endsWith(ext)
    );

    return hasValidExtension;
  } catch {
    return false;
  }
}
