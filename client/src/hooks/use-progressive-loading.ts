import { useState, useEffect } from 'react';

interface UseProgressiveLoadingOptions {
  enabled?: boolean;
  batchSize?: number;
  delay?: number;
}

export const useProgressiveLoading = <T>(
  items: T[],
  options: UseProgressiveLoadingOptions = {}
) => {
  const { enabled = true, batchSize = 3, delay = 100 } = options;
  const [visibleCount, setVisibleCount] = useState(enabled ? batchSize : items.length);

  useEffect(() => {
    if (!enabled || visibleCount >= items.length) return;

    const timer = setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + batchSize, items.length));
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleCount, items.length, enabled, batchSize, delay]);

  return {
    visibleItems: items.slice(0, visibleCount),
    isComplete: visibleCount >= items.length,
    loadMore: () => setVisibleCount(prev => Math.min(prev + batchSize, items.length))
  };
};