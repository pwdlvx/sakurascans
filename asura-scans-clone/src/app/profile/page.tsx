"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Camera, Eye, EyeOff, User, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
  const { user, updateProfile, changePassword, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    description: user?.description || '',
    avatar: user?.avatar || ''
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username,
        email: user.email,
        description: user.description || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sakura-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Please login to access your profile settings.</p>
          <Link href="/" className="sakura-button text-white px-6 py-2 rounded">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // Validation
    if (!profileForm.username.trim()) {
      setMessage({ type: 'error', text: 'Username is required' });
      setIsLoading(false);
      return;
    }

    if (!profileForm.email.trim()) {
      setMessage({ type: 'error', text: 'Email is required' });
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateProfile(profileForm);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'All password fields are required' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      return;
    }

    // Check password requirements
    const hasLowercase = /[a-z]/.test(passwordForm.newPassword);
    const hasNumberOrSymbol = /[0-9\W]/.test(passwordForm.newPassword);

    if (!hasLowercase) {
      setMessage({ type: 'error', text: 'Password must contain at least one lowercase character' });
      return;
    }

    if (!hasNumberOrSymbol) {
      setMessage({ type: 'error', text: 'Password must contain at least one number, symbol, or whitespace character' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setMessage({ type: 'error', text: 'File size must be under 2MB' });
        return;
      }

      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        setMessage({ type: 'error', text: 'Only JPG or PNG files are allowed' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileForm(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    setProfileForm(prev => ({
      ...prev,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
    }));
  };

  const getPasswordStrength = (password: string) => {
    const hasLength = password.length >= 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasNumberOrSymbol = /[0-9\W]/.test(password);

    return { hasLength, hasLowercase, hasNumberOrSymbol };
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="header-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 sakura-button rounded-lg flex items-center justify-center sakura-glow-subtle">
                <svg width={28} height={28} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g transform="translate(50,50)">
                    <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(0)" />
                    <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(72)" />
                    <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(144)" />
                    <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(216)" />
                    <path d="M0,-30 Q-10,-40 -15,-35 Q-20,-25 -12,-18 Q-8,-12 -4,-15 Q0,-20 4,-15 Q8,-12 12,-18 Q20,-25 15,-35 Q10,-40 0,-30 Z" fill="#ffffff" transform="rotate(288)" />
                    <circle cx="0" cy="0" r="6" fill="#fce7f3" />
                    <circle cx="0" cy="-3" r="1" fill="#f472b6" />
                    <circle cx="2.8" cy="-0.9" r="1" fill="#f472b6" />
                    <circle cx="1.7" cy="2.4" r="1" fill="#f472b6" />
                    <circle cx="-1.7" cy="2.4" r="1" fill="#f472b6" />
                    <circle cx="-2.8" cy="-0.9" r="1" fill="#f472b6" />
                  </g>
                </svg>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="nav-link text-muted-foreground hover:text-sakura-primary">Home</Link>
              <Link href="/bookmarks" className="nav-link text-muted-foreground hover:text-sakura-primary">Bookmarks</Link>
              <Link href="/comics" className="nav-link text-muted-foreground hover:text-sakura-primary">Comics</Link>
              <Link href="/recruitment" className="nav-link text-muted-foreground hover:text-sakura-primary">Recruitment</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="title-font text-3xl mb-8">Profile Settings</h1>

        {message.text && (
          <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
            message.type === 'error'
              ? 'text-red-400 bg-red-500/10 border border-red-500/20'
              : 'text-green-400 bg-green-500/10 border border-green-500/20'
          }`}>
            {message.type === 'error' ? (
              <AlertCircle size={16} />
            ) : (
              <CheckCircle size={16} />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <div className="asura-card p-6 rounded-lg">
            <h2 className="title-font text-xl mb-6">Profile Information</h2>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div className="text-center">
                <div className="relative inline-block">
                  <Image
                    src={profileForm.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt="Profile"
                    width={120}
                    height={120}
                    className="rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera className="text-white" size={24} />
                  </button>
                </div>

                <div className="flex gap-3 mt-4 justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="sakura-button text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    CHANGE PHOTO
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    DELETE PHOTO
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Allowed JPG or PNG. Max size of 2MB
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              {/* Username */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary text-foreground"
                  placeholder="Username"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary text-foreground"
                  placeholder="Email"
                />
              </div>

              {/* Description */}
              <div>
                <textarea
                  value={profileForm.description}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter Description"
                  rows={4}
                  className="w-full px-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary text-foreground resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="sakura-button text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </form>
          </div>

          {/* Password Settings */}
          <div className="asura-card p-6 rounded-lg">
            <h2 className="title-font text-xl mb-6">Change Password</h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Current Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Current Password"
                  className="w-full pl-10 pr-12 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-sakura-primary transition-colors"
                >
                  {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* New Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="New Password"
                  className="w-full pl-10 pr-12 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-sakura-primary transition-colors"
                >
                  {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm Password"
                  className="w-full pl-10 pr-12 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-sakura-primary transition-colors"
                >
                  {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Requirements */}
              <div>
                <h4 className="font-semibold mb-3">Password Requirements</h4>
                <ul className="space-y-2 text-sm">
                  <li className={`flex items-center gap-2 ${passwordStrength.hasLength ? 'text-green-400' : 'text-muted-foreground'}`}>
                    <span className={`w-1 h-1 rounded-full ${passwordStrength.hasLength ? 'bg-green-400' : 'bg-muted-foreground'}`}></span>
                    Minimum 8 characters long - the more, the better
                  </li>
                  <li className={`flex items-center gap-2 ${passwordStrength.hasLowercase ? 'text-green-400' : 'text-muted-foreground'}`}>
                    <span className={`w-1 h-1 rounded-full ${passwordStrength.hasLowercase ? 'bg-green-400' : 'bg-muted-foreground'}`}></span>
                    At least one lowercase character
                  </li>
                  <li className={`flex items-center gap-2 ${passwordStrength.hasNumberOrSymbol ? 'text-green-400' : 'text-muted-foreground'}`}>
                    <span className={`w-1 h-1 rounded-full ${passwordStrength.hasNumberOrSymbol ? 'bg-green-400' : 'bg-muted-foreground'}`}></span>
                    At least one number, symbol, or whitespace character
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="sakura-button text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {isLoading ? 'CHANGING...' : 'CHANGE PASSWORD'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
