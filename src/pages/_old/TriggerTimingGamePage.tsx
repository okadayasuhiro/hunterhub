import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Config matching reflex theme
const CONFIG = {
  TOTAL_ROUNDS: 5,
  AREA_SIZE: 340,
  TARGET_SIZES: [26, 28, 30, 30, 32],
  SPEED_RANGES: [
    { min: 30, max: 50 },
    { min: 40, max: 60 },
    { min: 50, max: 70 },
    { min: 60, max: 80 },
    { min: 70, max: 90 },
  ],
  COLORS: {
    primary: '#ef4444',
    bgA: '#ecfeff',
    bgB: '#e0e7ff',
    text: '#1f2937',
  },
  CENTER_RINGS: {
    RADII: [6, 12, 18],
    STROKE: 2,
    COLORS: ['rgba(239,68,68,0.85)', 'rgba(239,68,68,0.6)', 'rgba(239,68,68,0.35)'],
    PULSE: true,
  },
  BETWEEN_MS: 600,
};

// Types
type GameState = 'idle' | 'spawning' | 'moving' | 'between' | 'finished';

interface Position { x: number; y: number; }

interface Target {
  position: Position;
  velocity: Position;
  size: number;
  isMoving: boolean;
}

interface RoundResult {
  round: number;
  hit: boolean;
  points: number;         // 0.0 - 5.0
  distancePx: number;     // from center
  reactionTimeMs: number; // click to start delta
}

interface TriggerTimingGamePageProps {
  mode: 'instructions' | 'game' | 'result';
}

const TriggerTimingGamePage: React.FC<TriggerTimingGamePageProps> = ({ mode }) => {
  const navigate = useNavigate();

  // State
  const [gameState, setGameState] = useState<GameState>('idle');
  const [round, setRound] = useState<number>(0); // 0-based
  const [results, setResults] = useState<RoundResult[]>([]);
  const [target, setTarget] = useState<Target | null>(null);

  // Refs
  const rafRef = useRef<number | null>(null);
  const gameStateRef = useRef<GameState>('idle');
  const startTsRef = useRef<number>(0);
  const betweenTimerRef = useRef<number | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // Derived
  const totalPoints = useMemo(() => results.reduce((s, r) => s + r.points, 0), [results]);
  const latestPoints = useMemo(() => results.length ? results[results.length - 1].points : 0, [results]);

  // Helpers
  const center = useMemo<Position>(() => ({ x: CONFIG.AREA_SIZE / 2, y: CONFIG.AREA_SIZE / 2 }), []);

  const scheduleNext = useCallback((nextRound: number) => {
    if (betweenTimerRef.current) { window.clearTimeout(betweenTimerRef.current); betweenTimerRef.current = null; }
    setGameState('between');
    betweenTimerRef.current = window.setTimeout(() => {
      if (nextRound >= CONFIG.TOTAL_ROUNDS) {
        setGameState('finished');
      } else {
        startRound(nextRound);
      }
    }, CONFIG.BETWEEN_MS) as unknown as number;
  }, []);

  const spawnTarget = useCallback((forRound: number): Target => {
    const side = Math.floor(Math.random() * 4); // 0 top,1 right,2 bottom,3 left
    const size = CONFIG.TARGET_SIZES[forRound];
    let pos: Position;
    if (side === 0) pos = { x: Math.random() * CONFIG.AREA_SIZE, y: -size };
    else if (side === 1) pos = { x: CONFIG.AREA_SIZE + size, y: Math.random() * CONFIG.AREA_SIZE };
    else if (side === 2) pos = { x: Math.random() * CONFIG.AREA_SIZE, y: CONFIG.AREA_SIZE + size };
    else pos = { x: -size, y: Math.random() * CONFIG.AREA_SIZE };

    const dx = center.x - pos.x; const dy = center.y - pos.y; const len = Math.max(1, Math.hypot(dx, dy));
    const dir = { x: dx / len, y: dy / len };
    const sp = CONFIG.SPEED_RANGES[forRound];
    const speed = sp.min + Math.random() * (sp.max - sp.min);
    return { position: pos, velocity: { x: dir.x * speed, y: dir.y * speed }, size, isMoving: true };
  }, [center]);

  const tick = useCallback(() => {
    setTarget(prev => {
      if (!prev || !prev.isMoving) return prev;
      if (gameStateRef.current !== 'moving') return prev;

      const np = { x: prev.position.x + prev.velocity.x * 0.016, y: prev.position.y + prev.velocity.y * 0.016 };
      // out of bounds -> 0pt and next
      const margin = 50;
      if (np.x < -margin || np.x > CONFIG.AREA_SIZE + margin || np.y < -margin || np.y > CONFIG.AREA_SIZE + margin) {
        const result: RoundResult = {
          round,
          hit: false,
          points: 0,
          distancePx: Math.hypot(center.x - np.x, center.y - np.y),
          reactionTimeMs: 0,
        };
        setResults(r => [...r, result]);
        setGameState('between');
        return { ...prev, isMoving: false };
      }
      return { ...prev, position: np };
    });

    if (gameStateRef.current === 'moving') {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      scheduleNext(round + 1);
    }
  }, [round, center, scheduleNext]);

  const startRound = useCallback((r: number) => {
    setRound(r);
    setGameState('spawning');
    const t = spawnTarget(r);
    setTarget(t);
    startTsRef.current = performance.now();
    setGameState('moving');
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [spawnTarget, tick]);

  const startGame = useCallback(() => {
    // reset
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (betweenTimerRef.current) { window.clearTimeout(betweenTimerRef.current); betweenTimerRef.current = null; }
    setResults([]); setTarget(null); setRound(0);
    setGameState('spawning');
    setTimeout(() => startRound(0), 400);
  }, [startRound]);

  // Click handling (anywhere in area). Score only if on target; else 0pt.
  const onAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (gameStateRef.current !== 'moving' || !areaRef.current || !target) return;
    const rect = areaRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left; const cy = e.clientY - rect.top;

    const dxTarget = cx - target.position.x; const dyTarget = cy - target.position.y;
    const onTarget = Math.hypot(dxTarget, dyTarget) <= target.size / 2;

    let distance = Math.hypot(target.position.x - center.x, target.position.y - center.y);
    let points = onTarget ? Math.max(0, 5.0 - distance / 20) : 0;
    points = Math.round(points * 10) / 10; // 1 decimal

    const rr: RoundResult = {
      round,
      hit: onTarget,
      points,
      distancePx: distance,
      reactionTimeMs: performance.now() - startTsRef.current,
    };
    setResults(prev => [...prev, rr]);
    setTarget(prev => prev ? { ...prev, isMoving: false } : prev);
    setGameState('between');
  }, [target, round, center]);

  // Cleanup
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); if (betweenTimerRef.current) window.clearTimeout(betweenTimerRef.current!); }, []);

  // Render
  if (mode === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-indigo-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">トリガータイミング・トレーニング</h1>
            <p className="text-gray-600 mb-6">中央の目印に向かってくる円を、最も良いタイミングで停止させよう。5ラウンドの合計点で勝負。</p>
            <button onClick={() => navigate('/trigger-timing/game')} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg">トレーニング開始</button>
            <button onClick={() => navigate('/')} className="w-1/2 mx-auto block mt-3 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 rounded-lg">戻る</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'game') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-indigo-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>ラウンド {Math.min(round + 1, CONFIG.TOTAL_ROUNDS)} / {CONFIG.TOTAL_ROUNDS}</span>
              <span>合計: {totalPoints.toFixed(1)} 点</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(round / CONFIG.TOTAL_ROUNDS) * 100}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div
              ref={areaRef}
              className="relative bg-gray-100 rounded-lg mx-auto select-none"
              style={{ width: CONFIG.AREA_SIZE, height: CONFIG.AREA_SIZE }}
              onClick={onAreaClick}
            >
              {/* Center rings */}
              <div className={(CONFIG.CENTER_RINGS.PULSE ? 'animate-pulse ' : '') + 'absolute'} style={{ left: center.x, top: center.y, transform: 'translate(-50%, -50%)' }}>
                {[0,1,2].map(i => {
                  const r = CONFIG.CENTER_RINGS.RADII[i];
                  return (
                    <div key={i} className="absolute rounded-full" style={{ width: r*2, height: r*2, left: -r, top: -r, border: `${CONFIG.CENTER_RINGS.STROKE}px solid ${CONFIG.CENTER_RINGS.COLORS[i]}` }} />
                  );
                })}
              </div>

              {/* Target */}
              {target && target.isMoving && (
                <div
                  className="absolute rounded-full bg-black cursor-pointer"
                  style={{ left: target.position.x - target.size / 2, top: target.position.y - target.size / 2, width: target.size, height: target.size }}
                />
              )}

              {/* Start overlay */}
              {gameState === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={startGame} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg">開始</button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{latestPoints.toFixed(1)}</div>
                <div className="text-sm text-gray-600">このラウンドの得点</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalPoints.toFixed(1)}</div>
                <div className="text-sm text-gray-600">合計得点</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Simple result (placeholder)
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-indigo-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">トレーニング完了</h1>
        <div className="text-3xl font-bold text-red-600 mb-1">{totalPoints.toFixed(1)}</div>
        <div className="text-sm text-gray-600 mb-6">合計得点</div>
        <button onClick={() => navigate('/trigger-timing/game')} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg">もう一度</button>
        <button onClick={() => navigate('/')} className="w-1/2 mx-auto block mt-3 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 rounded-lg">メニューに戻る</button>
      </div>
    </div>
  );
};

export default TriggerTimingGamePage;