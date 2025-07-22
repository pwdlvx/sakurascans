"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useComics, Comic, Chapter } from '@/lib/comics-context';
import { Upload, Plus, Edit, Trash2, Eye, Users, BookOpen, Crown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { uploadFromUrl, generateChapterPageUrls } from '@/lib/r2';

export default function AdminPage() {
  const { user } = useAuth();
  const users = useAuth(); // Get all auth functions including users list
  const { comics, addComic, updateComic, deleteComic, addChapter, deleteChapter, setFeaturedComic, setTrendingComic } = useComics();
  const [activeTab, setActiveTab] = useState<'comics' | 'chapters' | 'users'>('comics');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);

  // Form states
  const [comicForm, setComicForm] = useState({
    title: '',
    author: '',
    description: '',
    genres: [] as string[],
    status: 'Ongoing' as 'Ongoing' | 'Completed' | 'Hiatus',
    coverImage: '',
    rating: 0,
    views: 0,
    featured: false,
    trending: false,
    tags: ['MANHWA']
  });

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Chapter editor states
  const [chapterPages, setChapterPages] = useState<string[]>([]);
  const [chapterPreviewMode, setChapterPreviewMode] = useState(false);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(0);
  const [chapterDragging, setChapterDragging] = useState(false);
  const [chapterUrlInput, setChapterUrlInput] = useState<string>('');

  const [chapterForm, setChapterForm] = useState({
    comicId: '',
    number: '',
    title: '',
    pages: [] as string[]
  });

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/';
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'comics', label: 'Comics', icon: BookOpen },
    { id: 'chapters', label: 'Chapters', icon: Edit },
    { id: 'users', label: 'Users', icon: Users }
  ];

  const availableGenres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Horror', 'Mystery', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Genius MC', 'School'];

  const handleComicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comicForm.title && comicForm.author && comicForm.coverImage) {
      addComic(comicForm);
      setComicForm({
        title: '',
        author: '',
        description: '',
        genres: [],
        status: 'Ongoing',
        coverImage: '',
        rating: 0,
        views: 0,
        featured: false,
        trending: false,
        tags: ['MANHWA']
      });
      setImagePreview('');
      setShowUploadModal(false);
    }
  };

  // File upload handlers
  const handleFileUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be under 5MB');
      return;
    }

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      alert('Only JPG, PNG, or WebP files are allowed');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setComicForm(prev => ({ ...prev, coverImage: result }));
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Chapter editor handlers
  const handleChapterUrlsAdd = () => {
    if (!chapterUrlInput.trim()) return;

    // Split by newlines and filter out empty lines
    const urls = chapterUrlInput
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .filter(url => {
        // Basic URL validation
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });

    if (urls.length === 0) {
      alert('Please enter valid image URLs, one per line.');
      return;
    }

    // Add the new URLs to existing pages
    setChapterPages(prev => [...prev, ...urls]);
    setChapterForm(prev => ({ ...prev, pages: [...prev.pages, ...urls] }));

    // Clear the input
    setChapterUrlInput('');
  };

  const removeChapterPage = (index: number) => {
    const newPages = chapterPages.filter((_, i) => i !== index);
    setChapterPages(newPages);
    setChapterForm(prev => ({ ...prev, pages: newPages }));
  };

  const reorderChapterPages = (fromIndex: number, toIndex: number) => {
    const newPages = [...chapterPages];
    const [removed] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, removed);
    setChapterPages(newPages);
    setChapterForm(prev => ({ ...prev, pages: newPages }));
  };

  // New: Save chapter images in the format expected by the chapter reader
  const handleCreateChapter = () => {
    if (chapterForm.comicId && chapterForm.number && chapterPages.length > 0) {
      const chapterId = `${chapterForm.comicId}-${chapterForm.number}`;

      // Create chapter data for comics context
      const newChapter = {
        comicId: chapterForm.comicId,
        number: chapterForm.number,
        title: chapterForm.title || '',
        pages: chapterPages
      };

      // Save chapter data for chapter reader
      const chapterReaderData = {
        id: chapterId,
        title: chapterForm.title || chapterForm.number,
        number: parseInt(chapterForm.number),
        seriesId: chapterForm.comicId,
        seriesTitle: comics.find(c => c.id === chapterForm.comicId)?.title || 'Unknown Series'
      };

      // Save chapter images in the format expected by chapter reader
      const chapterImages = chapterPages.map((url, index) => ({
        id: `${chapterId}-${index + 1}`,
        url: url,
        pageNumber: index + 1
      }));

      // Save to localStorage for chapter reader
      const existingChapters = JSON.parse(localStorage.getItem('manga-chapters') || '[]');
      const updatedChapters = [...existingChapters.filter((ch: any) => ch.id !== chapterId), chapterReaderData];
      localStorage.setItem('manga-chapters', JSON.stringify(updatedChapters));
      localStorage.setItem(`chapter-${chapterId}-images`, JSON.stringify(chapterImages));

      // Add to comics context
      addChapter(chapterForm.comicId, newChapter);



      // Reset form
      setChapterForm({ comicId: '', number: '', title: '', pages: [] });
      setChapterPages([]);
      setShowChapterModal(false);

      alert(`Chapter ${chapterForm.number} created successfully! You can now read it by clicking on the chapter link.`);
    }
  };

  // Old handleChapterSubmit replaced by handleCreateChapter
  const handleChapterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleCreateChapter();
  };

  const resetChapterEditor = () => {
    setChapterForm({
      comicId: '',
      number: '',
      title: '',
      pages: []
    });
    setChapterPages([]);
    setChapterPreviewMode(false);
    setCurrentPreviewPage(0);
    setChapterDragging(false);
    setChapterUrlInput('');
  };

  const handleGenreToggle = (genre: string) => {
    setComicForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleSetFeatured = (comicId: string) => {
    setFeaturedComic(comicId);
  };

  const handleSetTrending = (comicId: string) => {
    setTrendingComic(comicId);
  };

  const handleDeleteComic = (comicId: string) => {
    if (confirm('Are you sure you want to delete this comic?')) {
      deleteComic(comicId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="header-blur border-b border-sakura-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-8 h-8 sakura-button rounded flex items-center justify-center">
                <Crown className="text-white" size={16} />
              </div>
              <h1 className="title-font text-xl sakura-text-primary">Admin Panel</h1>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Welcome back,</span>
              <span className="font-semibold sakura-text-primary">{user.username}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="asura-card p-4 rounded-lg">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'comics' | 'chapters' | 'users')}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        activeTab === tab.id
                          ? 'sakura-button text-white'
                          : 'text-muted-foreground hover:text-sakura-primary hover:bg-secondary'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {activeTab === 'comics' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="title-font text-2xl">Manage Comics ({comics.length})</h2>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="sakura-button text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Comic
                  </button>
                </div>

                <div className="asura-card rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-sakura-border">
                    <input
                      type="text"
                      placeholder="Search comics by title, author, or genre..."
                      className="search-input w-full px-4 py-2 rounded-lg"
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        // Filter comics based on search
                        const filteredComics = comics.filter(comic =>
                          comic.title.toLowerCase().includes(searchTerm) ||
                          comic.author.toLowerCase().includes(searchTerm) ||
                          comic.genres.some(genre => genre.toLowerCase().includes(searchTerm))
                        );
                        // You can implement state management for filtered results if needed
                      }}
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="text-left p-4 font-medium">Comic</th>
                          <th className="text-left p-4 font-medium">Author</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Chapters</th>
                          <th className="text-left p-4 font-medium">Rating</th>
                          <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comics.map((comic) => (
                          <tr key={comic.id} className="border-b border-sakura-border">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Image
                                  src={comic.coverImage}
                                  alt={comic.title}
                                  width={40}
                                  height={54}
                                  className="rounded object-cover"
                                />
                                <div>
                                  <p className="font-medium text-sm">{comic.title}</p>
                                  <div className="flex gap-1 mt-1">
                                    {comic.featured && (
                                      <span className="bg-sakura-primary text-white text-xs px-2 py-0.5 rounded">Featured</span>
                                    )}
                                    {comic.trending && (
                                      <span className="bg-sakura-accent text-white text-xs px-2 py-0.5 rounded">Trending</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{comic.author}</td>
                            <td className="p-4">
                              <span className={`text-xs px-2 py-1 rounded ${
                                comic.status === 'Ongoing' ? 'bg-green-500/20 text-green-400' :
                                comic.status === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {comic.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm">{comic.chapters.length}</td>
                            <td className="p-4 text-sm">{comic.rating}/10</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSetFeatured(comic.id)}
                                  className={`p-2 rounded ${comic.featured ? 'bg-sakura-primary text-white' : 'text-muted-foreground hover:text-sakura-primary'}`}
                                  title="Set as featured"
                                >
                                  <Crown size={14} />
                                </button>
                                <button
                                  onClick={() => handleSetTrending(comic.id)}
                                  className={`p-2 rounded ${comic.trending ? 'bg-sakura-accent text-white' : 'text-muted-foreground hover:text-sakura-accent'}`}
                                  title="Set as trending"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedComic(comic);
                                    setChapterForm(prev => ({ ...prev, comicId: comic.id }));
                                    setShowChapterModal(true);
                                  }}
                                  className="p-2 text-muted-foreground hover:text-blue-400"
                                  title="Add chapter"
                                >
                                  <Plus size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteComic(comic.id)}
                                  className="p-2 text-muted-foreground hover:text-red-400"
                                  title="Delete comic"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chapters' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="title-font text-2xl">Manage Chapters</h2>
                  <button
                    onClick={() => setShowChapterModal(true)}
                    className="sakura-button text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Chapter
                  </button>
                </div>

                <div className="space-y-6">
                  {comics.map((comic) => (
                    <div key={comic.id} className="asura-card p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={comic.coverImage}
                            alt={comic.title}
                            width={40}
                            height={54}
                            className="rounded object-cover"
                          />
                          <div>
                            <h3 className="font-medium">{comic.title}</h3>
                            <p className="text-sm text-muted-foreground">{comic.chapters.length} chapters</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedComic(comic);
                            setChapterForm(prev => ({ ...prev, comicId: comic.id }));
                            setShowChapterModal(true);
                          }}
                          className="sakura-button text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                        >
                          <Plus size={14} />
                          Add Chapter
                        </button>
                      </div>

                      {comic.chapters.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Existing Chapters:</h4>
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {comic.chapters
                              .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                              .map((chapter) => (
                              <div key={chapter.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                                <div className="flex-1">
                                  <span className="text-sm font-medium">
                                    Chapter {chapter.number}
                                    {chapter.title && ` - ${chapter.title}`}
                                  </span>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(chapter.publishedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/chapter/${comic.id}-${chapter.number}`}
                                    className="p-1 text-muted-foreground hover:text-sakura-primary"
                                    title="View chapter"
                                  >
                                    <Eye size={14} />
                                  </Link>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete Chapter ${chapter.number}?`)) {
                                        deleteChapter(comic.id, chapter.id);
                                      }
                                    }}
                                    className="p-1 text-muted-foreground hover:text-red-400"
                                    title="Delete chapter"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <h2 className="title-font text-2xl">User Management</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="asura-card p-4 rounded-lg">
                    <p className="text-2xl font-bold">{users.getNewUsersCount(30)}</p>
                    <p className="text-sm text-muted-foreground">New Users (30 days)</p>
                  </div>
                  <div className="asura-card p-4 rounded-lg">
                    <p className="text-2xl font-bold">{users.getTotalUsers()}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                  <div className="asura-card p-4 rounded-lg">
                    <p className="text-2xl font-bold">98.5%</p>
                    <p className="text-sm text-muted-foreground">User Satisfaction</p>
                  </div>
                </div>

                <div className="asura-card rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-sakura-border">
                    <h3 className="font-medium">Registered Users ({users.users.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="text-left p-4 font-medium">User</th>
                          <th className="text-left p-4 font-medium">Email</th>
                          <th className="text-left p-4 font-medium">Role</th>
                          <th className="text-left p-4 font-medium">Joined</th>
                          <th className="text-left p-4 font-medium">Activity</th>
                          <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.users.length > 0 ? users.users.map((userData) => (
                          <tr key={userData.id} className="border-b border-sakura-border">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Image
                                  src={userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`}
                                  alt={userData.username}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                                <div>
                                  <p className="font-medium text-sm">{userData.username}</p>
                                  <div className="flex gap-1 mt-1">
                                    {userData.role === 'admin' && (
                                      <span className="bg-sakura-primary text-white text-xs px-2 py-0.5 rounded">Admin</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{userData.email}</td>
                            <td className="p-4">
                              <span className={`text-xs px-2 py-1 rounded ${
                                userData.role === 'admin' ? 'bg-sakura-primary/20 text-sakura-primary' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {userData.role}
                              </span>
                            </td>
                            <td className="p-4 text-sm">
                              {userData.joinedAt.toLocaleDateString()}
                            </td>
                            <td className="p-4 text-sm">
                              <p>{userData.bookmarks.length} bookmarks</p>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {userData.role !== 'admin' && userData.id !== users.user?.id && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete user "${userData.username}"?`)) {
                                        users.deleteUser(userData.id);
                                      }
                                    }}
                                    className="p-2 text-muted-foreground hover:text-red-400"
                                    title="Delete user"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                                <button
                                  className="p-2 text-muted-foreground hover:text-sakura-primary"
                                  title="View details"
                                >
                                  <Eye size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              No users registered yet. Users need to sign up to create accounts.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Comic Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="sakura-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold sakura-text-primary">Add New Comic</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setImagePreview('');
                }}
                className="text-muted-foreground hover:text-sakura-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleComicSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={comicForm.title}
                    onChange={(e) => setComicForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 bg-secondary border border-sakura-border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Author *</label>
                  <input
                    type="text"
                    value={comicForm.author}
                    onChange={(e) => setComicForm(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-4 py-2 bg-secondary border border-sakura-border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cover Image *</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? 'border-sakura-primary bg-sakura-primary/5'
                      : 'border-sakura-border hover:border-sakura-primary/50'
                  }`}
                >
                  {imagePreview || comicForm.coverImage ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <Image
                          src={imagePreview || comicForm.coverImage}
                          alt="Cover preview"
                          width={120}
                          height={160}
                          className="rounded object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setComicForm(prev => ({ ...prev, coverImage: '' }));
                            setImagePreview('');
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-sakura-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="text-sakura-primary" size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Drop your image here, or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports JPG, PNG, WebP (max 5MB)
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={comicForm.description}
                  onChange={(e) => setComicForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-secondary border border-sakura-border rounded-lg h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={comicForm.status}
                    onChange={(e) => setComicForm(prev => ({ ...prev, status: e.target.value as 'Ongoing' | 'Completed' | 'Hiatus' }))}
                    className="w-full px-4 py-2 bg-secondary border border-sakura-border rounded-lg"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Hiatus">Hiatus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Rating (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={comicForm.rating}
                    onChange={(e) => setComicForm(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 bg-secondary border border-sakura-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Views</label>
                  <input
                    type="number"
                    min="0"
                    value={comicForm.views}
                    onChange={(e) => setComicForm(prev => ({ ...prev, views: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 bg-secondary border border-sakura-border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Genres</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {availableGenres.map((genre) => (
                    <label key={genre} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={comicForm.genres.includes(genre)}
                        onChange={() => handleGenreToggle(genre)}
                        className="rounded"
                      />
                      <span className="text-sm">{genre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={comicForm.featured}
                    onChange={(e) => setComicForm(prev => ({ ...prev, featured: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Set as Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={comicForm.trending}
                    onChange={(e) => setComicForm(prev => ({ ...prev, trending: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Set as Trending</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setImagePreview('');
                  }}
                  className="flex-1 px-4 py-2 border border-sakura-border rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sakura-button text-white px-4 py-2 rounded-lg"
                >
                  Add Comic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Chapter Editor Modal */}
      {showChapterModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        >
          <div
            className="sakura-card rounded-lg w-full max-w-6xl my-4 relative z-60"
            onDragOver={(e) => e.stopPropagation()}
            onDrop={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-sakura-border sticky top-0 bg-card z-10">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold sakura-text-primary">Chapter Editor</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChapterPreviewMode(false)}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      !chapterPreviewMode
                        ? 'sakura-button text-white'
                        : 'text-muted-foreground hover:text-sakura-primary'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setChapterPreviewMode(true)}
                    disabled={chapterPages.length === 0}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      chapterPreviewMode
                        ? 'sakura-button text-white'
                        : 'text-muted-foreground hover:text-sakura-primary disabled:opacity-50'
                    }`}
                  >
                    Preview ({chapterPages.length})
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChapterModal(false);
                  resetChapterEditor();
                }}
                className="text-muted-foreground hover:text-sakura-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {!chapterPreviewMode ? (
              /* Edit Mode */
              <form onSubmit={handleChapterSubmit} className="flex flex-col">
                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] relative z-10">
                  {/* Chapter Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-20">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Comic *</label>
                      <select
                        value={chapterForm.comicId}
                        onChange={(e) => setChapterForm(prev => ({ ...prev, comicId: e.target.value }))}
                        className="w-full px-4 py-2 bg-secondary border border-sakura-border rounded-lg relative z-30 pointer-events-auto"
                        required
                        style={{ pointerEvents: 'auto' }}
                      >
                        <option value="">Choose a comic...</option>
                        {comics.map((comic) => (
                          <option key={comic.id} value={comic.id}>
                            {comic.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Chapter Number *</label>
                      <input
                        type="text"
                        value={chapterForm.number}
                        onChange={(e) => setChapterForm(prev => ({ ...prev, number: e.target.value }))}
                        className="w-full px-4 py-2 bg-secondary border border-sakura-border rounded-lg relative z-30 pointer-events-auto"
                        placeholder="1, 2, 3..."
                        required
                        style={{ pointerEvents: 'auto' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Chapter Title (Optional)</label>
                      <input
                        type="text"
                        value={chapterForm.title}
                        onChange={(e) => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2 bg-secondary border border-sakura-border rounded-lg relative z-30 pointer-events-auto"
                        placeholder="Chapter title..."
                        style={{ pointerEvents: 'auto' }}
                      />
                    </div>
                  </div>

                  {/* Pages Upload Area */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Chapter Pages</label>
                    <div className="space-y-4">
                      <textarea
                        value={chapterUrlInput}
                        onChange={(e) => setChapterUrlInput(e.target.value)}
                        placeholder="Enter image URLs, one per line&#10;Example:&#10;https://picsum.photos/800/1200&#10;https://via.placeholder.com/800x1200"
                        className="w-full h-40 px-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary text-foreground resize-none text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleChapterUrlsAdd}
                          disabled={!chapterUrlInput.trim()}
                          className="flex-1 sakura-button text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Image URLs
                        </button>
                        <button
                          type="button"
                          onClick={() => setChapterUrlInput('')}
                          className="px-4 py-2 border border-sakura-border rounded-lg hover:bg-secondary transition-colors text-foreground"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pages Preview Grid */}
                  {chapterPages.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">Chapter Pages ({chapterPages.length})</h3>
                        <p className="text-xs text-muted-foreground">Drag to reorder</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-80 overflow-y-auto">
                        {chapterPages.map((page, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-[3/4] bg-muted/20 rounded-lg overflow-hidden">
                              <Image
                                src={page}
                                alt={`Page ${index + 1}`}
                                width={120}
                                height={160}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeChapterPage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-sakura-border bg-card sticky bottom-0">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChapterModal(false);
                        resetChapterEditor();
                      }}
                      className="flex-1 px-4 py-2 border border-sakura-border rounded-lg hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!chapterForm.comicId || !chapterForm.number || chapterPages.length === 0}
                      className="flex-1 sakura-button text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      Create Chapter
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Preview Mode - Continuous Top-to-Bottom Scrolling */
              <div className="flex flex-col">
                {/* Preview Header */}
                <div className="p-4 border-b border-sakura-border bg-secondary/20 sticky top-[73px] z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="font-medium">Reader Preview</h3>
                      <div className="text-sm text-muted-foreground">
                        {chapterForm.comicId && comics.find(c => c.id === chapterForm.comicId)?.title} - Chapter {chapterForm.number}
                        {chapterForm.title && `: ${chapterForm.title}`}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {chapterPages.length} pages
                    </div>
                  </div>
                </div>

                {/* Continuous Scrolling Reader */}
                <div className="bg-black overflow-y-auto max-h-[70vh]">
                  {chapterPages.length > 0 ? (
                    <div className="space-y-1">
                      {chapterPages.map((page, index) => (
                        <div key={index} className="relative flex justify-center">
                          <Image
                            src={page}
                            alt={`Page ${index + 1}`}
                            width={800}
                            height={1200}
                            className="max-w-full h-auto object-contain"
                            style={{ maxHeight: '100vh' }}
                          />
                          {/* Page Number Overlay */}
                          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                            Page {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-white">
                      <p>No pages uploaded yet</p>
                    </div>
                  )}
                </div>

                {/* Preview Footer */}
                <div className="p-6 border-t border-sakura-border bg-card sticky bottom-0">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChapterModal(false);
                        resetChapterEditor();
                      }}
                      className="flex-1 px-4 py-2 border border-sakura-border rounded-lg hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleChapterSubmit}
                      disabled={!chapterForm.comicId || !chapterForm.number || chapterPages.length === 0}
                      className="flex-1 sakura-button text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      Create Chapter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
