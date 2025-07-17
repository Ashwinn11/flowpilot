"use client";

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV === 'development') {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });

      // Measure time to interactive
      const checkInteractive = () => {
        if (document.readyState === 'complete') {
          performance.mark('dashboard-interactive');
          performance.measure('dashboard-load-time', 'navigationStart', 'dashboard-interactive');
        } else {
          setTimeout(checkInteractive, 100);
        }
      };

      checkInteractive();

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  return null;
}
