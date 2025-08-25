import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Clock, Target, Hash, User, Crown, Star } from 'lucide-react';
import { HybridRankingService } from '../services/hybridRankingService';
import type { RankingData, RankingEntry } from '../services/hybridRankingService';
import { UserIdentificationService } from '../services/userIdentificationService';

type GameType = 'reflex' | 'target' | 'sequence';

interface GameInfo {
  id: GameType;
  name: string;
  icon: React.ReactNode;
  color: string;
  unit: string;
  description: string;
}

const GAMES: GameInfo[] = [
  {
    id: 'reflex',
    name: '反射神経テスト',
    icon: <Clock className="w-5 h-5" />,
    color: 'bg-red-500',
    unit: 's',
    description: '反応速度が速いほど上位'
  },
  {
    id: 'target',
    name: 'ターゲット追跡',
    icon: <Target className="w-5 h-5" />,
    color: 'bg-blue-500',
    unit: 's',
    description: '合計時間が短いほど上位'
  },
  {
    id: 'sequence',
    name: '数字順序ゲーム',
    icon: <Hash className="w-5 h-5" />,
    color: 'bg-green-500',
    unit: 's',
    description: '完了時間が短いほど上位'
  }
];

const RankingPage: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>('reflex');
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const rankingService = HybridRankingService.getInstance();
  const userService = UserIdentificationService.getInstance();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadRankingData();
    }
  }, [selectedGame, currentUserId]);

  const loadCurrentUser = async () => {
    try {
      const userId = await userService.getCurrentUserId();
      setCurrentUserId(userId);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadRankingData = async () => {
    setLoading(true);
    try {
      const data = await rankingService.getRankings(selectedGame);
      setRankingData(data);
    } catch (error) {
      console.error('Failed to load ranking data:', error);
      setRankingData(null);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Star className="w-6 h-6 text-blue-400" />;
    }
  };

  const formatScore = (score: number, gameType: GameType): string => {
    const gameInfo = GAMES.find(g => g.id === gameType);
    if (!gameInfo) return score.toString();
    
    if (gameInfo.unit === 's') {
      // 全ゲームでミリ秒保存→秒表示（0.000s形式）
      return `${(score / 1000).toFixed(3)}s`;
    }
    return `${score}${gameInfo.unit}`;
  };

  const selectedGameInfo = GAMES.find(g => g.id === selectedGame);

  return (
    <div className="min-h-screen glass-light">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-500" />
            ランキング
          </h1>
          <p className="text-blue-100 text-lg">
            あなたの実力を他のプレイヤーと比較してみよう！
          </p>
        </div>

        {/* ゲーム選択タブ */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all duration-200 ${
                selectedGame === game.id
                  ? `${game.color} text-white shadow-lg transform scale-105`
                  : 'glass-card text-blue-100 hover:text-white hover:scale-105'
              }`}
            >
              {game.icon}
              <span className="font-medium">{game.name}</span>
            </button>
          ))}
        </div>

        {/* 選択されたゲームの説明 */}
        {selectedGameInfo && (
          <div className="glass-card p-4 mb-6 text-center">
            <p className="text-blue-100">
              <span className="font-medium text-white">{selectedGameInfo.name}</span>
              {' - '}
              {selectedGameInfo.description}
            </p>
          </div>
        )}

        {/* ランキング表示 */}
        <div className="glass-card p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-blue-100">ランキングデータを読み込み中...</p>
            </div>
          ) : rankingData && rankingData.rankings.length > 0 ? (
            <>
              {/* 統計情報 */}
              <div className="flex justify-between items-center mb-6 text-sm text-blue-200">
                <span>総プレイヤー数: {rankingData.totalPlayers}人</span>
                <span>最終更新: {new Date(rankingData.lastUpdated).toLocaleString('ja-JP')}</span>
              </div>

              {/* ランキングリスト */}
              <div className="space-y-3">
                {rankingData.rankings.map((entry) => (
                  <div
                    key={`${entry.userId}-${entry.timestamp}`}
                    className={`p-4 rounded-lg transition-all duration-200 ${
                      entry.isCurrentUser
                        ? 'bg-blue-500/30 border-2 border-blue-400 transform scale-105'
                        : 'glass-light hover:bg-white/10'
                    }`}
                  >
                    {/* デスクトップレイアウト（md以上） */}
                    <div className="hidden md:flex items-center justify-between">
                      {/* 左側: 順位とアイコン */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                          <span className={`text-2xl font-bold ${
                            entry.rank <= 3 ? 'text-yellow-300' : 'text-blue-200'
                          }`}>
                            #{entry.rank}
                          </span>
                        </div>

                        {/* ユーザー名 */}
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-300" />
                          <span className={`font-medium ${
                            entry.isCurrentUser ? 'text-white' : 'text-blue-100'
                          }`}>
                            {entry.displayName}
                            {entry.isCurrentUser && (
                              <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                あなた
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 右側: スコアと日時 */}
                      <div className="text-right">
                        <div className={`text-xl font-bold ${
                          entry.isCurrentUser ? 'text-white' : 'text-blue-100'
                        }`}>
                          {formatScore(entry.score, selectedGame)}
                        </div>
                        <div className="text-xs text-blue-300">
                          {new Date(entry.timestamp).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </div>

                    {/* モバイルレイアウト（md未満） */}
                    <div className="md:hidden">
                      {/* 上段：順位 + ユーザー名 + スコア */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* 順位アイコン */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {getRankIcon(entry.rank)}
                            <span className={`text-lg font-bold ${
                              entry.rank <= 3 ? 'text-yellow-300' : 'text-blue-200'
                            }`}>
                              #{entry.rank}
                            </span>
                          </div>
                          
                          {/* ユーザー名 */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <User className="w-4 h-4 text-blue-300 flex-shrink-0" />
                            <span className={`font-medium text-sm truncate ${
                              entry.isCurrentUser ? 'text-white' : 'text-blue-100'
                            }`}>
                              {entry.displayName}
                              {entry.isCurrentUser && (
                                <span className="ml-1 text-xs bg-blue-500 text-white px-1 py-0.5 rounded">
                                  あなた
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        
                        {/* スコア */}
                        <div className="flex-shrink-0 ml-2">
                          <div className={`text-lg font-bold ${
                            entry.isCurrentUser ? 'text-white' : 'text-blue-100'
                          }`}>
                            {formatScore(entry.score, selectedGame)}
                          </div>
                        </div>
                      </div>
                      
                      {/* 下段：日付 */}
                      <div className="ml-8 pl-2">
                        <div className="text-xs text-blue-300">
                          {new Date(entry.timestamp).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* あなたの順位（ランキング外の場合） */}
              {rankingData.userRank && !rankingData.rankings.some(r => r.isCurrentUser) && (
                <div className="mt-6 pt-4 border-t border-white/20">
                  <p className="text-center text-blue-200 mb-3">あなたの順位</p>
                  <div className="p-4 rounded-lg bg-blue-500/20 border border-blue-400">
                    {/* デスクトップレイアウト（md以上） */}
                    <div className="hidden md:flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Star className="w-6 h-6 text-blue-400" />
                          <span className="text-2xl font-bold text-blue-200">
                            #{rankingData.userRank.rank}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-300" />
                          <span className="font-medium text-white">
                            {rankingData.userRank.displayName}
                            <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                              あなた
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          {formatScore(rankingData.userRank.score, selectedGame)}
                        </div>
                        <div className="text-xs text-blue-300">
                          {new Date(rankingData.userRank.timestamp).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </div>

                    {/* モバイルレイアウト（md未満） */}
                    <div className="md:hidden">
                      {/* 上段：順位 + ユーザー名 + スコア */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="w-5 h-5 text-blue-400" />
                            <span className="text-lg font-bold text-blue-200">
                              #{rankingData.userRank.rank}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <User className="w-4 h-4 text-blue-300 flex-shrink-0" />
                            <span className="font-medium text-sm text-white truncate">
                              {rankingData.userRank.displayName}
                              <span className="ml-1 text-xs bg-blue-500 text-white px-1 py-0.5 rounded">
                                あなた
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          <div className="text-lg font-bold text-white">
                            {formatScore(rankingData.userRank.score, selectedGame)}
                          </div>
                        </div>
                      </div>
                      {/* 下段：日付 */}
                      <div className="ml-7 pl-2">
                        <div className="text-xs text-blue-300">
                          {new Date(rankingData.userRank.timestamp).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-blue-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                まだランキングデータがありません
              </h3>
              <p className="text-blue-200 mb-4">
                {selectedGameInfo?.name}をプレイして、ランキングに参加しよう！
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                ゲームに戻る
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingPage;