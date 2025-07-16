import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useState, useEffect } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Hydration-safe time formatter hook
export function useTimeAgo(date: Date | string) {
  const [timeString, setTimeString] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const timeDiff = Date.now() - targetDate.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor(timeDiff / (1000 * 60));

    let formatted;
    if (days > 0) {
      formatted = days === 1 ? '1 day ago' : `${days} days ago`;
    } else if (hours > 0) {
      formatted = hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (minutes > 0) {
      formatted = minutes === 1 ? '1 min ago' : `${minutes} mins ago`;
    } else {
      formatted = 'Just now';
    }

    setTimeString(formatted);
  }, [date]);

  // Return loading state during SSR and initial hydration to prevent mismatch
  return isHydrated ? timeString : '';
}

// Server-safe time formatter for static dates
export function formatTimeAgo(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const timeDiff = now.getTime() - targetDate.getTime();
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor(timeDiff / (1000 * 60));

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? '1 min ago' : `${minutes} mins ago`;
  } else {
    return 'Just now';
  }
}
