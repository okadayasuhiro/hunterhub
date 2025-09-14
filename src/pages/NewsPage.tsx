import React, { useEffect, useState } from 'react';

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
    fetch('/news/all.json', { cache: 'no-cache' })
      .then(r => r.json())
      .then((json: NewsResponse) => {
        if (canceled) return;
        const items = (json.items || []).filter(it => !it.excluded);
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
      <h1 className="text-2xl font-bold mb-4">狩猟ニュース</h1>
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
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default NewsPage;


