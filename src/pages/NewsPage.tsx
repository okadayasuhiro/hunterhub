import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';

type NewsItem = {
  id: string;
  source?: string;
  title: string;
  link: string;
  publishedAt?: string;
  excluded?: boolean;
  description?: string;
  imageUrl?: string;
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
              datePublished: it.publishedAt || undefined,
              sourceOrganization: { "@type": "Organization", name: (() => {
                switch (it.source) {
                  case 'hokkaido-np': return '北海道新聞';
                  case 'sankei': return '産経新聞';
                  case 'nhk': return 'NHKニュース';
                  case 'asahi': return '朝日新聞';
                  case 'akt-yahoo': return '秋田テレビ（Yahoo!）';
                  case 'iwatenpv-yahoo': return '岩手日報（Yahoo!）';
                  case 'wordleaf-yahoo': return 'THE PAGE（Yahoo!）';
                  case 'stv-yahoo': return 'STVニュース北海道（Yahoo!）';
                  default: return 'ニュース';
                }
              })() },
              articleBody: it.description ? String(it.description).slice(0, 200) : undefined,
              image: it.imageUrl ? [{ "@type": "ImageObject", url: it.imageUrl }] : undefined
            }
          }))
        } : {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "狩猟ニュース（直近7日・1日2回更新）｜ハントレ",
          url: typeof window !== 'undefined' ? window.location.origin + '/news' : 'https://hantore.net/news'
        }}
      />
      <div className="bg-white rounded-xl shadow-sm border mb-4">
        <div className="flex items-center justify-between p-4 md:p-5">
          <h1 className="text-2xl font-bold">狩猟関連ニュース</h1>
          <a href="/" className="inline-block w-full max-w-40 px-8 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300">ホームに戻る</a>
        </div>
        <div className="px-4 pb-4 md:px-5 md:pb-5">
          <p className="text-sm text-gray-600">
            直近7日間の「狩猟・ジビエ・有害鳥獣対策」などに関するニュースを、1日2回自動収集して掲載しています。
            見出しをクリックすると各媒体の記事に移動します。
          </p>
        </div>
      </div>
      {error && (
        <div className="text-sm text-red-600 mb-4">{error}</div>
      )}
      {!data && !error && (
        <div className="text-gray-500">読み込み中...</div>
      )}
      {data && (
        <>
          <div className="bg-white rounded-xl shadow-sm border mb-4">
            <div className="text-xs text-gray-500 px-4 pt-4 md:px-5">最終更新: {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : '—'}</div>
            <ul className="divide-y">
              {data.items.slice(0, 50).map(item => (
              <li key={item.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="text-blue-600 hover:underline flex-1"
                  >
                    {item.title}
                  </a>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-10 h-6 object-cover rounded" loading="lazy" />
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : ''}
                  {(() => {
                    const id = (item.source || '').trim();
                    const link = item.link || '';
                    const title = item.title || '';
                    const map: Record<string, string> = {
                      'hokkaido-np': '北海道新聞',
                      'sankei': '産経新聞',
                      'nhk': 'NHKニュース',
                      'asahi': '朝日新聞',
                      'akt-yahoo': '秋田テレビ（Yahoo!）',
                      'iwatenpv-yahoo': '岩手日報（Yahoo!）',
                      'wordleaf-yahoo': 'THE PAGE（Yahoo!）',
                      'stv-yahoo': 'STVニュース北海道（Yahoo!）'
                    };
                    let display = map[id];
                    // フォールバック: 予期せぬIDでもYahoo!のSTV記事はタイトル・リンクで判定
                    if (!display && /news\.yahoo\.co\.jp/.test(link) && /STVニュース北海道/.test(title)) {
                      display = 'STVニュース北海道（Yahoo!）';
                    }
                    return display ? <span> ・ 出典: {display}</span> : null;
                  })()}
                </div>
              </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 text-center">
            <a href="/" className="inline-block w-full max-w-40 px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300">ホームに戻る</a>
          </div>
        </>
      )}
    </div>
  );
};

export default NewsPage;


