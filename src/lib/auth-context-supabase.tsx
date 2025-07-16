"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, dbQueries, type DatabaseUser } from './supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// User interface
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'moderator';
  avatar?: string;
  bookmarks: string[];
  readingHistory: Array<{
    comicId: string;
    chapterId: string;
    pageNumber: number;
    timestamp: Date;
  }>;
  joinedAt: Date;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  users: User[];
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  addBookmark: (comicId: string) => Promise<void>;
  removeBookmark: (comicId: string) => Promise<void>;
  isBookmarked: (comicId: string) => boolean;
  updateReadingHistory: (comicId: string, chapterId: string, pageNumber: number) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert database user to app user
  const convertDatabaseUser = (dbUser: DatabaseUser, bookmarks: string[] = []): User => ({
    id: dbUser.id,
    email: dbUser.email,
    username: dbUser.username,
    role: dbUser.role,
    avatar: dbUser.avatar,
    bookmarks,
    readingHistory: dbUser.reading_history?.map(item => ({
      comicId: item.comicId,
      chapterId: item.chapterId,
      pageNumber: item.pageNumber,
      timestamp: new Date(item.timestamp)
    })) || [],
    joinedAt: new Date(dbUser.joined_at || dbUser.created_at)
  });

  // Load user profile and bookmarks
  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      setLoading(true);

      // Get user profile
      const dbUser = await dbQueries.getUser(supabaseUser.id);

      // Get user bookmarks
      const bookmarks = await dbQueries.getUserBookmarks(supabaseUser.id);

      // Convert and set user
      const appUser = convertDatabaseUser(dbUser, bookmarks);
      setUser(appUser);

      setError(null);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load user profile');

      // If user doesn't exist in database, create profile
      if (err instanceof Error && err.message.includes('No rows returned')) {
        try {
          const newUser = await dbQueries.createUser({
            email: supabaseUser.email!,
            username: supabaseUser.user_metadata?.username || supabaseUser.email!.split('@')[0],
            role: 'user',
            bookmarks: [],
            reading_history: [],
            joined_at: new Date().toISOString()
          });

          const appUser = convertDatabaseUser(newUser, []);
          setUser(appUser);
          setError(null);
        } catch (createError) {
          console.error('Error creating user profile:', createError);
          setError('Failed to create user profile');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          await loadUserProfile(session.user);
        } else if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { user: supabaseUser } = await dbQueries.signIn(email, password);

      if (supabaseUser) {
        // User profile will be loaded by auth state change listener
        return true;
      }

      return false;
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (email: string, password: string, username: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { user: supabaseUser } = await dbQueries.signUp(email, password, username);

      if (supabaseUser) {
        // User profile will be created by database trigger
        return true;
      }

      return false;
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Signup failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await dbQueries.signOut();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;

    try {
      setError(null);

      const dbUpdates: Partial<DatabaseUser> = {
        username: updates.username,
        avatar: updates.avatar,
        role: updates.role
      };

      const updatedDbUser = await dbQueries.updateUser(user.id, dbUpdates);
      const updatedUser = convertDatabaseUser(updatedDbUser, user.bookmarks);

      setUser(updatedUser);
    } catch (err) {
      console.error('Update profile error:', err);
      setError('Failed to update profile');
      throw err;
    }
  };

  // Add bookmark
  const addBookmark = async (comicId: string): Promise<void> => {
    if (!user) return;

    try {
      setError(null);

      await dbQueries.addBookmark(user.id, comicId);

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        bookmarks: [...prev.bookmarks, comicId]
      } : null);
    } catch (err) {
      console.error('Add bookmark error:', err);
      setError('Failed to add bookmark');
      throw err;
    }
  };

  // Remove bookmark
  const removeBookmark = async (comicId: string): Promise<void> => {
    if (!user) return;

    try {
      setError(null);

      await dbQueries.removeBookmark(user.id, comicId);

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        bookmarks: prev.bookmarks.filter(id => id !== comicId)
      } : null);
    } catch (err) {
      console.error('Remove bookmark error:', err);
      setError('Failed to remove bookmark');
      throw err;
    }
  };

  // Check if bookmarked
  const isBookmarked = (comicId: string): boolean => {
    return user?.bookmarks.includes(comicId) ?? false;
  };

  // Update reading history
  const updateReadingHistory = async (comicId: string, chapterId: string, pageNumber: number): Promise<void> => {
    if (!user) return;

    try {
      setError(null);

      // This would require additional database function - simplified for now
      const historyItem = {
        comicId,
        chapterId,
        pageNumber,
        timestamp: new Date()
      };

      // Update local state
      setUser(prev => {
        if (!prev) return null;

        const updatedHistory = prev.readingHistory.filter(
          item => !(item.comicId === comicId && item.chapterId === chapterId)
        );
        updatedHistory.unshift(historyItem);

        return {
          ...prev,
          readingHistory: updatedHistory.slice(0, 100) // Keep last 100 items
        };
      });
    } catch (err) {
      console.error('Update reading history error:', err);
      setError('Failed to update reading history');
    }
  };

  // Clear error
  const clearError = () => setError(null);

  const contextValue: AuthContextType = {
    user,
    users,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    addBookmark,
    removeBookmark,
    isBookmarked,
    updateReadingHistory,
    error,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
