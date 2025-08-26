import { useEffect, useRef, useState } from 'react';

interface UseLazyVideoOptions {
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
}

export const useLazyVideo = (options: UseLazyVideoOptions = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    enabled = true
  } = options;
  
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !elementRef.current) {
      setShouldLoad(true); // If disabled, always load
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !shouldLoad) {
          setShouldLoad(true);
          setIsIntersecting(true);
        } else {
          setIsIntersecting(entry.isIntersecting);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [enabled, rootMargin, threshold, shouldLoad]);

  return {
    elementRef,
    shouldLoad,
    isIntersecting
  };
};