import { useLazyVideo } from '@/hooks/use-lazy-video';
import { useState } from 'react';

interface LazyBackgroundImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  enabled?: boolean;
  children?: React.ReactNode;
}

export const LazyBackgroundImage: React.FC<LazyBackgroundImageProps> = ({
  src,
  alt = '',
  className = '',
  style = {},
  placeholder,
  enabled = true,
  children
}) => {
  const { elementRef, shouldLoad } = useLazyVideo({ 
    rootMargin: '100px',
    enabled 
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    setHasError(true);
  };

  return (
    <div ref={elementRef} className="relative">
      {shouldLoad && !hasError ? (
        <div
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}
          style={{
            ...style,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <div
          className={`${className} bg-gray-900`}
          style={{
            ...style,
            backgroundImage: placeholder ? `url(${placeholder})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      {children}
    </div>
  );
};