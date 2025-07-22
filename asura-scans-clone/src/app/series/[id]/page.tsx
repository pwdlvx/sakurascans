"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useComics } from '@/lib/comics-context';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { Crown, Star, X } from 'lucide-react';
import { Header } from '@/components/header';
import { AuthModal } from '@/components/auth-modal';

interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  createdAt: Date;
  likes: number;
  likedBy: string[];
}

interface ComicReactions {
  [comicId: string]: {
    upvote: { count: number; users: string[] };
    funny: { count: number; users: string[] };
    love: { count: number; users: string[] };
    surprised: { count: number; users: string[] };
    angry: { count: number; users: string[] };
    sad: { count: number; users: string[] };
  };
}

interface ComicComments {
  [comicId: string]: Comment[];
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

export default function SeriesPage() {
  const params = useParams();
  const { comics } = useComics();
  const { user, isBookmarked: checkIsBookmarked, addBookmark, removeBookmark, users } = useAuth();
  const [comic, setComic] = useState<any>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [popularPeriod, setPopularPeriod] = useState<'weekly' | 'monthly' | 'all'>('weekly');
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hasUserRated, setHasUserRated] = useState(false);
  const [existingUserRating, setExistingUserRating] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentFilter, setCommentFilter] = useState<'best' | 'newest' | 'oldest'>('best');
  const [reactions, setReactions] = useState({
    upvote: { count: 49, users: [] as string[] },
    funny: { count: 11, users: [] as string[] },
    love: { count: 188, users: [] as string[] },
    surprised: { count: 6, users: [] as string[] },
    angry: { count: 2, users: [] as string[] },
    sad: { count: 3, users: [] as string[] }
  });

  useEffect(() => {
    const foundComic = comics.find((c: any) => c.id === params.id);
    if (foundComic) {
      setComic(foundComic);

      // Update bookmark count
      const realCount = users.filter(user => user.bookmarks.includes(foundComic.id)).length;
      setBookmarkCount(realCount);

      // Load reactions for this comic
      const storedReactions = localStorage.getItem('sakura-reactions');
      if (storedReactions) {
        try {
          const allReactions: ComicReactions = JSON.parse(storedReactions);
          if (allReactions[foundComic.id]) {
            setReactions(allReactions[foundComic.id]);
          }
        } catch (error) {
          console.error('Error loading reactions:', error);
        }
      }

      // Load comments for this comic
      const storedComments = localStorage.getItem('sakura-comments');
      if (storedComments) {
        try {
          const allComments: ComicComments = JSON.parse(storedComments);
          if (allComments[foundComic.id]) {
            setComments(allComments[foundComic.id].map(comment => ({
              ...comment,
              createdAt: new Date(comment.createdAt)
            })));
          }
        } catch (error) {
          console.error('Error loading comments:', error);
        }
      }

      if (user) {
        setIsBookmarked(checkIsBookmarked(foundComic.id));

        // Check if user has already rated this comic
        const userRatings = JSON.parse(localStorage.getItem(`userRatings_${user.id}`) || '{}');
        const existingRating = userRatings[foundComic.id];
        if (existingRating) {
          setHasUserRated(true);
          setExistingUserRating(existingRating);
        } else {
          setHasUserRated(false);
          setExistingUserRating(0);
        }
      }
    }
  }, [params.id, comics, user, checkIsBookmarked, users]);

  const handleBookmark = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (comic) {
      if (isBookmarked) {
        removeBookmark(comic.id);
        setBookmarkCount(prev => Math.max(0, prev - 1));
      } else {
        addBookmark(comic.id);
        setBookmarkCount(prev => prev + 1);
      }
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleRate = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // If user has already rated, show their existing rating
    if (hasUserRated) {
      setUserRating(existingUserRating);
    } else {
      setUserRating(0);
    }
    setHoveredRating(0);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = () => {
    if (userRating > 0 && user && comic) {
      // Save user's rating to localStorage
      const userRatings = JSON.parse(localStorage.getItem(`userRatings_${user.id}`) || '{}');
      userRatings[comic.id] = userRating;
      localStorage.setItem(`userRatings_${user.id}`, JSON.stringify(userRatings));

      // Update local state
      setHasUserRated(true);
      setExistingUserRating(userRating);

      console.log(`Rating ${hasUserRated ? 'updated' : 'submitted'}: ${userRating} stars for ${comic.title}`);
      setShowRatingModal(false);
      setUserRating(0);
      setHoveredRating(0);
    }
  };

  const handleStarClick = (rating: number) => {
    setUserRating(rating);
  };

  const handleStarHover = (rating: number) => {
    setHoveredRating(rating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleReaction = (reactionType: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!comic) return;

    const currentReaction = reactions[reactionType as keyof typeof reactions];
    const hasReacted = currentReaction.users.includes(user.id);

    const updatedReactions = {
      ...reactions,
      [reactionType]: {
        count: hasReacted ? currentReaction.count - 1 : currentReaction.count + 1,
        users: hasReacted
          ? currentReaction.users.filter(id => id !== user.id)
          : [...currentReaction.users, user.id]
      }
    };

    setReactions(updatedReactions);

    // Save to localStorage
    const storedReactions = localStorage.getItem('sakura-reactions');
    const allReactions: ComicReactions = storedReactions ? JSON.parse(storedReactions) : {};
    allReactions[comic.id] = updatedReactions;
    localStorage.setItem('sakura-reactions', JSON.stringify(allReactions));
  };

  const handleCommentSubmit = () => {
    if (!user || !comic || !newComment.trim()) {
      if (!user) setShowAuthModal(true);
      return;
    }

    const newCommentObj: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      content: newComment.trim(),
      createdAt: new Date(),
      likes: 0,
      likedBy: []
    };

    const updatedComments = [newCommentObj, ...comments];
    setComments(updatedComments);
    setNewComment('');

    // Save to localStorage
    const storedComments = localStorage.getItem('sakura-comments');
    const allComments: ComicComments = storedComments ? JSON.parse(storedComments) : {};
    allComments[comic.id] = updatedComments;
    localStorage.setItem('sakura-comments', JSON.stringify(allComments));
  };

  const handleCommentLike = (commentId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const hasLiked = comment.likedBy.includes(user.id);
        return {
          ...comment,
          likes: hasLiked ? comment.likes - 1 : comment.likes + 1,
          likedBy: hasLiked
            ? comment.likedBy.filter(id => id !== user.id)
            : [...comment.likedBy, user.id]
        };
      }
      return comment;
    });

    setComments(updatedComments);

    // Save to localStorage
    if (comic) {
      const storedComments = localStorage.getItem('sakura-comments');
      const allComments: ComicComments = storedComments ? JSON.parse(storedComments) : {};
      allComments[comic.id] = updatedComments;
      localStorage.setItem('sakura-comments', JSON.stringify(allComments));
    }
  };

  const getFilteredComments = () => {
    let filtered = [...comments];

    switch (commentFilter) {
      case 'best':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'newest':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
    }

    return filtered;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Get sidebar comics for Popular section
  const getSidebarComics = () => {
    let filteredComics = [...comics];

    // For series page, exclude current comic from popular list
    if (comic) {
      filteredComics = comics.filter((c: any) => c.id !== comic.id);
    }

    return filteredComics
      .sort((a: any, b: any) => b.rating - a.rating)
      .slice(0, 10)
      .map((comic: any, index: number) => ({
        id: comic.id,
        rank: index + 1,
        title: comic.title,
        genres: comic.genres,
        rating: comic.rating,
        coverImage: comic.coverImage
      }));
  };

  const sidebarComics = getSidebarComics();

  if (!comic) {
    return (
      <div className="min-h-screen bg-background">
        <Header onLoginClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Comic not found</h1>
            <Link href="/comics" className="text-pink-400 hover:text-pink-300 mt-4 inline-block">
              Back to Comics
            </Link>
          </div>
        </div>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <Header onLoginClick={() => setShowAuthModal(true)} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Main Content Area with Hero */}
          <div className="lg:col-span-3">
            {/* Hero Section - Only in main content area */}
            <div className="relative min-h-[500px] overflow-hidden rounded-lg mb-8 bg-gray-900">
              {/* Background Image */}
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={comic.coverImage}
                  alt={`${comic.title} background`}
                  fill
                  className="object-cover blur-lg"
                  priority
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>

              {/* Hero Content */}
              <div className="relative z-10 p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Left Side - Cover & Stats */}
                  <div className="flex-shrink-0">
                    <Image
                      src={comic.coverImage}
                      alt={comic.title}
                      width={180}
                      height={260}
                      className="rounded-lg shadow-2xl"
                    />

                    {/* Bookmark Button */}
                    <button
                      onClick={handleBookmark}
                      className={`w-full mt-4 px-4 py-3 rounded-lg font-semibold transition-all ${
                        isBookmarked
                          ? 'sakura-button text-white opacity-90'
                          : 'sakura-button text-white hover:scale-105'
                      }`}
                    >
                      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>

                    {/* Follower Count */}
                    <div className="mt-2 text-center">
                      <span className="text-gray-300 text-sm">
                        Bookmarked by {bookmarkCount} {bookmarkCount === 1 ? 'person' : 'people'}
                      </span>
                    </div>

                    {/* Rating Section */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {/* 5 Star Display */}
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${star <= Math.ceil(comic.rating / 2) ? 'text-yellow-400' : 'text-gray-600'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-white font-semibold">{comic.rating}</span>
                        </div>
                        <button
                          onClick={handleRate}
                          className="sakura-button text-white px-3 py-1 rounded text-sm font-medium hover:scale-105 transition-transform"
                        >
                          Rate
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Status:</span>
                        <span className="text-white">{comic.status || 'Ongoing'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Type:</span>
                        <span className="text-white">{comic.tags[0] || 'Manhwa'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Info */}
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{comic.title}</h1>

                    {/* Synopsis */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Synopsis</h3>
                      <p className="text-gray-300 leading-relaxed text-sm">
                        {comic.description || `${comic.title} is an exciting manga series that follows thrilling adventures and captivating characters. Join the journey as the story unfolds with each chapter, bringing new challenges and discoveries.`}
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 gap-4 mb-6">
                      <div>
                        <h4 className="text-base font-semibold text-white mb-1">Author</h4>
                        <p className="text-gray-300 text-sm">{comic.author}</p>
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-white mb-1">Updated On</h4>
                        <p className="text-gray-300 text-sm">
                          {comic.chapters.length > 0
                            ? new Date(Math.max(...comic.chapters.map((ch: any) => ch.publishedAt.getTime()))).toLocaleDateString()
                            : 'No updates yet'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Genres */}
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-white mb-2">Genres</h4>
                      <div className="flex flex-wrap gap-2">
                        {comic.genres.map((genre: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-gray-700 text-gray-200 rounded-full text-xs">
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chapters Section - Redesigned */}
            <div className="sakura-gradient rounded-lg shadow-lg overflow-hidden sakura-glow-subtle">
              <div className="p-6">
                <h2 className="title-font text-lg font-semibold text-white mb-6">
                  Chapter {comic.title}
                </h2>

                {/* First and Latest Chapter Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* First Chapter Button */}
                  <Link
                    href={comic.chapters.length > 0 ? `/chapter/${comic.id}-1` : '#'}
                    className="sakura-button text-white p-4 rounded-lg text-center font-semibold hover:scale-105 transition-transform"
                  >
                    <div className="text-sm opacity-90">First Chapter</div>
                    <div className="text-base">Chapter 1</div>
                  </Link>

                  {/* Latest Chapter Button */}
                  {comic.chapters.length > 0 && (
                    <Link
                      href={`/chapter/${comic.id}-${comic.chapters
                        .sort((a: any, b: any) => b.publishedAt.getTime() - a.publishedAt.getTime())[0]
                        .number.replace(/^Chapter\s*/i, '')}`}
                      className="sakura-button text-white p-4 rounded-lg text-center font-semibold hover:scale-105 transition-transform"
                    >
                      <div className="text-sm opacity-90">New Chapter</div>
                      <div className="text-base">
                        Chapter {comic.chapters
                          .sort((a: any, b: any) => b.publishedAt.getTime() - a.publishedAt.getTime())[0]
                          .number.replace(/^Chapter\s*/i, '')}
                      </div>
                    </Link>
                  )}
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search Chapter. Example: 25 or 178"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sakura-primary focus:border-transparent"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      // You can implement search filtering here
                    }}
                  />
                </div>

                {/* Chapter List */}
                <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {comic.chapters.length > 0 ? (
                    comic.chapters
                      .sort((a: any, b: any) => b.publishedAt.getTime() - a.publishedAt.getTime())
                      .slice(0, showAllChapters ? undefined : 10)
                      .map((chapter: any, i: number) => {
                        const chapterNum = chapter.number.replace(/^Chapter\s*/i, '');
                        const formatDate = (date: Date) => {
                          return new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }).format(date);
                        };

                        return (
                          <Link
                            key={chapter.id}
                            href={`/chapter/${comic.id}-${chapterNum}`}
                            className="flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-700/50 border-l-4 border-sakura-primary rounded-r-lg transition-all group"
                          >
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-sakura-primary transition-colors">
                                Chapter {chapterNum} {chapter.title && `- ${chapter.title}`}
                              </h3>
                              <p className="text-xs text-gray-400">
                                {formatDate(chapter.publishedAt)}
                              </p>
                            </div>
                            {i === 0 && (
                              <span className="bg-sakura-primary text-white text-xs px-2 py-1 rounded-full font-medium ml-3">
                                NEW
                              </span>
                            )}
                          </Link>
                        );
                      })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No chapters available yet.</p>
                    </div>
                  )}
                </div>

                {/* Show All Toggle */}
                {comic.chapters.length > 10 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllChapters(!showAllChapters)}
                      className="text-sakura-primary hover:text-sakura-primary/80 text-sm font-medium transition-colors"
                    >
                      {showAllChapters ? 'Show Less' : `Show All (${comic.chapters.length} chapters)`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="sakura-gradient rounded-lg shadow-lg overflow-hidden sakura-glow-subtle mt-8">
              <div className="p-6">
                <h2 className="title-font text-lg font-semibold text-white mb-6">
                  Comments
                </h2>

                {/* Reactions Section */}
                <div className="mb-6">
                  <div className="text-center mb-4">
                    <h3 className="text-white font-semibold mb-2">What do you think?</h3>
                    <p className="text-gray-400 text-sm">
                      {Object.values(reactions).reduce((total, reaction) => total + reaction.count, 0)} Reactions
                    </p>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {[
                      { key: 'upvote', emoji: '👍', label: 'Upvote' },
                      { key: 'funny', emoji: '😂', label: 'Funny' },
                      { key: 'love', emoji: '😍', label: 'Love' },
                      { key: 'surprised', emoji: '😮', label: 'Surprised' },
                      { key: 'angry', emoji: '😠', label: 'Angry' },
                      { key: 'sad', emoji: '😢', label: 'Sad' }
                    ].map(({ key, emoji, label }) => {
                      const reaction = reactions[key as keyof typeof reactions];
                      const hasReacted = user && reaction.users.includes(user.id);

                      return (
                        <button
                          key={key}
                          onClick={() => handleReaction(key)}
                          className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                            hasReacted
                              ? 'bg-sakura-primary/20 border-2 border-sakura-primary scale-105'
                              : 'bg-gray-800/50 border-2 border-transparent hover:bg-gray-700/50 hover:scale-105'
                          }`}
                          title={!user ? 'Login to react' : `${hasReacted ? 'Remove' : 'Add'} ${label}`}
                        >
                          <span className="text-2xl mb-1">{emoji}</span>
                          <span className="text-white font-bold text-lg">{reaction.count}</span>
                          <span className="text-gray-400 text-xs">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment Input */}
                <div className="mb-6">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <Image
                          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                          alt={user.username}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sakura-primary focus:border-transparent resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={handleCommentSubmit}
                              disabled={!newComment.trim()}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                newComment.trim()
                                  ? 'sakura-button text-white hover:scale-105'
                                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              Post Comment
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-800/30 rounded-lg border border-gray-700">
                      <p className="text-gray-400 mb-3">Please login to post comments</p>
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="sakura-button text-white px-6 py-2 rounded-lg font-medium hover:scale-105 transition-transform"
                      >
                        Login
                      </button>
                    </div>
                  )}
                </div>

                {/* Comment Filter and Count */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">
                    {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                  </h3>
                  <div className="flex gap-2">
                    {['best', 'newest', 'oldest'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setCommentFilter(filter as typeof commentFilter)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          commentFilter === filter
                            ? 'sakura-button text-white'
                            : 'text-gray-400 hover:text-sakura-primary bg-gray-800/30'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {getFilteredComments().length > 0 ? (
                    getFilteredComments().map((comment) => (
                      <div key={comment.id} className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Image
                            src={comment.avatar}
                            alt={comment.username}
                            width={40}
                            height={40}
                            className="rounded-full flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-white font-semibold">{comment.username}</span>
                              <span className="text-gray-400 text-sm">{formatTimeAgo(comment.createdAt)}</span>
                            </div>
                            <p className="text-gray-300 mb-3 whitespace-pre-wrap">{comment.content}</p>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => handleCommentLike(comment.id)}
                                className={`flex items-center gap-2 text-sm transition-colors ${
                                  user && comment.likedBy.includes(user.id)
                                    ? 'text-sakura-primary'
                                    : 'text-gray-400 hover:text-sakura-primary'
                                }`}
                                title={!user ? 'Login to like comments' : 'Like comment'}
                              >
                                <span className="text-lg">👍</span>
                                <span>{comment.likes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No comments yet. Be the first to comment!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Popular Sidebar - Completely separate */}
          <div className="lg:col-span-2">
            <div className="sakura-gradient rounded-lg p-6 sakura-glow-subtle">
              <div className="flex items-center gap-2 mb-6">
                <Crown className="sakura-text-primary" size={20} />
                <h3 className="font-semibold text-lg body-font text-white">Popular</h3>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setPopularPeriod('weekly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex-1 text-center transition-colors ${
                    popularPeriod === 'weekly'
                      ? 'sakura-button text-white'
                      : 'text-muted-foreground hover:text-sakura-primary bg-black/20'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setPopularPeriod('monthly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex-1 text-center transition-colors ${
                    popularPeriod === 'monthly'
                      ? 'sakura-button text-white'
                      : 'text-muted-foreground hover:text-sakura-primary bg-black/20'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setPopularPeriod('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex-1 text-center transition-colors ${
                    popularPeriod === 'all'
                      ? 'sakura-button text-white'
                      : 'text-muted-foreground hover:text-sakura-primary bg-black/20'
                  }`}
                >
                  All
                </button>
              </div>

              <div className="space-y-4">
                {sidebarComics.length > 0 ? (
                  sidebarComics.map((comicItem: any, index: number) => (
                    <div key={index} className="flex gap-4 group hover:bg-sakura-primary/5 p-3 rounded-lg transition-colors">
                      <div className="w-8 h-8 sakura-button text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {comicItem.rank}
                      </div>
                      <Link href={`/series/${comicItem.id}`} className="relative flex-shrink-0 cursor-pointer">
                        <Image
                          src={comicItem.coverImage}
                          alt={comicItem.title}
                          width={60}
                          height={80}
                          className="rounded-lg object-cover w-[60px] h-[80px] hover:opacity-80 transition-opacity"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/series/${comicItem.id}`} className="hover:text-sakura-primary transition-colors cursor-pointer">
                          <h4 className="text-base font-medium mb-2 line-clamp-2 body-font leading-tight text-white" title={comicItem.title}>
                            {comicItem.title}
                          </h4>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-2 body-font">
                          {comicItem.genres.slice(0, 2).join(", ")}
                        </p>
                        <div className="scale-90 origin-left">
                          <StarRating rating={comicItem.rating} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No popular comics found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="sakura-gradient rounded-lg p-6 w-80 max-w-sm mx-4 border border-sakura-primary/30 sakura-glow-subtle">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {hasUserRated ? 'Update Rating' : 'Rate'}
              </h3>
              <button
                onClick={() => setShowRatingModal(false)}
                className="text-gray-400 hover:text-sakura-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Current Rating Info */}
            {hasUserRated && (
              <div className="text-center mb-4">
                <p className="text-sm text-gray-300 mb-1">Your current rating:</p>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${star <= existingUserRating ? 'text-sakura-primary' : 'text-gray-600'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="text-3xl transition-all hover:scale-110 transform duration-200"
                >
                  <span className={`${
                    star <= (hoveredRating || userRating)
                      ? 'text-sakura-primary drop-shadow-lg'
                      : 'text-gray-600'
                  }`}>
                    ★
                  </span>
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleRatingSubmit}
              disabled={userRating === 0}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                userRating > 0
                  ? 'sakura-button text-white hover:scale-105'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              {hasUserRated ? 'Update Rating' : 'Submit Rating'}
            </button>

            {hasUserRated && (
              <p className="text-xs text-gray-400 text-center mt-2">
                You can update your rating anytime
              </p>
            )}
          </div>
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
