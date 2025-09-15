import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GameHistoryService } from '../services/gameHistoryService';
import type { ReflexGameHistory, TargetTrackingHistory, SequenceGameHistory, TriggerTimingHistory } from '../types/game';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

type GameTab = 'reflex' | 'target' | 'sequence' | 'trigger-timing';

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

const MyHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<GameTab>('reflex');
  const todayJP = useMemo(() => new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' }), []);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayJP);

  const handleBackToHome = () => {
    navigate('/');
  };

  const gameHistoryService = useMemo(() => GameHistoryService.getInstance(), []);

  const { data: reflexData, isLoading: loadingReflex } = useQuery({
    queryKey: ['myHistory', 'reflex'],
    queryFn: async () => {
      const items = await gameHistoryService.getGameHistory<ReflexGameHistory>('reflex', 200);
      return items;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: targetData, isLoading: loadingTarget } = useQuery({
    queryKey: ['myHistory', 'target'],
    queryFn: async () => {
      const items = await gameHistoryService.getGameHistory<TargetTrackingHistory>('target', 200);
      return items;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: sequenceData, isLoading: loadingSequence } = useQuery({
    queryKey: ['myHistory', 'sequence'],
    queryFn: async () => {
      const items = await gameHistoryService.getGameHistory<SequenceGameHistory>('sequence', 200);
      return items;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: triggerData, isLoading: loadingTrigger } = useQuery({
    queryKey: ['myHistory', 'trigger-timing'],
    queryFn: async () => {
      const items = await gameHistoryService.getGameHistory<TriggerTimingHistory>('trigger-timing', 200);
      return items;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const cutoff = useMemo(() => Date.now() - DAYS_30_MS, []);

  // 共通フォーマッタと日付整形
  const getDecimals = (tab: GameTab) => (tab === 'reflex' ? 5 : 3);
  const toJPDate = (isoOrDateStr: string) => new Date(isoOrDateStr).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const metricOf = (tab: GameTab, item: any): number => {
    if (tab === 'reflex') return (item.averageTime ?? 0) / 1000; // 秒
    if (tab === 'target') return item.totalTime ?? 0;            // 秒
    if (tab === 'sequence') return item.completionTime ?? 0;     // 秒
    return item.totalScore ?? 0;                                 // pt
  };

  // 集計: 日毎に average/min/max/allRecords[] を計算
  const { chartData, scatterData, detailedByDate } = useMemo(() => {
    const src = activeTab === 'reflex' ? (reflexData || [])
      : activeTab === 'target' ? (targetData || [])
      : activeTab === 'sequence' ? (sequenceData || [])
      : (triggerData || []);

    const filtered = src.filter((h: any) => new Date(h.date).getTime() >= cutoff);

    const byDate: Record<string, number[]> = {};
    const detailed: Record<string, { value: number; time: string }[]> = {};

    const decimals = getDecimals(activeTab);

    for (const item of filtered) {
      const d = toJPDate(item.date);
      const v = Number(metricOf(activeTab, item).toFixed(decimals));
      (byDate[d] ||= []).push(v);
      const baseTs = (item as any).__timestamp || item.date;
      (detailed[d] ||= []).push({ value: v, time: new Date(baseTs).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Tokyo' }) });
    }

    const aggregated = Object.entries(byDate).map(([date, values]) => {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = values.length > 0 ? Number((sum / values.length).toFixed(decimals)) : 0;
      const min = values.length > 0 ? Math.min(...values) : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;
      return {
        date,
        average: avg,
        min: Number(min.toFixed(decimals)),
        range: Number((max - min).toFixed(decimals)),
        allRecords: values.map(v => Number(v.toFixed(decimals)))
      };
    });

    aggregated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const scatter = aggregated.flatMap(d => d.allRecords.map(v => ({ date: d.date, value: v })));

    return { chartData: aggregated, scatterData: scatter, detailedByDate: detailed };
  }, [activeTab, reflexData, targetData, sequenceData, triggerData, cutoff]);

  const isLoading = (activeTab === 'reflex' && loadingReflex)
    || (activeTab === 'target' && loadingTarget)
    || (activeTab === 'sequence' && loadingSequence)
    || (activeTab === 'trigger-timing' && loadingTrigger);

  const yAxisLabel = activeTab === 'reflex'
    ? '平均反応時間(秒)'
    : activeTab === 'target'
      ? '合計時間(秒)'
      : activeTab === 'sequence'
        ? '完了時間(秒)'
        : '合計得点(pt)';

  // 詳細エリア用の選択日データ（デフォルトは今日、クリックで更新）
  const selectedDetails = useMemo(() => {
    const d = selectedDate;
    const list = d ? (detailedByDate[d] || []) : [];
    // 成績良い順: reflex/target/sequence は小さいほど良い、trigger-timing は大きいほど良い
    const sorted = [...list].sort((a, b) => {
      if (activeTab === 'trigger-timing') {
        return a.value !== b.value ? b.value - a.value : a.time.localeCompare(b.time);
      }
      return a.value !== b.value ? a.value - b.value : a.time.localeCompare(b.time);
    });
    return sorted.map((r, idx) => ({ ...r, rank: idx + 1 }));
  }, [detailedByDate, selectedDate, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800">わたしのトレーニング履歴</h1>
        </div>

        {/* タブ */}
        <div className="inline-flex rounded-lg overflow-hidden border bg-white">
          {([
            { key: 'reflex', label: '反射神経' },
            { key: 'target', label: '追跡' },
            { key: 'sequence', label: 'カウント' },
            { key: 'trigger-timing', label: 'トリガー' }
          ] as { key: GameTab; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 説明ブロック */}
        <div className="mt-6 bg-white rounded-xl shadow p-4 md:p-5 text-sm text-gray-700 leading-relaxed">
          <p className="mb-1">このグラフは直近5日の推移を表します。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-medium text-blue-700">青い線</span>: その日の平均値</li>
            <li><span className="font-medium text-sky-600">水色の帯</span>: 最小値〜最大値（ブレの幅）</li>
          </ul>
        </div>

        {/* グラフ */}
        <div className="mt-4 bg-white rounded-xl shadow p-4 md:p-6">
          {isLoading ? (
            <div className="py-16 text-center text-gray-500">読み込み中...</div>
          ) : chartData.length === 0 ? (
            <div className="py-16 text-center text-gray-500">表示できるデータがありません</div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                  onClick={(state: any) => {
                    const label = state && state.activeLabel;
                    if (label) setSelectedDate(label);
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} allowDuplicatedCategory={false} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => v} />
                  <Legend />
                  {/* 水色の帯: min〜max（minとrangeの積み上げで表現） */}
                  <Area type="monotone" dataKey="min" stackId="range" stroke="none" fill="transparent" />
                  <Area type="monotone" dataKey="range" stackId="range" name="範囲(min-max)" stroke="#93c5fd" fill="#93c5fd" fillOpacity={0.3} />
                  {/* 青い線: 平均 */}
                  <Line type="monotone" dataKey="average" name={yAxisLabel} stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
                  {/* グレーの点: 個別記録 */}
                  <Scatter data={scatterData} legendType="none" fill="#9ca3af" line={false} shape="circle" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 戻るボタン */}
        <div className="text-center mt-6">
          <button
            onClick={handleBackToHome}
            className="w-full max-w-40 px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300"
          >
            戻る
          </button>
        </div>

        {/* 詳細表示エリア */}
        <div className="mt-4 bg-white rounded-xl shadow p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">詳細表示日</div>
            <div className="text-base font-semibold text-gray-800">{selectedDate || todayJP}</div>
          </div>
          {selectedDetails.length === 0 ? (
            <div className="py-4 text-center text-gray-500">この日はプレイ記録がありません</div>
          ) : (
            <ul className="space-y-2">
              {selectedDetails.map((r) => (
                <li key={`${r.time}-${r.value}`} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 w-24">{r.time}</span>
                  <span className="text-gray-900 flex-1 text-right mr-4">{r.value.toFixed(getDecimals(activeTab))}</span>
                  <span className="text-gray-500 w-16 text-right">#{r.rank}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyHistoryPage;


