"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Crown, ChevronLeft, ChevronRight, RotateCcw, Bookmark, BookmarkCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useComics } from "@/lib/comics-context";
import { AuthModal } from "@/components/auth-modal";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useTimeAgo } from "@/lib/utils";

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating / 2);
  const hasHalfStar = rating % 2 >= 1;

  return (
    <div className="rating-display">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < fullStars ? "star-filled fill-current" : "star-empty"}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating}</span>
    </div>
  );
}

function BookmarkButton({ comicId, className = "", onAuthRequired }: { comicId: string; className?: string; onAuthRequired?: () => void }) {
  const { user, isBookmarked, addBookmark, removeBookmark } = useAuth();

  const handleBookmark = () => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    if (isBookmarked(comicId)) {
      removeBookmark(comicId);
    } else {
      addBookmark(comicId);
    }
  };

  const bookmarked = user && isBookmarked(comicId);

  return (
    <button
      onClick={handleBookmark}
      className={`p-2 rounded-lg transition-colors ${
        bookmarked
          ? 'text-sakura-primary bg-sakura-primary/10'
          : 'text-muted-foreground hover:text-sakura-primary hover:bg-sakura-primary/10'
      } ${className}`}
      title={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
    >
      {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
    </button>
  );
}

function TimeAgo({ date }: { date: Date }) {
  const timeString = useTimeAgo(date);

  // Return a placeholder during SSR/hydration to prevent mismatch
  if (!timeString) {
    return <span className="text-gray-500 text-xs flex-shrink-0">•••</span>;
  }

  return <span className="text-gray-500 text-xs flex-shrink-0">{timeString}</span>;
}

function PopularCarousel({ onAuthRequired }: { onAuthRequired: () => void }) {
  const { popularComics } = useComics();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);



  const scrollToPosition = (slideIndex: number) => {
    if (!scrollContainerRef.current) return;
    const cardWidth = 220; // Card width + gap (adjusted for better accuracy)
    scrollContainerRef.current.scrollTo({
      left: slideIndex * cardWidth,
      behavior: 'smooth'
    });
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    console.log('Scroll button clicked:', direction); // Debug log

    setIsAutoScrolling(false); // Stop auto-scroll when user manually navigates

    const cardWidth = 250; // Adjusted for better scrolling

    if (direction === 'left') {
      container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }

    // Resume auto-scroll after 5 seconds
    setTimeout(() => setIsAutoScrolling(true), 5000);
  };

  const autoScroll = () => {
    if (!isAutoScrolling || popularComics.length <= 1) return;

    let nextSlide = currentSlide + 1;
    if (nextSlide >= popularComics.length) {
      nextSlide = 0; // Loop back to start
    }

    setCurrentSlide(nextSlide);
    scrollToPosition(nextSlide);
  };

  // Auto-scroll effect
  useEffect(() => {
    if (isAutoScrolling && popularComics.length > 1) {
      autoScrollIntervalRef.current = setInterval(autoScroll, 3000);
    } else {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, currentSlide, popularComics.length]);

  return (
    <div
      className="sakura-gradient rounded-lg p-6 md:p-8 mb-8 sakura-glow-subtle"
      onMouseEnter={() => setIsAutoScrolling(false)}
      onMouseLeave={() => setIsAutoScrolling(true)}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="title-font text-lg font-semibold">Popular Today</h3>
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-lg transition-colors text-sakura-primary hover:bg-sakura-primary/10 cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-lg transition-colors text-sakura-primary hover:bg-sakura-primary/10 cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Desktop/Tablet Scrollable Grid */}
      <div className="hidden md:block relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {popularComics.map((comic, index) => (
            <Link key={`popular-desktop-${comic.id}-${index}`} href={`/series/${comic.id}`} className="comic-card group flex-shrink-0 w-48">
              <div className="relative">
                <Image
                  src={comic.coverImage}
                  alt={comic.title}
                  width={200}
                  height={280}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-pink-700 text-white text-xs px-2 py-1 rounded font-medium">
                  {comic.tags[0] || 'MANHWA'}
                </div>

              </div>
              <div className="comic-info">
                <h4 className="comic-title mb-2 truncate" title={comic.title}>{comic.title}</h4>
                <p className="comic-chapter mb-2">
                  {comic.chapters.length > 0 ? (() => {
                    const latestChapter = comic.chapters.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())[0];
                    const chapterNumber = latestChapter.number.replace(/^Chapter\s*/i, '');
                    return `Chapter ${chapterNumber}`;
                  })() : 'No chapters yet'}
                </p>
                <StarRating rating={comic.rating} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Swipeable Cards */}
      <div className="md:hidden">
        <div
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {popularComics.map((comic, index) => (
            <Link key={`popular-mobile-${comic.id}-${index}`} href={`/series/${comic.id}`} className="comic-card group flex-shrink-0 w-40 snap-start">
              <div className="relative">
                <Image
                  src={comic.coverImage}
                  alt={comic.title}
                  width={160}
                  height={220}
                  className="w-full h-52 object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-pink-700 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                  {comic.tags[0] || 'MANHWA'}
                </div>

              </div>
              <div className="p-3">
                <h4 className="font-semibold text-xs mb-1 truncate" title={comic.title}>{comic.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {comic.chapters.length > 0 ? (() => {
                    const latestChapter = comic.chapters.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())[0];
                    const chapterNumber = latestChapter.number.replace(/^Chapter\s*/i, '');
                    return `Chapter ${chapterNumber}`;
                  })() : 'No chapters yet'}
                </p>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={i < Math.floor(comic.rating / 2) ? "star-filled fill-current" : "star-empty"}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">{comic.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [popularPeriod, setPopularPeriod] = useState<'weekly' | 'monthly' | 'all'>('weekly');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { featuredComic, latestUpdates, comics } = useComics();

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const handleRefreshUpdates = () => {
    setIsRefreshing(true);
    // Simulate refresh with a short delay
    setTimeout(() => {
      setIsRefreshing(false);
      // Force re-render by triggering a state update
      window.location.reload();
    }, 500);
  };



  // Sidebar comics for popular ranking based on selected period
  const getSidebarComics = () => {
    let filteredComics = [...comics];

    if (popularPeriod === 'weekly') {
      // Filter comics updated in the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyComics = comics.filter(comic =>
        comic.chapters.some(chapter => chapter.publishedAt >= weekAgo)
      );
      // If no comics updated this week, fall back to all comics
      filteredComics = weeklyComics.length > 0 ? weeklyComics : comics;
    } else if (popularPeriod === 'monthly') {
      // Filter comics updated in the last 30 days
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthlyComics = comics.filter(comic =>
        comic.chapters.some(chapter => chapter.publishedAt >= monthAgo)
      );
      // If no comics updated this month, fall back to all comics
      filteredComics = monthlyComics.length > 0 ? monthlyComics : comics;
    }
    // 'all' shows all comics

    return filteredComics
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10)
      .map((comic, index) => ({
        id: comic.id,
        rank: index + 1,
        title: comic.title,
        genres: comic.genres,
        rating: comic.rating,
        coverImage: comic.coverImage
      }));
  };

  const sidebarComics = getSidebarComics();

  // Get trending comic (if any)
  const trendingComic = comics.find(comic => comic.trending);
  const academySwordmaster = comics.find(comic => comic.title.includes("Academy's Genius Swordmaster"));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onLoginClick={() => setShowAuthModal(true)} />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Hero Section - Side by Side Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Featured Comic */}
              {featuredComic && (
                <Link href={`/series/${featuredComic.id}`} className="lg:col-span-2 block">
                  <div className="sakura-gradient rounded-lg p-4 sakura-glow-subtle h-full cursor-pointer">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="star-filled fill-current" size={16} />
                      <span className="sakura-text-primary font-semibold body-font text-sm">MANHWA</span>
                    </div>
                    <div className="flex gap-6">
                      <div className="w-40 lg:w-36 xl:w-40 flex-shrink-0">
                        <Image
                          src={featuredComic.coverImage}
                          alt={featuredComic.title}
                          width={160}
                          height={212}
                          className="rounded-lg w-full object-cover shadow-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="title-font text-xl lg:text-lg xl:text-xl mb-2 text-foreground line-clamp-2 leading-tight">{featuredComic.title}</h2>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {featuredComic.genres.slice(0, 4).map((genre) => (
                            <span key={genre} className="text-xs px-2 py-1 rounded-full bg-[#F76EB3] text-[#F8FAFC]">
                              {genre}
                            </span>
                          ))}
                        </div>
                        <p className="text-muted-foreground mb-2 text-sm leading-snug body-font line-clamp-3">{featuredComic.description}</p>
                        <div className="text-sm body-font">
                          <span className="text-muted-foreground">Status: </span>
                          <span className="sakura-text-accent font-semibold">{featuredComic.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Trending Section */}
              <Link href={academySwordmaster ? `/series/${academySwordmaster.id}` : '/comics'} className="lg:col-span-1 block">
                <div className="relative rounded-lg overflow-hidden sakura-glow-subtle h-full cursor-pointer">
                  {/* Background Comic Cover */}
                  <div className="absolute inset-0">
                    <Image
                      src={academySwordmaster?.coverImage || "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=600&fit=crop"}
                      alt="Academy's Genius Swordmaster background"
                      fill
                      className="object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
                  </div>

                  {/* Content Overlay */}
                  <div className="relative z-10 p-4 flex flex-col justify-between h-full min-h-[280px]">
                    {/* Crown Icon */}
                    <div className="self-end">
                      <div className="sakura-button p-2 rounded sakura-glow-subtle">
                        <Crown className="text-white" size={18} />
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="text-left">
                      <div className="mb-2">
                        <h3 className="text-sm font-bold text-white leading-tight">SAKURA SCANS <span className="sakura-text-primary text-[#FFFFFF]">TRENDING</span></h3>
                        <h3 className="text-sm font-bold text-white leading-tight">THIS WEEK</h3>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        ACADEMY'S GENIUS
                      </h4>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        SWORDMASTER
                      </h4>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Popular Today Carousel */}
            <PopularCarousel onAuthRequired={handleAuthRequired} />

            {/* Latest Updates */}
            <div className="sakura-gradient rounded-lg p-6 md:p-8 mb-8 sakura-glow-subtle">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h3 className="title-font text-lg font-semibold">Latest Updates</h3>
                  <button
                    onClick={handleRefreshUpdates}
                    disabled={isRefreshing}
                    className={`p-1 rounded-full hover:bg-sakura-primary/10 transition-colors ${
                      isRefreshing ? 'animate-spin' : ''
                    }`}
                    title="Refresh Latest Updates"
                  >
                    <RotateCcw size={16} className="text-muted-foreground hover:text-sakura-primary" />
                  </button>
                </div>
                <Link
                  href="/comics"
                  className="sakura-button text-white px-4 py-2 rounded text-xs font-medium hover:scale-105 transition-transform"
                >
                  VIEW ALL
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {latestUpdates.length > 0 ? latestUpdates.map((item, index) => (
                  <div key={`${item.comic.id}-${index}`} className="flex gap-4">
                      <div className="relative flex-shrink-0">
                        <Image
                          src={item.comic.coverImage}
                          alt={item.comic.title}
                          width={100}
                          height={140}
                          className="rounded object-cover w-[100px] h-[140px]"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/series/${item.comic.id}`} className="font-semibold mb-3 text-white text-base leading-tight truncate hover:text-sakura-primary transition-colors block" title={item.comic.title}>
                          {item.comic.title}
                        </Link>
                        <div className="space-y-2">
                          {item.chapters.map((chapter, chapterIndex) => {
                            const chapterNumber = chapter.number.replace(/^Chapter\s*/i, '');

                            return (
                              <div key={`${chapter.id}-${chapterIndex}`} className="flex items-center justify-between text-xs">
                                <Link href={`/chapter/${item.comic.id}-${chapterNumber}`} className="chapter-link cursor-pointer hover:text-sakura-primary transition-colors flex items-center gap-2">
                                  <span className="w-1 h-1 bg-sakura-accent rounded-full flex-shrink-0"></span>
                                  Chapter {chapterNumber}
                                </Link>
                                <TimeAgo date={chapter.publishedAt} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                  </div>
                )) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">No comics with chapters yet. Add some content via the admin panel!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Hidden on Mobile */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sakura-gradient rounded-lg p-4 sakura-glow-subtle">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="sakura-text-primary" size={16} />
                <h3 className="font-semibold text-sm body-font">Popular</h3>
              </div>

              <div className="flex gap-1 mb-4">
                <button
                  onClick={() => setPopularPeriod('weekly')}
                  className={`px-2 py-1 rounded text-xs font-medium flex-1 text-center transition-colors ${
                    popularPeriod === 'weekly'
                      ? 'sakura-button text-white'
                      : 'text-muted-foreground hover:text-sakura-primary'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setPopularPeriod('monthly')}
                  className={`px-2 py-1 rounded text-xs font-medium flex-1 text-center transition-colors ${
                    popularPeriod === 'monthly'
                      ? 'sakura-button text-white'
                      : 'text-muted-foreground hover:text-sakura-primary'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setPopularPeriod('all')}
                  className={`px-2 py-1 rounded text-xs font-medium flex-1 text-center transition-colors ${
                    popularPeriod === 'all'
                      ? 'sakura-button text-white'
                      : 'text-muted-foreground hover:text-sakura-primary'
                  }`}
                >
                  All
                </button>
              </div>

              <div className="space-y-3">
                {sidebarComics.length > 0 ? sidebarComics.map((comic, index) => (
                  <div key={index} className="flex gap-3 group hover:bg-sakura-primary/5 p-2 rounded transition-colors">
                    <div className="w-6 h-6 sakura-button text-white rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {comic.rank}
                    </div>
                    <Link href={`/series/${comic.id}`} className="relative flex-shrink-0 cursor-pointer">
                      <Image
                        src={comic.coverImage}
                        alt={comic.title}
                        width={50}
                        height={70}
                        className="rounded object-cover w-[50px] h-[70px] hover:opacity-80 transition-opacity"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/series/${comic.id}`} className="hover:text-sakura-primary transition-colors cursor-pointer">
                        <h4 className="text-sm font-medium mb-1.5 truncate body-font" title={comic.title}>{comic.title}</h4>
                      </Link>
                      <p className="text-xs text-muted-foreground mb-1.5 body-font truncate">
                        {comic.genres.slice(0, 2).join(", ")}
                      </p>
                      <div className="scale-75 origin-left">
                        <StarRating rating={comic.rating} />
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-sm">No comics available yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
