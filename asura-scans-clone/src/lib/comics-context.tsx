"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Comic {
  id: string;
  title: string;
  author: string;
  description: string;
  genres: string[];
  status: 'Ongoing' | 'Completed' | 'Hiatus';
  coverImage: string;
  chapters: Chapter[];
  rating: number;
  views: number;
  createdAt: Date;
  featured?: boolean;
  trending?: boolean;
  tags: string[];
}

export interface Chapter {
  id: string;
  comicId: string;
  number: string;
  title: string;
  pages: string[];
  publishedAt: Date;
}

interface ComicsContextType {
  comics: Comic[];
  featuredComic: Comic | null;
  popularComics: Comic[];
  latestUpdates: Array<{
    comic: Comic;
    chapters: Chapter[];
  }>;
  addComic: (comic: Omit<Comic, 'id' | 'createdAt' | 'chapters'>) => string;
  updateComic: (id: string, updates: Partial<Comic>) => void;
  deleteComic: (id: string) => void;
  addChapter: (comicId: string, chapter: Omit<Chapter, 'id' | 'publishedAt'>) => void;
  deleteChapter: (comicId: string, chapterId: string) => void;
  getComicById: (id: string) => Comic | undefined;
  setFeaturedComic: (comicId: string) => void;
  setTrendingComic: (comicId: string) => void;
}

const ComicsContext = createContext<ComicsContextType | undefined>(undefined);

// Fixed base date for consistent hydration
const baseDate = new Date('2025-07-15T00:00:00Z');

// Default/demo comics data with fixed dates
const defaultComics: Comic[] = [
  {
    id: "popular-1",
    title: "Swordmaster's Youngest Son",
    author: "Manhwa Studio",
    description: "Jin Runcandel was the youngest son of Runcandel, the land's most prestigious swordsman family...",
    genres: ["Action", "Adventure", "Fantasy"],
    status: "Ongoing",
    coverImage: "https://ext.same-assets.com/800411728/3325920404.webp",
    chapters: [
      { id: "ch-167", comicId: "popular-1", number: "167", title: "The Final Battle", pages: [], publishedAt: new Date('2025-07-14T22:00:00Z') }, // 2 hours ago
      { id: "ch-166", comicId: "popular-1", number: "166", title: "Preparation", pages: [], publishedAt: new Date('2025-07-13T00:00:00Z') }, // 2 days ago
      { id: "ch-165", comicId: "popular-1", number: "165", title: "Training", pages: [], publishedAt: new Date('2025-07-10T00:00:00Z') } // 5 days ago
    ],
    rating: 9.9,
    views: 150000,
    createdAt: new Date('2023-01-01'),
    featured: false,
    trending: false,
    tags: ["MANHWA"]
  },
  {
    id: "popular-2",
    title: "Academy's Genius Swordmaster",
    author: "Academy Studios",
    description: "A talented swordmaster returns to the academy to train the next generation...",
    genres: ["Action", "School", "Fantasy"],
    status: "Ongoing",
    coverImage: "https://ext.same-assets.com/800411728/3515222749.webp",
    chapters: [
      { id: "ch-109", comicId: "popular-2", number: "109", title: "New Techniques", pages: [], publishedAt: new Date('2025-07-14T18:00:00Z') }, // 6 hours ago
      { id: "ch-108", comicId: "popular-2", number: "108", title: "Academy Festival", pages: [], publishedAt: new Date('2025-07-12T00:00:00Z') }, // 3 days ago
      { id: "ch-107", comicId: "popular-2", number: "107", title: "Sword Master's Path", pages: [], publishedAt: new Date('2025-07-09T00:00:00Z') } // 6 days ago
    ],
    rating: 9.5,
    views: 120000,
    createdAt: new Date('2023-02-01'),
    featured: false,
    trending: false,
    tags: ["MANHWA"]
  },
  {
    id: "featured-1",
    title: "A Cadet Becomes A Prophet?!",
    author: "MANHWA",
    description: "Money maniac Fernan Pellenberg is the young heir of House Pellenberg, one of the Empire's most prestigious hou...",
    genres: ["Action", "Adventure", "Fantasy", "Genius MC"],
    status: "Ongoing",
    coverImage: "https://ext.same-assets.com/800411728/3433700574.webp",
    chapters: [
      { id: "ch-15", comicId: "featured-1", number: "15", title: "The Prophecy Unfolds", pages: [], publishedAt: new Date('2025-07-14T23:30:00Z') }, // 30 minutes ago
      { id: "ch-14", comicId: "featured-1", number: "14", title: "Empire's Secrets", pages: [], publishedAt: new Date('2025-07-14T00:00:00Z') }, // 1 day ago
      { id: "ch-13", comicId: "featured-1", number: "13", title: "Noble Houses", pages: [], publishedAt: new Date('2025-07-11T00:00:00Z') } // 4 days ago
    ],
    rating: 9.3,
    views: 200000,
    createdAt: new Date('2023-03-01'),
    featured: true,
    trending: false,
    tags: ["MANHWA"]
  },
  {
    id: "action-1",
    title: "The Knight King Who Returned with Gods",
    author: "Action Studios",
    description: "A powerful knight returns from another world with divine powers...",
    genres: ["Action", "Fantasy", "Adventure"],
    status: "Ongoing",
    coverImage: "https://i.redd.it/rt6queh0zaab1.jpg",
    chapters: [
      { id: "ch-120", comicId: "action-1", number: "120", title: "Divine Power Awakens", pages: [], publishedAt: new Date('2025-07-14T23:00:00Z') }, // 1 hour ago
      { id: "ch-119", comicId: "action-1", number: "119", title: "Knight's Return", pages: [], publishedAt: new Date('2025-07-13T12:00:00Z') }, // 1.5 days ago
      { id: "ch-118", comicId: "action-1", number: "118", title: "Gods' Blessing", pages: [], publishedAt: new Date('2025-07-08T00:00:00Z') } // 7 days ago
    ],
    rating: 9.7,
    views: 180000,
    createdAt: new Date('2023-04-01'),
    featured: false,
    trending: true,
    tags: ["MANHWA"]
  },
  {
    id: "magic-1",
    title: "I'm Gonna Annihilate This Land",
    author: "Magic Works",
    description: "A powerful mage seeks to reshape the world according to his vision...",
    genres: ["Fantasy", "Magic", "Action"],
    status: "Ongoing",
    coverImage: "https://ext.same-assets.com/800411728/1847296573.webp",
    chapters: [
      { id: "ch-43", comicId: "magic-1", number: "43", title: "Land's Destruction", pages: [], publishedAt: new Date('2025-07-14T21:00:00Z') }, // 3 hours ago
      { id: "ch-42", comicId: "magic-1", number: "42", title: "Magical Powers", pages: [], publishedAt: new Date('2025-07-12T12:00:00Z') }, // 2.5 days ago
      { id: "ch-41", comicId: "magic-1", number: "41", title: "World Reshape", pages: [], publishedAt: new Date('2025-07-07T00:00:00Z') } // 8 days ago
    ],
    rating: 9.4,
    views: 160000,
    createdAt: new Date('2023-05-01'),
    featured: false,
    trending: false,
    tags: ["MANHWA"]
  }
];

export function ComicsProvider({ children }: { children: React.ReactNode }) {
  const [comics, setComics] = useState<Comic[]>([]);

  useEffect(() => {
    // Load comics from localStorage or use defaults
    const savedComics = localStorage.getItem('sakura-comics');
    const dataVersion = localStorage.getItem('sakura-comics-version');

    // Reset data if version changed (to fix duplicates and cover images)
    if (dataVersion !== '2.0' || !savedComics) {
      setComics(defaultComics);
      localStorage.setItem('sakura-comics-version', '2.0');
    } else {
      try {
        const parsedComics = JSON.parse(savedComics).map((comic: Comic) => ({
          ...comic,
          createdAt: new Date(comic.createdAt),
          chapters: comic.chapters.map((chapter: Chapter) => ({
            ...chapter,
            publishedAt: new Date(chapter.publishedAt)
          }))
        }));

        // Remove any duplicate comics by ID
        const uniqueComics = parsedComics.filter((comic: Comic, index: number, arr: Comic[]) =>
          arr.findIndex(c => c.id === comic.id) === index
        );

        setComics(uniqueComics);
      } catch (error) {
        setComics(defaultComics);
        localStorage.setItem('sakura-comics-version', '2.0');
      }
    }
  }, []);

  useEffect(() => {
    // Save comics to localStorage whenever comics change
    localStorage.setItem('sakura-comics', JSON.stringify(comics));
  }, [comics]);

  const addComic = (comicData: Omit<Comic, 'id' | 'createdAt' | 'chapters'>): string => {
    const newComic: Comic = {
      ...comicData,
      id: `comic-${Date.now()}`,
      createdAt: new Date(),
      chapters: []
    };

    setComics(prev => [...prev, newComic]);
    return newComic.id;
  };

  const updateComic = (id: string, updates: Partial<Comic>) => {
    setComics(prev => prev.map(comic =>
      comic.id === id ? { ...comic, ...updates } : comic
    ));
  };

  const deleteComic = (id: string) => {
    setComics(prev => prev.filter(comic => comic.id !== id));
  };

  const addChapter = (comicId: string, chapterData: Omit<Chapter, 'id' | 'publishedAt'>) => {
    const newChapter: Chapter = {
      ...chapterData,
      id: `chapter-${Date.now()}`,
      publishedAt: new Date()
    };

    setComics(prev => prev.map(comic => {
      if (comic.id === comicId) {
        return {
          ...comic,
          chapters: [...comic.chapters, newChapter]
        };
      }
      return comic;
    }));
  };

  const deleteChapter = (comicId: string, chapterId: string) => {
    // Find the chapter to get its number for cleanup
    const comic = comics.find(c => c.id === comicId);
    const chapterToDelete = comic?.chapters.find(ch => ch.id === chapterId);

    setComics(prev => prev.map(comic => {
      if (comic.id === comicId) {
        return {
          ...comic,
          chapters: comic.chapters.filter(chapter => chapter.id !== chapterId)
        };
      }
      return comic;
    }));

    // Clean up localStorage for chapter images
    if (chapterToDelete) {
      const chapterKey = `${comicId}-${chapterToDelete.number}`;
      localStorage.removeItem(`chapter-${chapterKey}-images`);

      // Also clean up any manga-chapters entries
      try {
        const existingChapters = JSON.parse(localStorage.getItem('manga-chapters') || '[]');
        const updatedChapters = existingChapters.filter((ch: any) => ch.id !== chapterKey);
        localStorage.setItem('manga-chapters', JSON.stringify(updatedChapters));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  };

  const getComicById = (id: string): Comic | undefined => {
    return comics.find(comic => comic.id === id);
  };

  const setFeaturedComic = (comicId: string) => {
    setComics(prev => prev.map(comic => ({
      ...comic,
      featured: comic.id === comicId
    })));
  };

  const setTrendingComic = (comicId: string) => {
    setComics(prev => prev.map(comic => ({
      ...comic,
      trending: comic.id === comicId
    })));
  };

  // Computed values
  const featuredComic = comics.find(comic => comic.featured) || comics[0] || null;

  // Popular comics - ensure no duplicates and exclude featured comic
  const popularComics = comics
    .filter(comic => !comic.featured)
    .filter((comic, index, arr) => arr.findIndex(c => c.id === comic.id) === index) // Remove duplicates by ID
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  // Latest updates - show each comic only once with its most recent chapters
  const latestUpdates = comics
    .filter(comic => comic.chapters.length > 0)
    .filter((comic, index, arr) => arr.findIndex(c => c.id === comic.id) === index) // Remove duplicates by ID
    .map(comic => {
      // Get the most recent chapters for this comic
      const sortedChapters = comic.chapters
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

      return {
        comic,
        chapters: sortedChapters.slice(0, 3), // Show up to 3 most recent chapters
        latestChapterDate: sortedChapters[0]?.publishedAt || new Date(0)
      };
    })
    .filter(item => item.chapters.length > 0)
    .sort((a, b) => b.latestChapterDate.getTime() - a.latestChapterDate.getTime()) // Sort by most recent chapter
    .slice(0, 10);

  return (
    <ComicsContext.Provider value={{
      comics,
      featuredComic,
      popularComics,
      latestUpdates,
      addComic,
      updateComic,
      deleteComic,
      addChapter,
      deleteChapter,
      getComicById,
      setFeaturedComic,
      setTrendingComic
    }}>
      {children}
    </ComicsContext.Provider>
  );
}

export function useComics() {
  const context = useContext(ComicsContext);
  if (context === undefined) {
    throw new Error('useComics must be used within a ComicsProvider');
  }
  return context;
}
