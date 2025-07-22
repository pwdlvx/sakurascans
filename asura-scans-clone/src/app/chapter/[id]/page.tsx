"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { useComics } from '@/lib/comics-context';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChapterImage {
  id: string;
  url: string;
  pageNumber: number;
}

export default function ChapterReader() {
  const params = useParams();
  const { comics } = useComics();
  const [images, setImages] = useState<ChapterImage[]>([]);
  const [chapterInfo, setChapterInfo] = useState({
    title: '',
    seriesTitle: '',
    comicId: '',
    chapterNumber: '',
    comic: null as any
  });

  useEffect(() => {
    const chapterId = params.id as string;
    const parts = chapterId.split('-');

    // Handle cases where there might be hyphens in the comic ID itself
    // Take everything except the last part as comic ID, last part as chapter number
    const chapterNumber = parts[parts.length - 1];
    const comicId = parts.slice(0, -1).join('-');

    // Find the comic - wait for comics to be loaded
    if (comics.length === 0) {
      return;
    }

    const comic = comics.find(c => c.id === comicId);

    // Load admin-uploaded images only
    const adminImages = localStorage.getItem(`chapter-${chapterId}-images`);
    if (adminImages) {
      try {
        const parsedImages = JSON.parse(adminImages);
        setImages(parsedImages);
      } catch (error) {
        // Error parsing images, skip
      }
    }

    setChapterInfo({
      title: `Chapter ${chapterNumber}`,
      seriesTitle: comic?.title || 'Loading...',
      comicId,
      chapterNumber,
      comic
    });
  }, [params.id, comics]);

  return (
    <div className="min-h-screen bg-background">
      {/* Website Header */}
      <Header onLoginClick={() => {}} />

      {/* Chapter Info Section */}
      <div className="bg-background py-8">
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            marginLeft: 'calc(50% - 400px + 100px)',
            padding: '0 16px',
            textAlign: 'center'
          }}
        >
          {/* Chapter Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {chapterInfo.seriesTitle === 'Loading...' ? 'Loading...' : (
              (() => {
                const chapter = chapterInfo.comic?.chapters.find((ch: any) =>
                  ch.number === chapterInfo.chapterNumber
                );
                const baseTitle = `${chapterInfo.seriesTitle} Chapter ${chapterInfo.chapterNumber}`;
                return chapter?.title ? `${baseTitle} - ${chapter.title}` : baseTitle;
              })()
            )}
          </h1>

          {/* Series Link */}
          <p className="text-gray-400 mb-6">
            All chapters are in{' '}
            {chapterInfo.seriesTitle === 'Loading...' ? (
              <span className="text-gray-500">Loading...</span>
            ) : (
              <Link
                href={`/series/${chapterInfo.comicId}`}
                className="text-sakura-primary hover:text-sakura-primary/80 font-semibold transition-colors"
              >
                {chapterInfo.seriesTitle}
              </Link>
            )}
          </p>
        </div>

        {/* Breadcrumb */}
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            marginLeft: 'calc(50% - 400px + 100px)',
            padding: '0 16px',
            marginBottom: '24px'
          }}
        >
          <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-sakura-primary transition-colors">
              Sakura Scans
            </Link>
            <span>›</span>
            {chapterInfo.seriesTitle === 'Loading...' ? (
              <span className="text-gray-500">Loading...</span>
            ) : (
              <Link
                href={`/series/${chapterInfo.comicId}`}
                className="hover:text-sakura-primary transition-colors"
              >
                {chapterInfo.seriesTitle}
              </Link>
            )}
            <span>›</span>
            <span className="text-white">
              {chapterInfo.seriesTitle === 'Loading...' ? 'Loading...' : (
                (() => {
                  const chapter = chapterInfo.comic?.chapters.find((ch: any) =>
                    ch.number === chapterInfo.chapterNumber
                  );
                  const baseTitle = `${chapterInfo.seriesTitle} Chapter ${chapterInfo.chapterNumber}`;
                  return chapter?.title ? `${baseTitle} - ${chapter.title}` : baseTitle;
                })()
              )}
            </span>
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            marginLeft: 'calc(50% - 400px + 100px)',
            padding: '0 16px',
            marginBottom: '32px'
          }}
        >
          <p className="text-center text-gray-400 text-sm">
            Read the latest manga <span className="text-white font-semibold">Chapter {chapterInfo.chapterNumber}</span> at{' '}
            <span className="text-white font-semibold">Sakura Scans</span>. Manga{' '}
            <span className="text-white font-semibold">{chapterInfo.seriesTitle}</span> is always updated at{' '}
            <span className="text-white font-semibold">Sakura Scans</span>. Don't forget to read the other manga updates.
            A list of manga collections Sakura Scans is in the Manga List menu.
          </p>
        </div>

        {/* Controls */}
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            marginLeft: 'calc(50% - 400px + 100px)',
            padding: '0 16px'
          }}
        >
          <div className="flex justify-between items-center flex-wrap gap-4">
            {/* Left Controls */}
            <div className="flex items-center gap-4" style={{ marginLeft: '-8px' }}>
              {/* Chapter Selector */}
              <select
                className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sakura-primary"
                style={{ backgroundPosition: 'calc(100% - 16px) center' }}
                value={chapterInfo.chapterNumber}
                onChange={(e) => {
                  const selectedChapter = e.target.value;
                  window.location.href = `/chapter/${chapterInfo.comicId}-${selectedChapter}`;
                }}
              >
                {chapterInfo.comic?.chapters
                  .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()) // Sort by upload date descending (newest first)
                  .map((chapter: any) => (
                    <option key={chapter.id} value={chapter.number}>
                      Chapter {chapter.number}{chapter.title ? ` - ${chapter.title}` : ''}
                    </option>
                  )) || <option value={chapterInfo.chapterNumber}>Chapter {chapterInfo.chapterNumber}</option>
                }
              </select>

              {/* Quality Selector */}
              <select
                className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sakura-primary"
                style={{ backgroundPosition: 'calc(100% - 16px) center' }}
              >
                <option>Default Quality</option>
              </select>
            </div>

            {/* Right Controls - Navigation */}
            <div className="flex gap-2">
              {(() => {
                const chapters = chapterInfo.comic?.chapters || [];
                const currentChapterNum = parseInt(chapterInfo.chapterNumber);

                // Sort chapters by chapter number for logical story navigation
                const sortedChapters = chapters.sort((a: any, b: any) =>
                  parseInt(a.number) - parseInt(b.number)
                );

                // Find current chapter index in number-sorted array
                const currentIndex = sortedChapters.findIndex((ch: any) => parseInt(ch.number) === currentChapterNum);

                // Previous = lower chapter number (previous in story)
                const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;

                // Next = higher chapter number (next in story)
                const nextChapter = currentIndex >= 0 && currentIndex < sortedChapters.length - 1 ?
                  sortedChapters[currentIndex + 1] : null;

                return (
                  <>
                    <button
                      onClick={() => {
                        if (prevChapter) {
                          window.location.href = `/chapter/${chapterInfo.comicId}-${prevChapter.number}`;
                        }
                      }}
                      disabled={!prevChapter}
                      className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        prevChapter
                          ? 'bg-sakura-primary hover:bg-sakura-primary/80 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ChevronLeft size={16} />
                      Prev
                    </button>
                    <button
                      onClick={() => {
                        if (nextChapter) {
                          window.location.href = `/chapter/${chapterInfo.comicId}-${nextChapter.number}`;
                        }
                      }}
                      disabled={!nextChapter}
                      className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        nextChapter
                          ? 'bg-sakura-primary hover:bg-sakura-primary/80 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          zoom: '1.0',
          transform: 'scale(1.0)',
          transformOrigin: 'top left',
          position: 'relative'
        }}
      >
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          marginLeft: 'calc(50% - 400px + 100px)',
          padding: '0'
        }}>
        {images.map((image) => (
          <img
            key={image.id}
            src={image.url}
            alt={`Page ${image.pageNumber}`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              margin: '0'
            }}
          />
        ))}
        </div>
      </div>
    </div>
  );
}
