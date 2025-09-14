import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';

type NewsItem = {
  id: string;
  source?: string;
  title: string;
  link: string;
  publishedAt?: string;
  excluded?: boolean;
};

type NewsResponse = {
  source: string;
  generatedAt?: string;
  items: NewsItem[];
};

const NewsPage: React.FC = () => {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const url = `/news/all.json?v=${Date.now()}`;
    fetch(url, { cache: 'no-cache' })
      .then(r => r.json())
      .then((json: NewsResponse) => {
        if (canceled) return;
        const nowMs = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const items = (json.items || [])
          .filter(it => !it.excluded)
          .filter(it => {
            if (!it.publishedAt) return false;
            const t = Date.parse(it.publishedAt);
            if (isNaN(t)) return false;
            const age = nowMs - t;
            return age >= 0 && age <= sevenDaysMs;
          });
        setData({ ...json, items });
      })
      .catch(e => {
        if (canceled) return;
        setError(e?.message || '読み込みに失敗しました');
      });
    return () => { canceled = true; };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEO
        title="狩猟ニュース（直近7日・1日2回更新）｜ハントレ"
        description="ハンター向けの狩猟ニュースを1日2回自動収集。北海道新聞・NHK・産経・朝日・秋田テレビ・岩手日報などから直近7日分を厳選してお届けします。"
        keywords="狩猟ニュース,ハンター,ヒグマ,エゾシカ,有害鳥獣,駆除,捕獲,ハントレ"
        ogType="website"
        structuredData={data ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "狩猟ニュース 最新一覧",
          url: typeof window !== 'undefined' ? window.location.origin + '/news' : 'https://hantore.net/news',
          numberOfItems: (data.items || []).length,
          itemListElement: (data.items || []).slice(0, 20).map((it, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            item: {
              "@type": "NewsArticle",
              headline: it.title,
              url: it.link,
              datePublished: it.publishedAt || undefined
            }
          }))
        } : {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "狩猟ニュース（直近7日・1日2回更新）｜ハントレ",
          url: typeof window !== 'undefined' ? window.location.origin + '/news' : 'https://hantore.net/news'
        }}
      />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">狩猟ニュース</h1>
        <a href="/" className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">トップへ戻る</a>
      </div>
      {error && (
        <div className="text-sm text-red-600 mb-4">{error}</div>
      )}
      {!data && !error && (
        <div className="text-gray-500">読み込み中...</div>
      )}
      {data && (
        <>
          <div className="text-xs text-gray-500 mb-3">最終更新: {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : '—'}</div>
          <ul className="space-y-2">
            {data.items.slice(0, 50).map(item => (
              <li key={item.id} className="border-b border-gray-200 pb-2">
                <a
                  href={item.link}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {item.title}
                </a>
                <div className="text-xs text-gray-500">
                  {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : ''}
                  {item.source === 'hokkaido-np' && <span> ・ 出典: 北海道新聞</span>}
                  {item.source === 'sankei' && <span> ・ 出典: 産経新聞</span>}
                  {item.source === 'nhk' && <span> ・ 出典: NHKニュース</span>}
                  {item.source === 'asahi' && <span> ・ 出典: 朝日新聞</span>}
                  {item.source === 'akt-yahoo' && <span> ・ 出典: 秋田テレビ（Yahoo!）</span>}
                  {item.source === 'iwatenpv-yahoo' && <span> ・ 出典: 岩手日報（Yahoo!）</span>}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 text-center">
            <a href="/" className="inline-block w-full max-w-40 px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300">ホームに戻る</a>
          </div>
        </>
      )}
    </div>
  );
};

export default NewsPage;


