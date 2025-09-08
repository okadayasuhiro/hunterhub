import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  CENTER_RINGS: { RADII: [6,12,18], STROKE: 2, COLORS: ['rgba(239,68,68,0.85)','rgba(239,68,68,0.6)','rgba(239,68,68,0.35)'], PULSE: true },
  BETWEEN_MS: 600,
};

type Mode = 'instructions' | 'game' | 'result';
type GameState = 'idle' | 'spawning' | 'moving' | 'between' | 'finished';
interface Pos { x: number; y: number; }
interface Target { position: Pos; velocity: Pos; size: number; isMoving: boolean; }
interface RoundResult { round: number; hit: boolean; points: number; distancePx: number; reactionTimeMs: number; }

interface Props { mode: Mode; }

const TriggerTimingPage: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const [state, setState] = useState<GameState>('idle');
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);
  const stateRef = useRef<GameState>('idle');
  const scheduledRef = useRef<boolean>(false); // このラウンドで次遷移を一度だけ保証
  useEffect(() => { stateRef.current = state; }, [state]);

  const center = useMemo<Pos>(() => ({ x: CONFIG.AREA_SIZE / 2, y: CONFIG.AREA_SIZE / 2 }), []);
  const latest = results.length ? results[results.length - 1] : null;
  const total = useMemo(() => results.reduce((s, r) => s + r.points, 0), [results]);

  const spawnTarget = useCallback((r: number): Target => {
    const size = CONFIG.TARGET_SIZES[r];
    const side = Math.floor(Math.random() * 4);
    let pos: Pos;
    if (side === 0) pos = { x: Math.random() * CONFIG.AREA_SIZE, y: -size };
    else if (side === 1) pos = { x: CONFIG.AREA_SIZE + size, y: Math.random() * CONFIG.AREA_SIZE };
    else if (side === 2) pos = { x: Math.random() * CONFIG.AREA_SIZE, y: CONFIG.AREA_SIZE + size };
    else pos = { x: -size, y: Math.random() * CONFIG.AREA_SIZE };
    const dx = center.x - pos.x, dy = center.y - pos.y; const L = Math.max(1, Math.hypot(dx, dy));
    const dir = { x: dx / L, y: dy / L };
    const sp = CONFIG.SPEED_RANGES[r]; const speed = sp.min + Math.random() * (sp.max - sp.min);
    return { position: pos, velocity: { x: dir.x * speed, y: dir.y * speed }, size, isMoving: true };
  }, [center]);

  // forward declarations with refs to avoid circular dependencies in callbacks
  const startRoundRef = useRef<(r: number) => void>(() => {});
  const scheduleNext = useCallback((next: number): void => {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    setState('between');
    console.log(`⏭️ scheduleNext -> round ${next} (current results len=${results.length})`);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (next >= CONFIG.TOTAL_ROUNDS) { setState('finished'); navigate('/trigger-timing/result'); }
      else startRoundRef.current(next);
    }, CONFIG.BETWEEN_MS) as unknown as number;
  }, [navigate, results.length]);

  const tick = useCallback((): void => {
    setTarget(prev => {
      if (!prev || !prev.isMoving) return prev;
      if (stateRef.current !== 'moving') return prev;
      const np = { x: prev.position.x + prev.velocity.x * 0.016, y: prev.position.y + prev.velocity.y * 0.016 };
      const margin = 50;
      if (np.x < -margin || np.x > CONFIG.AREA_SIZE + margin || np.y < -margin || np.y > CONFIG.AREA_SIZE + margin) {
        if (!scheduledRef.current) {
          scheduledRef.current = true;
          const rr: RoundResult = { round, hit: false, points: 0, distancePx: Math.hypot(center.x - np.x, center.y - np.y), reactionTimeMs: 0 };
          setResults(v => { const nv = [...v, rr]; console.log(`🟥 out-of-bounds: round=${round+1}, points=0.0, resultsLen(after)=${nv.length}`); return nv; });
          setState('between');
          if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
          scheduleNext(round + 1);
        }
        return { ...prev, isMoving: false };
      }
      return { ...prev, position: np };
    });
    if (stateRef.current !== 'finished') {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [round, center, scheduleNext]);

  const startRound = useCallback((r: number): void => {
    setRound(r);
    setState('spawning');
    const t = spawnTarget(r);
    setTarget(t);
    startTsRef.current = performance.now();
    scheduledRef.current = false;
    setState('moving');
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [spawnTarget, tick]);
  startRoundRef.current = startRound;

  const startGame = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    setResults([]); setTarget(null); setRound(0); setState('spawning');
    setTimeout(() => startRound(0), 400);
  }, [startRound]);

  // auto-start when arriving at /trigger-timing/game
  useEffect(() => {
    if (mode === 'game' && stateRef.current === 'idle') {
      startGame();
    }
  }, [mode, startGame]);

  const onAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (stateRef.current !== 'moving' || !areaRef.current || !target) return;
    const rect = areaRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left; const cy = e.clientY - rect.top;
    const distToTarget = Math.hypot(cx - target.position.x, cy - target.position.y);
    const hitMargin = 6; // 許容誤差(px)
    const onTarget = distToTarget <= (target.size / 2 + hitMargin);
    const distance = Math.hypot(target.position.x - center.x, target.position.y - center.y);
    // 正規化二乗スコア: Max=100, R=エリア半径
    const MAX_SCORE = 100;
    const R = CONFIG.AREA_SIZE / 2;
    const norm = Math.min(1, distance / R);
    let points = MAX_SCORE * Math.pow(1 - norm, 2);
    points = Math.max(0, Math.min(MAX_SCORE, Math.round(points * 1000) / 1000));
    console.log(`🎯 clickPos=(${cx.toFixed(1)},${cy.toFixed(1)}) target=(${target.position.x.toFixed(1)},${target.position.y.toFixed(1)}) size=${target.size} distToTarget=${distToTarget.toFixed(1)} onTarget=${onTarget} centerDist=${distance.toFixed(1)} points=${points.toFixed(3)}`);
    const rr: RoundResult = { round, hit: onTarget, points, distancePx: distance, reactionTimeMs: performance.now() - startTsRef.current };
    if (!scheduledRef.current) {
      scheduledRef.current = true;
      setResults(v => { const nv = [...v, rr]; console.log(`✅ click: round=${round+1}, hit=${onTarget}, points=${points.toFixed(1)}, resultsLen(after)=${nv.length}`); return nv; });
      setTarget(p => p ? { ...p, isMoving: false } : p);
      setState('between');
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      scheduleNext(round + 1);
    }
  }, [target, round, center]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); if (timerRef.current) window.clearTimeout(timerRef.current!); }, []);

  if (mode === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-indigo-50 p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">射撃タイミング・トレーニング</h1>
          <p className="text-gray-600 mb-6">中央の目印に向かってくる円を、最も良いタイミングで停止させよう。5ラウンドの合計点で勝負。</p>
          <button onClick={() => navigate('/trigger-timing/game')} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg">トレーニング開始</button>
          <button onClick={() => navigate('/')} className="w-1/2 mx-auto block mt-3 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 rounded-lg">戻る</button>
        </div>
      </div>
    );
  }

  if (mode === 'game') {
    const sizeIndex = Math.min(round, CONFIG.TARGET_SIZES.length - 1);
    const effectiveSize = (target ? target.size : CONFIG.TARGET_SIZES[sizeIndex]);
    const dynamicRadii = [1, 2, 3].map(mult => (effectiveSize * mult) / 2);
    return (
      <div className="min-h-screen">
        <div className="py-4 px-4">
          <div className="max-w-4xl mx-auto">
            {/* ヘッダー（反射神経と同レイアウト） */}
            <div className="text-right mb-2">
              <h1 className="text-sm font-medium text-gray-500 font-bold">射撃タイミングトレーニング</h1>
            </div>

            {/* 進捗表示（カード） */}
            <div className="bg-white rounded-lg p-4 mb-8 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">トレーニング進行状況</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-blue-600">{Math.min(results.length, CONFIG.TOTAL_ROUNDS)}</span>
                  <span className="text-sm text-gray-400">/</span>
                  <span className="text-sm text-gray-600">{CONFIG.TOTAL_ROUNDS}</span>
                  <span className="text-xs text-gray-500 ml-1">回完了</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(results.length / CONFIG.TOTAL_ROUNDS) * 100}%` }}
                />
              </div>
            </div>

            {/* ゲームエリア（カード） */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div
                  ref={areaRef}
                  className="relative bg-gray-100 rounded-lg mx-auto select-none"
                  style={{ width: CONFIG.AREA_SIZE, height: CONFIG.AREA_SIZE }}
                  onClick={onAreaClick}
                >
                  {/* 中央の同心円 */}
                  <div
                    className={(CONFIG.CENTER_RINGS.PULSE ? 'animate-pulse ' : '') + 'absolute'}
                    style={{ left: center.x, top: center.y, transform: 'translate(-50%, -50%)' }}
                  >
                    {[0, 1, 2].map((i) => {
                      const r = dynamicRadii[i];
                      return (
                        <div
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            width: r * 2,
                            height: r * 2,
                            left: -r,
                            top: -r,
                            border: `${CONFIG.CENTER_RINGS.STROKE}px solid ${CONFIG.CENTER_RINGS.COLORS[i]}`,
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* ターゲット */}
                  {target && target.isMoving && (
                    <div
                      className="absolute rounded-full bg-black"
                      style={{
                        left: target.position.x - target.size / 2,
                        top: target.position.y - target.size / 2,
                        width: target.size,
                        height: target.size,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 下部統計（反射神経のカードと同じ見た目） */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">このラウンドの得点</div>
                <div className="text-xl font-bold text-green-600">{(latest ? latest.points : 0).toFixed(3)}点</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">合計得点</div>
                <div className="text-xl font-bold text-purple-600">{total.toFixed(3)}点</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // result (simple)
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-indigo-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">トレーニング完了</h1>
        <div className="text-3xl font-bold text-red-600 mb-1">{total.toFixed(1)}</div>
        <div className="text-sm text-gray-600 mb-6">合計得点</div>
        <button onClick={() => navigate('/trigger-timing/game')} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg">もう一度</button>
        <button onClick={() => navigate('/')} className="w-1/2 mx-auto block mt-3 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 rounded-lg">メニューに戻る</button>
      </div>
    </div>
  );
};

export default TriggerTimingPage;
