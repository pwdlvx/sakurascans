"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useComics } from '@/lib/comics-context';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { AuthModal } from '@/components/auth-modal';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, Grid, List, Star, Bookmark, BookmarkCheck } from 'lucide-react';

interface SearchFilters {
  genres: string[];
  status: string[];
  rating: number;
  sortBy: 'relevance' | 'rating' | 'title' | 'latest' | 'views';
  sortOrder: 'asc' | 'desc';
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating / 2);

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < fullStars ? "star-filled fill-current" : "star-empty"}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function BookmarkButton({ comicId, onAuthRequired }: { comicId: string; onAuthRequired?: () => void }) {
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
      }`}
      title={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
    >
      {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
    </button>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { comics } = useComics();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    genres: [],
    status: [],
    rating: 0,
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  // Available filter options
  const availableGenres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Horror', 'Mystery', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Genius MC', 'School'];
  const availableStatuses = ['Ongoing', 'Completed', 'Hiatus'];

  // Initialize search query from URL params
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Filter and sort comics based on search and filters
  const filteredComics = useMemo(() => {
    let filtered = [...comics];

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comic =>
        comic.title.toLowerCase().includes(query) ||
        comic.author.toLowerCase().includes(query) ||
        comic.description.toLowerCase().includes(query) ||
        comic.genres.some(genre => genre.toLowerCase().includes(query))
      );
    }

    // Genre filter
    if (filters.genres.length > 0) {
      filtered = filtered.filter(comic =>
        filters.genres.some(genre => comic.genres.includes(genre))
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(comic =>
        filters.status.includes(comic.status)
      );
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(comic => comic.rating >= filters.rating);
    }

    // Sort results
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'relevance':
          // Simple relevance scoring based on title match priority
          const getRelevanceScore = (comic: any) => {
            const query = searchQuery.toLowerCase();
            if (comic.title.toLowerCase().includes(query)) return 3;
            if (comic.author.toLowerCase().includes(query)) return 2;
            if (comic.genres.some((g: string) => g.toLowerCase().includes(query))) return 1;
            return 0;
          };
          comparison = getRelevanceScore(b) - getRelevanceScore(a);
          break;
        case 'rating':
          comparison = b.rating - a.rating;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'latest':
          const getLatestChapter = (comic: any) => {
            if (comic.chapters.length === 0) return 0;
            return Math.max(...comic.chapters.map((ch: any) => ch.publishedAt.getTime()));
          };
          comparison = getLatestChapter(b) - getLatestChapter(a);
          break;
        case 'views':
          comparison = b.views - a.views;
          break;
      }

      return filters.sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [comics, searchQuery, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleGenreToggle = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleStatusToggle = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      genres: [],
      status: [],
      rating: 0,
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  const activeFiltersCount = filters.genres.length + filters.status.length + (filters.rating > 0 ? 1 : 0);

  return (
    <>
      <Header onLoginClick={() => setShowAuthModal(true)} />

      <div className="container mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Search Comics</h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, genre..."
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sakura-primary focus:border-transparent"
              />
            </div>
          </form>

          {/* Search Results Info */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-gray-400">
              {searchQuery.trim() ? (
                <>
                  Found <span className="text-white font-semibold">{filteredComics.length}</span> results
                  for "<span className="text-sakura-primary">{searchQuery}</span>"
                </>
              ) : (
                `Showing all ${filteredComics.length} comics`
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Sort Options */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  setFilters(prev => ({
                    ...prev,
                    sortBy: sortBy as SearchFilters['sortBy'],
                    sortOrder: sortOrder as SearchFilters['sortOrder']
                  }));
                }}
                className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm"
              >
                <option value="relevance-desc">Most Relevant</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="rating-asc">Lowest Rated</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="latest-desc">Latest Updated</option>
                <option value="views-desc">Most Popular</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-gray-600">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid' ? 'bg-sakura-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list' ? 'bg-sakura-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-sakura-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Filter size={16} />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="sakura-gradient rounded-lg p-6 sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-sakura-primary hover:text-sakura-primary/80"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Genre Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white mb-3">Genres</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableGenres.map(genre => (
                      <label key={genre} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.genres.includes(genre)}
                          onChange={() => handleGenreToggle(genre)}
                          className="rounded border-gray-600 bg-gray-800 text-sakura-primary focus:ring-sakura-primary"
                        />
                        <span className="text-sm text-gray-300">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white mb-3">Status</h4>
                  <div className="space-y-2">
                    {availableStatuses.map(status => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status)}
                          onChange={() => handleStatusToggle(status)}
                          className="rounded border-gray-600 bg-gray-800 text-sakura-primary focus:ring-sakura-primary"
                        />
                        <span className="text-sm text-gray-300">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">Minimum Rating</h4>
                  <div className="space-y-2">
                    {[0, 5, 6, 7, 8, 9].map(rating => (
                      <label key={rating} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          checked={filters.rating === rating}
                          onChange={() => setFilters(prev => ({ ...prev, rating }))}
                          className="border-gray-600 bg-gray-800 text-sakura-primary focus:ring-sakura-primary"
                        />
                        <span className="text-sm text-gray-300">
                          {rating === 0 ? 'Any Rating' : `${rating}+ Stars`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {filteredComics.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredComics.map(comic => (
                    <div key={comic.id} className="comic-card group">
                      <div className="relative">
                        <Link href={`/series/${comic.id}`}>
                          <Image
                            src={comic.coverImage}
                            alt={comic.title}
                            width={200}
                            height={280}
                            className="w-full aspect-[3/4] object-cover rounded-lg"
                          />
                        </Link>
                        <div className="absolute top-2 left-2 bg-pink-700 text-white text-xs px-2 py-1 rounded font-medium">
                          {comic.tags[0] || 'MANHWA'}
                        </div>
                        <div className="absolute top-2 right-2">
                          <BookmarkButton
                            comicId={comic.id}
                            onAuthRequired={() => setShowAuthModal(true)}
                          />
                        </div>
                      </div>
                      <div className="p-3">
                        <Link href={`/series/${comic.id}`}>
                          <h3 className="font-semibold text-sm mb-2 line-clamp-2 hover:text-sakura-primary transition-colors" title={comic.title}>
                            {comic.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mb-2">{comic.author}</p>
                        <div className="flex items-center justify-between">
                          <StarRating rating={comic.rating} />
                          <span className={`text-xs px-2 py-1 rounded ${
                            comic.status === 'Ongoing' ? 'bg-green-500/20 text-green-400' :
                            comic.status === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {comic.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComics.map(comic => (
                    <div key={comic.id} className="sakura-gradient rounded-lg p-4 flex gap-4">
                      <Link href={`/series/${comic.id}`} className="flex-shrink-0">
                        <Image
                          src={comic.coverImage}
                          alt={comic.title}
                          width={80}
                          height={120}
                          className="rounded object-cover w-20 h-28"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <Link href={`/series/${comic.id}`}>
                              <h3 className="font-semibold text-lg mb-2 hover:text-sakura-primary transition-colors" title={comic.title}>
                                {comic.title}
                              </h3>
                            </Link>
                            <p className="text-sm text-muted-foreground mb-2">by {comic.author}</p>
                            <p className="text-sm text-gray-300 mb-3 line-clamp-2">{comic.description}</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {comic.genres.slice(0, 4).map(genre => (
                                <span key={genre} className="bg-sakura-primary/20 text-sakura-primary text-xs px-2 py-1 rounded">
                                  {genre}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-4">
                              <StarRating rating={comic.rating} />
                              <span className={`text-xs px-2 py-1 rounded ${
                                comic.status === 'Ongoing' ? 'bg-green-500/20 text-green-400' :
                                comic.status === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {comic.status}
                              </span>
                              <span className="text-xs text-gray-400">
                                {comic.chapters.length} chapters
                              </span>
                            </div>
                          </div>
                          <BookmarkButton
                            comicId={comic.id}
                            onAuthRequired={() => setShowAuthModal(true)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No comics found</h3>
                <p className="text-gray-400 mb-4">
                  {searchQuery.trim()
                    ? `No comics match your search for "${searchQuery}"`
                    : 'No comics match your current filters'
                  }
                </p>
                {(searchQuery.trim() || activeFiltersCount > 0) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      clearAllFilters();
                      router.push('/search');
                    }}
                    className="sakura-button text-white px-6 py-2 rounded-lg"
                  >
                    Clear Search & Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-white">Loading search...</div>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}
