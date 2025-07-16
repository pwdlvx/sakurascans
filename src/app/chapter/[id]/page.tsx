'use client';

import { useParams, useRouter } from 'next/navigation';
import { useComics, Comic, Chapter } from '@/lib/comics-context';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { AuthModal } from '@/components/auth-modal';
import { ChevronLeft, ChevronRight, Home, List, Settings, Bookmark, Heart, Star, Eye, Flag, Share2, RotateCcw } from 'lucide-react';

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { comics } = useComics();
  const [comic, setComic] = useState<Comic | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapterNum, setChapterNum] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadedImages, setLoadedImages] = useState<{[key: number]: boolean}>({});
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});
  const [showReaderSettings, setShowReaderSettings] = useState(false);
  const [readerSettings, setReaderSettings] = useState({
    imageWidth: 'auto' as 'auto' | 'fit' | 'original',
    backgroundColor: 'dark' as 'dark' | 'black' | 'white',
    showPageNumbers: true,
    autoScroll: false
  });
  const [isClient, setIsClient] = useState(false);

  // Helper variables for navigation
  const sortedChapterNums = comic ? comic.chapters
    .map(ch => parseInt(ch.number.replace(/^Chapter\s*/i, '')))
    .sort((a, b) => a - b) : [];
  const currentChapterIndex = sortedChapterNums.indexOf(chapterNum);
  const isFirstChapter = currentChapterIndex <= 0;
  const isLastChapter = currentChapterIndex >= sortedChapterNums.length - 1;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const chapterId = params.id as string;

    if (chapterId.includes('-')) {
      const lastHyphenIndex = chapterId.lastIndexOf('-');
      const comicId = chapterId.substring(0, lastHyphenIndex);
      const chapterNumber = chapterId.substring(lastHyphenIndex + 1);

      const foundComic = comics.find(c => c.id === comicId);

      if (foundComic) {
        const foundChapter = foundComic.chapters.find(ch => {
          const chNum = ch.number.replace(/^Chapter\s*/i, '').trim();
          return chNum === chapterNumber.trim() ||
                 parseInt(chNum) === parseInt(chapterNumber);
        });

        if (foundChapter) {
          setComic(foundComic);
          setChapter(foundChapter);
          setChapterNum(parseInt(chapterNumber));
        }
      }
    }
  }, [params.id, comics]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && !isFirstChapter) {
        router.push(`/chapter/${comic?.id}-${sortedChapterNums[currentChapterIndex - 1]}`);
      } else if (e.key === 'ArrowRight' && !isLastChapter) {
        router.push(`/chapter/${comic?.id}-${sortedChapterNums[currentChapterIndex + 1]}`);
      } else if (e.key === 'Escape') {
        setShowReaderSettings(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [comic, currentChapterIndex, isFirstChapter, isLastChapter, router, sortedChapterNums]);

  if (!comic || !chapter) {
    return (
      <div className="min-h-screen bg-background">
        <Header onLoginClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="sakura-card rounded-xl p-8 max-w-md mx-auto">
            <div className="w-16 h-16 sakura-button rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              {!comic ? 'Comic not found' : 'Chapter not found'}
            </h1>
            <p className="text-gray-400 mb-6">
              The requested content could not be found.
            </p>
            <Link
              href="/comics"
              className="sakura-button text-white px-6 py-3 rounded-lg font-medium hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              <Home size={18} />
              Back to Comics
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get page URLs - use actual chapter pages or generate demo URLs
  const pageUrls = chapter.pages && chapter.pages.length > 0
    ? chapter.pages
    : Array.from({ length: 15 }, (_, i) =>
        `https://picsum.photos/800/1200?random=${i + 1}`
      );

  const retryImage = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: false }));
    setLoadedImages(prev => ({ ...prev, [index]: false }));
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && !isFirstChapter) {
      router.push(`/chapter/${comic.id}-${sortedChapterNums[currentChapterIndex - 1]}`);
    } else if (direction === 'next' && !isLastChapter) {
      router.push(`/chapter/${comic.id}-${sortedChapterNums[currentChapterIndex + 1]}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLoginClick={() => setShowAuthModal(true)} />

      {/* Chapter Info Header */}
      <div className="border-b border-sakura-border/30">
        <div className="container mx-auto px-4 py-6">
          <div className="sakura-card rounded-xl p-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-400 mb-4">
              <Link href="/" className="hover:text-sakura-primary transition-colors">
                SakuraScans
              </Link>
              <ChevronRight size={14} className="mx-2" />
              <Link href={`/series/${comic.id}`} className="hover:text-sakura-primary transition-colors">
                {comic.title}
              </Link>
              <ChevronRight size={14} className="mx-2" />
              <span className="text-white">Chapter {chapterNum}</span>
            </div>

            {/* Chapter Title & Info */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {comic.title} - Chapter {chapterNum}
                  {chapter.title && (
                    <span className="text-gray-400 font-normal">: {chapter.title}</span>
                  )}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye size={14} />
                    {pageUrls.length} pages
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={14} />
                    {comic.rating}/10
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button className="sakura-button text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform flex items-center gap-2">
                  <Bookmark size={16} />
                  Bookmark
                </button>
                <button className="sakura-button text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform flex items-center gap-2">
                  <Heart size={16} />
                  Like
                </button>
                <button
                  onClick={() => setShowReaderSettings(!showReaderSettings)}
                  className="sakura-button text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Settings size={16} />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reader Settings Panel */}
      {showReaderSettings && (
        <div className="border-b border-sakura-border/30 bg-secondary/20">
          <div className="container mx-auto px-4 py-4">
            <div className="sakura-card rounded-lg p-4">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Settings size={16} />
                Reader Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Image Width</label>
                  <select
                    value={readerSettings.imageWidth}
                    onChange={(e) => setReaderSettings(prev => ({ ...prev, imageWidth: e.target.value as 'auto' | 'fit' | 'original' }))}
                    className="w-full bg-background border border-sakura-border rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="auto">Auto Fit</option>
                    <option value="fit">Fit Width</option>
                    <option value="original">Original Size</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Background</label>
                  <select
                    value={readerSettings.backgroundColor}
                    onChange={(e) => setReaderSettings(prev => ({ ...prev, backgroundColor: e.target.value as 'dark' | 'black' | 'white' }))}
                    className="w-full bg-background border border-sakura-border rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="dark">Dark</option>
                    <option value="black">Pure Black</option>
                    <option value="white">White</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={readerSettings.showPageNumbers}
                      onChange={(e) => setReaderSettings(prev => ({ ...prev, showPageNumbers: e.target.checked }))}
                      className="rounded border-sakura-border"
                    />
                    <span className="text-sm text-gray-400">Show Page Numbers</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={readerSettings.autoScroll}
                      onChange={(e) => setReaderSettings(prev => ({ ...prev, autoScroll: e.target.checked }))}
                      className="rounded border-sakura-border"
                    />
                    <span className="text-sm text-gray-400">Auto Scroll</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="sticky top-[73px] z-40 border-b border-sakura-border/30 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Chapter Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateChapter('prev')}
                disabled={isFirstChapter}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isFirstChapter
                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                    : 'sakura-button text-white hover:scale-105'
                }`}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <select
                value={chapterNum}
                onChange={(e) => router.push(`/chapter/${comic.id}-${e.target.value}`)}
                className="bg-background border border-sakura-border rounded-lg px-4 py-2 text-white font-medium min-w-[140px]"
              >
                {sortedChapterNums.map(num => (
                  <option key={num} value={num}>
                    Chapter {num}
                  </option>
                ))}
              </select>

              <button
                onClick={() => navigateChapter('next')}
                disabled={isLastChapter}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isLastChapter
                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                    : 'sakura-button text-white hover:scale-105'
                }`}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Link
                href={`/series/${comic.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-lg font-medium transition-colors"
              >
                <List size={16} />
                All Chapters
              </Link>

              <button className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-lg font-medium transition-colors">
                <Share2 size={16} />
                Share
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-lg font-medium transition-colors">
                <Flag size={16} />
                Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Images */}
      <div className={`py-8 ${
        readerSettings.backgroundColor === 'black' ? 'bg-black' :
        readerSettings.backgroundColor === 'white' ? 'bg-white' : 'bg-background'
      }`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-2">
            {pageUrls.map((url, index) => (
              <div key={index} className="relative group">
                {/* Loading placeholder */}
                {!loadedImages[index] && !imageErrors[index] && (
                  <div className="w-full h-[600px] sakura-card rounded-lg animate-pulse flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-sakura-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-gray-400 text-sm">Loading page {index + 1}...</p>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {imageErrors[index] && (
                  <div className="w-full h-[600px] sakura-card rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Flag className="text-gray-400" size={24} />
                      </div>
                      <h3 className="text-white font-medium mb-2">Failed to load page {index + 1}</h3>
                      <p className="text-gray-400 text-sm mb-4">This image couldn't be loaded</p>
                      <button
                        onClick={() => retryImage(index)}
                        className="sakura-button text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                      >
                        <RotateCcw size={16} />
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* Page number overlay */}
                {readerSettings.showPageNumbers && loadedImages[index] && (
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    Page {index + 1} of {pageUrls.length}
                  </div>
                )}

                {/* Actual image */}
                <img
                  src={url}
                  alt={`${comic.title} Chapter ${chapterNum} - Page ${index + 1}`}
                  className={`w-full rounded-lg shadow-lg transition-all duration-300 ${
                    loadedImages[index] ? 'block' : 'hidden'
                  } ${
                    readerSettings.imageWidth === 'fit' ? 'w-full' :
                    readerSettings.imageWidth === 'original' ? 'max-w-none mx-auto' : 'max-w-full mx-auto'
                  }`}
                  loading="lazy"
                  onLoad={() => {
                    console.log(`✅ Loaded page ${index + 1}: ${url}`);
                    setLoadedImages(prev => ({ ...prev, [index]: true }));
                  }}
                  onError={(e) => {
                    console.error(`❌ Failed to load page ${index + 1}: ${url}`);
                    setImageErrors(prev => ({ ...prev, [index]: true }));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-sakura-border/30 bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="sakura-card rounded-xl p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Chapter {chapterNum} Complete!</h3>
              <p className="text-gray-400">What would you like to do next?</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigateChapter('prev')}
                disabled={isFirstChapter}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all min-w-[160px] justify-center ${
                  isFirstChapter
                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                    : 'sakura-button text-white hover:scale-105'
                }`}
              >
                <ChevronLeft size={18} />
                Previous Chapter
              </button>

              <Link
                href={`/series/${comic.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-lg font-medium transition-all min-w-[160px] justify-center"
              >
                <List size={18} />
                All Chapters
              </Link>

              <button
                onClick={() => navigateChapter('next')}
                disabled={isLastChapter}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all min-w-[160px] justify-center ${
                  isLastChapter
                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                    : 'sakura-button text-white hover:scale-105'
                }`}
              >
                Next Chapter
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Quick chapter jump */}
            <div className="mt-6 pt-6 border-t border-sakura-border/30">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">Jump to another chapter:</p>
                <div className="flex items-center justify-center gap-2">
                  <select
                    value={chapterNum}
                    onChange={(e) => router.push(`/chapter/${comic.id}-${e.target.value}`)}
                    className="bg-background border border-sakura-border rounded-lg px-4 py-2 text-white font-medium"
                  >
                    {sortedChapterNums.map(num => (
                      <option key={num} value={num}>
                        Chapter {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
