# R2 Manga Upload Structure

## Recommended Folder Structure
```
manga-images/
├── comics/
│   ├── swordmaster-youngest-son/
│   │   ├── chapter-001/
│   │   │   ├── page-001.webp
│   │   │   ├── page-002.webp
│   │   │   └── page-020.webp
│   │   ├── chapter-002/
│   │   │   ├── page-001.webp
│   │   │   └── page-025.webp
│   │   └── cover.webp
│   └── academy-genius-swordmaster/
│       ├── chapter-001/
│       ├── chapter-002/
│       └── cover.webp
└── covers/
    ├── featured-banners/
    └── thumbnails/
```

## Naming Convention
- **Comic IDs**: Use slug format (`swordmaster-youngest-son`)
- **Chapters**: Zero-padded (`chapter-001`, `chapter-002`)
- **Pages**: Zero-padded (`page-001.webp`, `page-002.webp`)
- **Format**: WebP for best compression

## URL Examples
```
Base URL: https://images.your-domain.com

Cover: /comics/swordmaster-youngest-son/cover.webp
Page: /comics/swordmaster-youngest-son/chapter-001/page-001.webp
```

## Upload Methods
1. **Cloudflare Dashboard**: For small batches
2. **Rclone**: For bulk uploads
3. **S3 Browser**: GUI tool
4. **Our Admin Panel**: Individual URLs
