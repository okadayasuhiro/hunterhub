import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GameHistoryService } from '../services/gameHistoryService';
import type { ReflexGameHistory, TargetTrackingHistory, SequenceGameHistory } from '../types/game';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

type GameTab = 'reflex' | 'target' | 'sequence';

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

const MyHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameTab>('reflex');

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

  const cutoff = useMemo(() => Date.now() - DAYS_30_MS, []);

  const chartData = useMemo(() => {
    if (activeTab === 'reflex') {
      const src = (reflexData || []).filter(h => new Date(h.date).getTime() >= cutoff);
      // 昇順
      src.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      // 平均反応時間(ms) → 秒
      return src.map(h => ({
        date: new Date(h.date).toLocaleDateString('ja-JP'),
        value: Number((h.averageTime / 1000).toFixed(5))
      }));
    }
    if (activeTab === 'target') {
      const src = (targetData || []).filter(h => new Date(h.date).getTime() >= cutoff);
      src.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      // 合計時間(秒)
      return src.map(h => ({
        date: new Date(h.date).toLocaleDateString('ja-JP'),
        value: Number(h.totalTime.toFixed(3))
      }));
    }
    const src = (sequenceData || []).filter(h => new Date(h.date).getTime() >= cutoff);
    src.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // 完了時間(秒)
    return src.map(h => ({
      date: new Date(h.date).toLocaleDateString('ja-JP'),
      value: Number(h.completionTime.toFixed(3))
    }));
  }, [activeTab, reflexData, targetData, sequenceData, cutoff]);

  const isLoading = (activeTab === 'reflex' && loadingReflex)
    || (activeTab === 'target' && loadingTarget)
    || (activeTab === 'sequence' && loadingSequence);

  const yAxisLabel = activeTab === 'reflex'
    ? '平均反応時間(秒)'
    : activeTab === 'target'
      ? '合計時間(秒)'
      : '完了時間(秒)';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">マイ履歴</h1>
          <p className="text-gray-600 text-sm mt-1">直近30日間のプレイ推移を表示</p>
        </div>

        {/* タブ */}
        <div className="inline-flex rounded-lg overflow-hidden border bg-white">
          {([
            { key: 'reflex', label: '反射神経' },
            { key: 'target', label: 'ターゲット追跡' },
            { key: 'sequence', label: 'カウントアップ' }
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

        {/* グラフ */}
        <div className="mt-6 bg-white rounded-xl shadow p-4 md:p-6">
          {isLoading ? (
            <div className="py-16 text-center text-gray-500">読み込み中...</div>
          ) : chartData.length === 0 ? (
            <div className="py-16 text-center text-gray-500">表示できるデータがありません</div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
                  <Tooltip formatter={(v: any) => v} />
                  <Legend />
                  <Line type="monotone" dataKey="value" name={yAxisLabel} stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyHistoryPage;


