import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'game';
  canonicalUrl?: string;
  noIndex?: boolean;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = 'ハントレ - ハンタートレーニング・診断プラットフォーム',
  description = 'ハンタートレーニング専用サイト「ハントレ」。反射神経テスト、ターゲット追跡、狩猟動物診断でハンターのスキル向上をサポート',
  keywords = 'ハントレ,ハンタートレーニング,狩猟,射撃,ハンター,トレーニング,反射神経,診断,鳥獣',
  ogImage = 'https://hantore.net/images/hantore.gif',
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
  structuredData
}) => {
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : 'https://hantore.net');
  
  return (
    <Helmet>
      {/* 基本メタタグ */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* noindex設定 */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* OGP (Open Graph Protocol) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="ハントレ" />
      <meta property="og:locale" content="ja_JP" />
      
      {/* X (Twitter) Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@hunter_JL1EHL" />
      <meta name="twitter:creator" content="@hunter_JL1EHL" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* 構造化データ */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

