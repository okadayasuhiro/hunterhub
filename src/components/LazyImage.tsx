import React, { useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
}

/**
 * Phase 3最適化: 遅延読み込み対応画像コンポーネント
 * 既存のデザインを完全保持しながら、パフォーマンスを向上
 */
const LazyImage: React.FC<LazyImageProps> = ({ src, alt, placeholder, className, ...props }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true); // エラー時もローディング状態を終了
  };

  return (
    <div className="relative w-full h-full">
      {!imageLoaded && placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
          {placeholder}
        </div>
      )}
      {!imageError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy" // ネイティブ遅延読み込み
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full transition-opacity duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${className || ''}`}
          {...props}
        />
      ) : (
        <div className={`w-full h-full bg-gray-200 flex items-center justify-center ${className || ''}`}>
          <span className="text-gray-500 text-sm">画像を読み込めませんでした</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;