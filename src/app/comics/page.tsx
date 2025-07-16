"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Crown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useComics } from "@/lib/comics-context";
import { AuthModal } from "@/components/auth-modal";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

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

export default function ComicsPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [orderBy, setOrderBy] = useState('Last Updated');
  const [popularPeriod, setPopularPeriod] = useState<'weekly' | 'monthly' | 'all'>('weekly');
  const { comics } = useComics();

  // Available filter options
  const genres = ['All', 'Action', 'Adventure', 'Fantasy', 'Romance', 'Comedy', 'Drama', 'Slice of Life', 'Supernatural', 'School', 'Martial Arts'];
  const statuses = ['All', 'Ongoing', 'Completed', 'Hiatus'];
  const types = ['All', 'Manhwa', 'Manga', 'Manhua'];
  const orderOptions = ['Last Updated', 'Newest', 'A-Z', 'Z-A', 'Most Popular', 'Highest Rated'];

  // Get popular comics for sidebar
  const getSidebarComics = () => {
    let filteredComics = [...comics];

    if (popularPeriod === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredComics = comics.filter(comic =>
        comic.chapters.some(chapter => chapter.publishedAt >= weekAgo)
      );
    } else if (popularPeriod === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      filteredComics = comics.filter(comic =>
        comic.chapters.some(chapter => chapter.publishedAt >= monthAgo)
      );
    }

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

  // Filter and sort comics
  const getFilteredComics = () => {
    let filtered = comics.filter(comic => {
      const matchesGenre = selectedGenre === 'All' || comic.genres.includes(selectedGenre);
      const matchesStatus = selectedStatus === 'All' || comic.status.toLowerCase() === selectedStatus.toLowerCase();
      const matchesType = selectedType === 'All' || comic.tags.some(tag => tag.toLowerCase() === selectedType.toLowerCase());

      return matchesGenre && matchesStatus && matchesType;
    });

    // Sort comics
    switch (orderBy) {
      case 'Newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'A-Z':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'Z-A':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'Most Popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'Highest Rated':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'Last Updated':
      default:
        filtered.sort((a, b) => {
          const aLatest = a.chapters.length > 0 ?
            Math.max(...a.chapters.map(c => c.publishedAt.getTime())) : 0;
          const bLatest = b.chapters.length > 0 ?
            Math.max(...b.chapters.map(c => c.publishedAt.getTime())) : 0;
          return bLatest - aLatest;
        });
        break;
    }

    return filtered;
  };

  const sidebarComics = getSidebarComics();
  const filteredComics = getFilteredComics();

  return (
    <div className="min-h-screen bg-background">
      <Header onLoginClick={() => setShowAuthModal(true)} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content - Filters and Comics */}
          <div className="lg:col-span-3">
            {/* Filters Section */}
            <div className="sakura-gradient rounded-lg p-4 mb-6 sakura-glow-subtle">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Genre Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Genre</label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="w-full bg-secondary border border-sakura-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sakura-primary appearance-none cursor-pointer transition-all duration-200 hover:bg-sakura-primary/10 hover:border-sakura-primary/50 hover:shadow-lg hover:shadow-sakura-primary/20 [&>option]:bg-secondary [&>option]:text-foreground [&>option]:py-2"
                    >
                      {genres.map(genre => (
                        <option key={genre} value={genre} className="bg-secondary text-foreground">{genre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-secondary border border-sakura-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sakura-primary appearance-none cursor-pointer transition-all duration-200 hover:bg-sakura-primary/10 hover:border-sakura-primary/50 hover:shadow-lg hover:shadow-sakura-primary/20 [&>option]:bg-secondary [&>option]:text-foreground [&>option]:py-2"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status} className="bg-secondary text-foreground">{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Type</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full bg-secondary border border-sakura-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sakura-primary appearance-none cursor-pointer transition-all duration-200 hover:bg-sakura-primary/10 hover:border-sakura-primary/50 hover:shadow-lg hover:shadow-sakura-primary/20 [&>option]:bg-secondary [&>option]:text-foreground [&>option]:py-2"
                    >
                      {types.map(type => (
                        <option key={type} value={type} className="bg-secondary text-foreground">{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Order By Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Order By</label>
                    <select
                      value={orderBy}
                      onChange={(e) => setOrderBy(e.target.value)}
                      className="w-full bg-secondary border border-sakura-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sakura-primary appearance-none cursor-pointer transition-all duration-200 hover:bg-sakura-primary/10 hover:border-sakura-primary/50 hover:shadow-lg hover:shadow-sakura-primary/20 [&>option]:bg-secondary [&>option]:text-foreground [&>option]:py-2"
                    >
                      {orderOptions.map(option => (
                        <option key={option} value={option} className="bg-secondary text-foreground">{option}</option>
                      ))}
                    </select>
                  </div>
              </div>
            </div>

            {/* Comics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {filteredComics.map((comic) => (
                <Link key={comic.id} href={`/series/${comic.id}`} className="group cursor-pointer sakura-gradient rounded-lg p-3 sakura-glow-subtle hover:bg-sakura-primary/5 transition-all">
                  <div className="relative overflow-hidden rounded-lg mb-3">
                    {/* Type Badge - Bottom Left */}
                    <div className="absolute bottom-2 left-2 z-10">
                      <span className="bg-pink-700 text-white px-2 py-1 text-xs font-bold rounded">
                        {comic.tags[0] || 'MANHWA'}
                      </span>
                    </div>

                    <Image
                      src={comic.coverImage}
                      alt={comic.title}
                      width={180}
                      height={360}
                      className="w-full h-80 object-contain transition-transform group-hover:scale-105"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Comic Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-sakura-primary transition-colors text-white" title={comic.title}>
                      {comic.title}
                    </h3>
                    <p className="text-xs text-gray-300">
                      Chapter {comic.chapters.length > 0 ?
                        comic.chapters.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())[0].number.replace(/^Chapter\s*/i, '') :
                        '1'
                      }
                    </p>
                    <StarRating rating={comic.rating} />
                  </div>
                </Link>
              ))}
            </div>

            {filteredComics.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No comics found matching your filters.</p>
              </div>
            )}
          </div>

          {/* Popular Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sakura-gradient rounded-lg p-4 sakura-glow-subtle sticky top-6">
              <div className="flex items-center gap-2 mb-4">
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
                        <h4 className="text-sm font-medium mb-1.5 line-clamp-2 body-font leading-tight" title={comic.title}>{comic.title}</h4>
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
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
