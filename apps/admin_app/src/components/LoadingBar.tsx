'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Progress } from 'antd';
import { useCallback } from 'react';

export default function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Start loading animation immediately on click, before route change begins
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setLoading(true);
      setProgress(20);

      // Fast progress simulation
      const timer1 = setTimeout(() => setProgress(40), 100);
      const timer2 = setTimeout(() => setProgress(60), 200);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    };

    // Intercept clicks on navigation links
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        handleRouteChangeStart();
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Complete the progress when route change finishes
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <Progress
      percent={progress}
      showInfo={false}
      strokeColor={{
        '0%': '#108ee9',
        '100%': '#87d068',
      }}
      style={{
        position: 'fixed',
        top: -12,
        left: 0,
        right: 0,
        padding: 0,
        margin: 0,
        zIndex: 1000,
      }}
      size={['100%', 4]}
    />
  );
}

// Add this style to globals.css
