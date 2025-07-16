"use client";

import { useEffect } from 'react';

export function AutoHideScrollbar() {
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const showScrollbar = () => {
      document.body.classList.remove('scrollbar-hidden');
      document.documentElement.classList.remove('scrollbar-hidden');

      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Set new timeout to hide scrollbar after 3 seconds
      scrollTimeout = setTimeout(() => {
        document.body.classList.add('scrollbar-hidden');
        document.documentElement.classList.add('scrollbar-hidden');
      }, 3000);
    };

    const hideScrollbar = () => {
      document.body.classList.add('scrollbar-hidden');
      document.documentElement.classList.add('scrollbar-hidden');
    };

    // Add auto-hide classes
    document.body.classList.add('scrollbar-auto-hide');
    document.documentElement.classList.add('scrollbar-auto-hide');

    // Show scrollbar on scroll
    const handleScroll = () => {
      showScrollbar();
    };

    // Show scrollbar on mouse move near edge
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX } = e;
      const { innerWidth } = window;

      // Show scrollbar when mouse is near right edge (within 50px)
      if (clientX > innerWidth - 50) {
        showScrollbar();
      }
    };

    // Initial hide after 3 seconds
    scrollTimeout = setTimeout(hideScrollbar, 3000);

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Cleanup
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.classList.remove('scrollbar-auto-hide', 'scrollbar-hidden');
      document.documentElement.classList.remove('scrollbar-auto-hide', 'scrollbar-hidden');
    };
  }, []);

  return null;
}
