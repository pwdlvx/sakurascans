"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, BookmarkCheck, LogIn } from "lucide-react";
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
      <span className="text-xs text-muted-foreground ml-1">{rating}</span>
    </div>
  );
}

export default function BookmarksPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, removeBookmark } = useAuth();
  const { comics } = useComics();

  // Get bookmarked comics
  const bookmarkedComics = user
    ? comics.filter(comic => user.bookmarks.includes(comic.id))
    : [];

  const handleRemoveBookmark = (comicId: string) => {
    if (confirm('Remove this comic from your bookmarks?')) {
      removeBookmark(comicId);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header onLoginClick={() => setShowAuthModal(true)} />

        {/* Login Required Message */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="asura-card p-8 rounded-lg">
              <LogIn className="mx-auto mb-4 text-sakura-primary" size={48} />
              <h1 className="title-font text-2xl mb-4">Login Required</h1>
              <p className="text-muted-foreground mb-6">
                You need to be logged in to view your bookmarked comics.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="sakura-button text-white px-6 py-3 rounded-lg font-semibold"
              >
                Login or Sign Up
              </button>
            </div>
          </div>
        </div>

        <Footer />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onLoginClick={() => setShowAuthModal(true)} />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="title-font text-3xl mb-4">My Bookmarks</h1>
          <p className="text-muted-foreground">
            {bookmarkedComics.length > 0
              ? `You have ${bookmarkedComics.length} bookmarked comic${bookmarkedComics.length === 1 ? '' : 's'}`
              : 'No bookmarked comics yet'
            }
          </p>
        </div>

        {/* Bookmarked Comics */}
        {bookmarkedComics.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {bookmarkedComics.map((comic) => (
              <div key={comic.id} className="comic-card group">
                <div className="relative">
                  <Image
                    src={comic.coverImage}
                    alt={comic.title}
                    width={200}
                    height={280}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-2 left-2 sakura-button text-white text-xs px-2 py-1 rounded font-medium">
                    {comic.tags[0] || 'MANHWA'}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRemoveBookmark(comic.id)}
                      className="p-2 rounded-lg bg-black/50 backdrop-blur-sm text-sakura-primary hover:text-red-400 transition-colors"
                      title="Remove from bookmarks"
                    >
                      <BookmarkCheck size={16} />
                    </button>
                  </div>
                  {comic.featured && (
                    <div className="absolute bottom-2 left-2 bg-sakura-primary text-white text-xs px-2 py-1 rounded font-medium">
                      Featured
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-sakura-accent text-white text-xs px-2 py-1 rounded font-medium">
                    Bookmarked
                  </div>
                </div>
                <div className="comic-info">
                  <h3 className="comic-title mb-2 line-clamp-2">{comic.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">By {comic.author}</p>
                  <p className="comic-chapter mb-2 text-sm">
                    {comic.chapters.length > 0 ? `${comic.chapters.length} chapters` : 'No chapters yet'}
                  </p>
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
          <div className="text-center py-16">
            <div className="asura-card p-8 rounded-lg max-w-md mx-auto">
              <BookmarkCheck className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-lg font-semibold mb-2">No Bookmarks Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding comics to your bookmarks to keep track of your favorites!
              </p>
              <Link
                href="/comics"
                className="sakura-button text-white px-6 py-3 rounded-lg font-semibold inline-block"
              >
                Browse Comics
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
