"use client";

import React, { useState, useEffect } from 'react';
import { supabase, dbQueries } from './supabase';

interface LocalStorageData {
  users: any[];
  accounts: any[];
  currentUser: any;
}

export function DataMigrationHelper() {
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'migrating' | 'complete' | 'error'>('pending');
  const [localData, setLocalData] = useState<LocalStorageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for existing localStorage data
  useEffect(() => {
    const checkLocalData = () => {
      try {
        const users = JSON.parse(localStorage.getItem('sakura-users') || '[]');
        const accounts = JSON.parse(localStorage.getItem('sakura-accounts') || '[]');
        const currentUser = JSON.parse(localStorage.getItem('sakura-user') || 'null');

        if (users.length > 0 || accounts.length > 0 || currentUser) {
          setLocalData({ users, accounts, currentUser });
        }
      } catch (err) {
        console.error('Error checking local data:', err);
      }
    };

    checkLocalData();
  }, []);

  const migrateData = async () => {
    if (!localData) return;

    setMigrationStatus('migrating');
    setError(null);

    try {
      // Check if user is already signed up in Supabase
      const { data: { user: currentSupabaseUser } } = await supabase.auth.getUser();

      if (localData.currentUser && !currentSupabaseUser) {
        // Sign up the current user to Supabase
        const { user } = await dbQueries.signUp(
          localData.currentUser.email,
          'temporary-password-123', // User will need to reset
          localData.currentUser.username
        );

        if (user) {
          // Create user profile with localStorage data
          await dbQueries.createUser({
            email: localData.currentUser.email as string,
            username: localData.currentUser.username as string,
            role: (localData.currentUser.role as 'user' | 'admin' | 'moderator') || 'user',
            avatar: localData.currentUser.avatar as string,
            bookmarks: (localData.currentUser.bookmarks as string[]) || [],
            reading_history: (localData.currentUser.readingHistory as any[]) || [],
            joined_at: (localData.currentUser.joinedAt as string) || new Date().toISOString()
          });

          // Migrate bookmarks
          if (localData.currentUser.bookmarks) {
            for (const comicId of localData.currentUser.bookmarks) {
              try {
                await dbQueries.addBookmark(user.id, comicId);
              } catch (err) {
                console.warn('Failed to migrate bookmark:', comicId, err);
              }
            }
          }
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('sakura-users');
      localStorage.removeItem('sakura-accounts');
      localStorage.removeItem('sakura-user');

      setMigrationStatus('complete');
    } catch (err) {
      console.error('Migration error:', err);
      setError(err instanceof Error ? err.message : 'Migration failed');
      setMigrationStatus('error');
    }
  };

  const skipMigration = () => {
    // Clear localStorage and mark as complete
    localStorage.removeItem('sakura-users');
    localStorage.removeItem('sakura-accounts');
    localStorage.removeItem('sakura-user');
    setMigrationStatus('complete');
  };

  if (!localData || migrationStatus === 'complete') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999999] p-4">
      <div className="bg-card border border-sakura-border rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Data Migration</h2>

        {migrationStatus === 'pending' && (
          <>
            <p className="text-muted-foreground mb-4">
              We found existing user data in your browser. Would you like to migrate it to the new persistent storage system?
            </p>
            <div className="bg-sakura-primary/10 border border-sakura-primary/20 rounded-lg p-3 mb-4">
              <p className="text-sm">
                <strong>Benefits of migration:</strong>
                <br />• Your data will persist across deployments
                <br />• Access your account from any device
                <br />• Real-time data synchronization
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={migrateData}
                className="flex-1 bg-sakura-primary text-white px-4 py-2 rounded-lg hover:bg-sakura-primary/90 transition-colors"
              >
                Migrate Data
              </button>
              <button
                onClick={skipMigration}
                className="flex-1 bg-secondary text-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Start Fresh
              </button>
            </div>
          </>
        )}

        {migrationStatus === 'migrating' && (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-sakura-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Migrating your data...</p>
          </div>
        )}

        {migrationStatus === 'error' && (
          <>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={migrateData}
                className="flex-1 bg-sakura-primary text-white px-4 py-2 rounded-lg hover:bg-sakura-primary/90 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={skipMigration}
                className="flex-1 bg-secondary text-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
