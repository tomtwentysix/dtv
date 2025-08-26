import { useLazyVideo } from '@/hooks/use-lazy-video';
import { useState } from 'react';

interface LazyBackgroundVideoProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  poster?: string;
  enabled?: boolean;
  children?: React.ReactNode;
}

export const LazyBackgroundVideo: React.FC<LazyBackgroundVideoProps> = ({
  src,
  className = '',
  style = {},
  poster,
  enabled = true,
  children
}) => {
  const { elementRef, shouldLoad } = useLazyVideo({ 
    rootMargin: '100px', // Start loading when 100px away from viewport
    enabled 
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleVideoLoad = () => {
    setIsLoaded(true);
  };

  const handleVideoError = () => {
    setHasError(true);
  };

  return (
    <div ref={elementRef} className="relative">
      {shouldLoad && !hasError ? (
        <video
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}
          style={style}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          controls={false}
          preload="metadata" // Changed from "none" to "metadata" for better UX
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        />
      ) : (
        // Fallback: show poster image or loading pattern while video hasn't loaded
        <div
          className={`${className} ${poster ? '' : 'lazy-video-loading'} bg-gray-900`}
          style={{
            ...style,
            backgroundImage: poster ? `url(${poster})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      {children}
    </div>
  );
};