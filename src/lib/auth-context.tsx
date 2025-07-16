"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  description?: string;
  joinedAt: Date;
  bookmarks: string[];
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
  addBookmark: (comicId: string) => void;
  removeBookmark: (comicId: string) => void;
  isBookmarked: (comicId: string) => boolean;
  updateProfile: (profileData: { username: string; email: string; description?: string; avatar?: string }) => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  deleteUser: (userId: string) => void;
  getTotalUsers: () => number;
  getNewUsersCount: (days: number) => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface StoredAccount {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load current user session
    const storedUser = localStorage.getItem('sakura-user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({
          ...userData,
          joinedAt: new Date(userData.joinedAt)
        });
      } catch (error) {
        localStorage.removeItem('sakura-user');
      }
    }

    // Load all users
    const storedUsers = localStorage.getItem('sakura-users');
    if (storedUsers) {
      try {
        const usersData = JSON.parse(storedUsers);
        setUsers(usersData.map((user: any) => ({
          ...user,
          joinedAt: new Date(user.joinedAt)
        })));
      } catch (error) {
        setUsers([]);
      }
    }

    // Load accounts (for authentication)
    const storedAccounts = localStorage.getItem('sakura-accounts');
    if (storedAccounts) {
      try {
        const accountsData = JSON.parse(storedAccounts);
        setAccounts(accountsData.map((account: any) => ({
          ...account,
          createdAt: new Date(account.createdAt)
        })));
      } catch (error) {
        setAccounts([]);
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('sakura-users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('sakura-accounts', JSON.stringify(accounts));
  }, [accounts]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const account = accounts.find(acc => acc.email === email && acc.password === password);

    if (!account) {
      setIsLoading(false);
      return {
        success: false,
        message: 'Invalid email or password. Please sign up if you don\'t have an account.'
      };
    }

    const userData = users.find(u => u.email === email);
    if (!userData) {
      setIsLoading(false);
      return {
        success: false,
        message: 'User data not found. Please contact support.'
      };
    }

    setUser(userData);
    localStorage.setItem('sakura-user', JSON.stringify(userData));
    setIsLoading(false);
    return { success: true, message: 'Login successful!' };
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (accounts.find(acc => acc.email === email)) {
      setIsLoading(false);
      return {
        success: false,
        message: 'An account with this email already exists. Please login instead.'
      };
    }

    if (users.find(u => u.username === username)) {
      setIsLoading(false);
      return {
        success: false,
        message: 'Username already taken. Please choose a different username.'
      };
    }

    const userId = Date.now().toString();
    const now = new Date();

    const newAccount: StoredAccount = {
      id: userId,
      email,
      password,
      createdAt: now
    };

    const newUser: User = {
      id: userId,
      username,
      email,
      role: email === 'pwdlvx@gmail.com' ? 'admin' : 'user',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      joinedAt: now,
      bookmarks: []
    };

    setAccounts(prev => [...prev, newAccount]);
    setUsers(prev => [...prev, newUser]);

    setUser(newUser);
    localStorage.setItem('sakura-user', JSON.stringify(newUser));

    setIsLoading(false);
    return { success: true, message: 'Account created successfully!' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sakura-user');
  };

  const addBookmark = (comicId: string) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      bookmarks: [...user.bookmarks, comicId]
    };

    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    localStorage.setItem('sakura-user', JSON.stringify(updatedUser));
  };

  const removeBookmark = (comicId: string) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      bookmarks: user.bookmarks.filter(id => id !== comicId)
    };

    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    localStorage.setItem('sakura-user', JSON.stringify(updatedUser));
  };

  const isBookmarked = (comicId: string): boolean => {
    return user?.bookmarks.includes(comicId) || false;
  };

  const deleteUser = (userId: string) => {
    if (userId === user?.id || users.find(u => u.id === userId)?.role === 'admin') {
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    setAccounts(prev => prev.filter(acc => acc.id !== userId));
  };

  const getTotalUsers = (): number => {
    return users.length;
  };

  const getNewUsersCount = (days: number): number => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return users.filter(user => user.joinedAt >= cutoffDate).length;
  };

  const updateProfile = async (profileData: { username: string; email: string; description?: string; avatar?: string }): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'User not authenticated' };

    try {
      if (profileData.email !== user.email) {
        const emailExists = accounts.find(acc => acc.email === profileData.email && acc.id !== user.id);
        if (emailExists) {
          return { success: false, message: 'Email already exists. Please choose a different email.' };
        }
      }

      if (profileData.username !== user.username) {
        const usernameExists = users.find(u => u.username === profileData.username && u.id !== user.id);
        if (usernameExists) {
          return { success: false, message: 'Username already taken. Please choose a different username.' };
        }
      }

      const updatedUser = {
        ...user,
        ...profileData
      };

      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

      if (profileData.email !== user.email) {
        setAccounts(prev => prev.map(acc => acc.id === user.id ? { ...acc, email: profileData.email } : acc));
      }

      setUser(updatedUser);
      localStorage.setItem('sakura-user', JSON.stringify(updatedUser));

      return { success: true, message: 'Profile updated successfully!' };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, message: 'An error occurred while updating profile' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'User not authenticated' };

    try {
      const account = accounts.find(acc => acc.id === user.id);
      if (!account) return { success: false, message: 'Account not found' };

      if (account.password !== currentPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      setAccounts(prev => prev.map(acc =>
        acc.id === user.id ? { ...acc, password: newPassword } : acc
      ));

      return { success: true, message: 'Password changed successfully!' };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: 'An error occurred while changing password' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      users,
      login,
      register,
      logout,
      isLoading,
      addBookmark,
      removeBookmark,
      isBookmarked,
      updateProfile,
      changePassword,
      deleteUser,
      getTotalUsers,
      getNewUsersCount
    }}>
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
