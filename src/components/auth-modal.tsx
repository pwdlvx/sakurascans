"use client";

import React, { useState } from 'react';
import { X, Eye, EyeOff, User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { login, register, isLoading } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Email and password are required' });
      return;
    }

    if (!isLogin) {
      if (!formData.username) {
        setMessage({ type: 'error', text: 'Username is required' });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' });
        return;
      }

      if (formData.password.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
        return;
      }

      if (formData.username.length < 3) {
        setMessage({ type: 'error', text: 'Username must be at least 3 characters' });
        return;
      }
    }

    try {
      let result;

      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.username, formData.email, formData.password);
      }

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          onClose();
          setFormData({ username: '', email: '', password: '', confirmPassword: '' });
          setMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear message when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setMessage({ type: '', text: '' });
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="fixed inset-0 z-50" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
      <div className="sakura-card rounded-lg p-6 w-full max-w-md sakura-glow" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', margin: '16px' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold sakura-text-primary">
            {isLogin ? 'Welcome Back' : 'Join SakuraScans'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-sakura-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                name="username"
                placeholder="Username (3+ characters)"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary text-foreground"
                required={!isLogin}
                minLength={3}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary text-foreground"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder={isLogin ? "Password" : "Password (6+ characters)"}
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-10 pr-12 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary text-foreground"
              required
              minLength={isLogin ? 1 : 6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-sakura-primary transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {!isLogin && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary text-foreground"
                required={!isLogin}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-sakura-primary transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}

          {message.text && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sakura-button text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            {' '}
            <button
              onClick={switchMode}
              className="sakura-text-primary hover:text-sakura-accent transition-colors font-semibold"
              disabled={isLoading}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {isLogin && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              You must register an account before logging in. Only pwdlvx@gmail.com has admin access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
