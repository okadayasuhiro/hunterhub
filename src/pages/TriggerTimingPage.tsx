import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { CloudRankingService } from '../services/cloudRankingService';
import { GameHistoryService } from '../services/gameHistoryService';
import { HybridRankingService } from '../services/hybridRankingService';
import type { TriggerTimingHistory } from '../types/game';
import { Share2, Trophy } from 'lucide-react';
import GameRankingTable from '../components/GameRankingTable';
import { useNavigate } from 'react-router-dom';

const CONFIG = {
  TOTAL_ROUNDS: 5,
  AREA_SIZE: 340,
  TARGET_SIZES: [26, 28, 30, 30, 32],
  ATTEMPT_BETWEEN_MS: 400,
  ROUND_TIMEOUT_MS: 6000,
  SPEED_RANGES: [
    { min: 200, max: 280 },
    { min: 650, max: 850 },
    { min: 360, max: 440 },
    { min: 400, max: 320 },
    { min: 460, max: 520 },
  ],
  CENTER_RINGS: { RADII: [6,12,18], STROKE: 2, COLORS: ['rgba(239,68,68,0.85)','rgba(239,68,68,0.6)','rgba(239,68,68,0.35)'], PULSE: true },
  BETWEEN_MS: 600,
};

type Mode = 'instructions' | 'game' | 'result';
type GameState = 'idle' | 'spawning' | 'moving' | 'between' | 'finished';
interface Pos { x: number; y: number; }
interface Target {
  position: Pos;
  base: Pos; // 発射基点（t=0 の位置）
  dir: Pos;  // 単位進行ベクトル（中心方向）
  perp: Pos; // dir に直交する単位ベクトル
  speed: number; // 直進速度(px/s)
  size: number;
  isMoving: boolean;
  wobbleEnabled: boolean;
  wobbleAmp: number;   // 振幅(px)
  wobbleOmega: number; // 角周波数(rad/s)
  wobblePhase: number; // 位相(rad)
}
interface RoundResult { round: number; hit: boolean; points: number; distancePx: number; reactionTimeMs: number; }

interface Props { mode: Mode; }

const TriggerTimingPage: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const [state, setState] = useState<GameState>('idle');
  const [round, setRound] = useState(0);
  const [shot, setShot] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const resultsRef = useRef<RoundResult[]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  // 中間サマリーは廃止
  const [countdown, setCountdown] = useState<number>(0);
  // 浮遊スコア表示
  type FloatingScore = { id: number; x: number; y: number; value: number; start: number };
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  // パーティクル
  type Particle = { id: number; x: number; y: number; vx: number; vy: number; start: number; life: number; size: number };
  const [particles, setParticles] = useState<Particle[]>([]);
  const areaRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const roundTimeoutRef = useRef<number | null>(null);
  const attemptTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const floatRafRef = useRef<number | null>(null);
  const particleRafRef = useRef<number | null>(null);
  const particleLastTsRef = useRef<number>(0);
  const startTsRef = useRef<number>(0);
  const stateRef = useRef<GameState>('idle');
  const scheduledRef = useRef<boolean>(false); // このラウンドで次遷移を一度だけ保証
  const shotRef = useRef<number>(0);
  const floatIdRef = useRef<number>(0);
  const particleIdRef = useRef<number>(0);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { shotRef.current = shot; }, [shot]);
  useEffect(() => { resultsRef.current = results; }, [results]);

  const center = useMemo<Pos>(() => ({ x: CONFIG.AREA_SIZE / 2, y: CONFIG.AREA_SIZE / 2 }), []);
  const latest = results.length ? results[results.length - 1] : null;
  const total = useMemo(() => results.reduce((s, r) => s + r.points, 0), [results]);
  const currentRoundShots = useMemo(() => results.filter(r => r.round === round), [results, round]);
  const currentRoundTotal = useMemo(() => currentRoundShots.reduce((s, r) => s + r.points, 0), [currentRoundShots]);
  const shotsCount = results.length;
  const averageScore = useMemo(() => (shotsCount > 0 ? total / shotsCount : 0), [total, shotsCount]);
  // ベストスコア表示は不要

  // 浮遊スコアのライフサイクル（自動フェードアウト/削除）
  useEffect(() => {
    const DURATION = 900; // ms
    if (floatingScores.length === 0) {
      if (floatRafRef.current) { cancelAnimationFrame(floatRafRef.current); floatRafRef.current = null; }
      return;
    }
    const step = () => {
      const now = performance.now();
      let changed = false;
      setFloatingScores(prev => {
        const filtered = prev.filter(fs => now - fs.start < DURATION);
        if (filtered.length !== prev.length) changed = true;
        return filtered;
      });
      floatRafRef.current = requestAnimationFrame(step);
    };
    if (!floatRafRef.current) floatRafRef.current = requestAnimationFrame(step);
    return () => { if (floatRafRef.current) { cancelAnimationFrame(floatRafRef.current); floatRafRef.current = null; } };
  }, [floatingScores.length]);

  // パーティクル更新
  useEffect(() => {
    if (particles.length === 0) {
      if (particleRafRef.current) { cancelAnimationFrame(particleRafRef.current); particleRafRef.current = null; }
      return;
    }
    const step = (now: number) => {
      const last = particleLastTsRef.current || now;
      const dt = Math.max(0.001, (now - last) / 1000);
      particleLastTsRef.current = now;
      setParticles(prev => {
        const updated: Particle[] = [];
        for (const p of prev) {
          const age = now - p.start;
          if (age >= p.life) continue;
          // 速度減衰と重力
          const vx = p.vx * 0.985;
          const vy = (p.vy + 220 * dt) * 0.985;
          const x = p.x + vx * dt;
          const y = p.y + vy * dt;
          updated.push({ ...p, x, y, vx, vy });
        }
        return updated;
      });
      particleRafRef.current = requestAnimationFrame(step);
    };
    if (!particleRafRef.current) {
      particleLastTsRef.current = performance.now();
      particleRafRef.current = requestAnimationFrame(step);
    }
    return () => { if (particleRafRef.current) { cancelAnimationFrame(particleRafRef.current); particleRafRef.current = null; } };
  }, [particles.length]);

  const spawnTarget = useCallback((r: number): Target => {
    const size = CONFIG.TARGET_SIZES[r];
    const half = size / 2;
    const side = Math.floor(Math.random() * 4);
    let pos: Pos;
    // 内側のグレー枠（ゲームエリア）を基準に、内側の縁から出現
    if (side === 0) pos = { x: half + Math.random() * (CONFIG.AREA_SIZE - size), y: half };
    else if (side === 1) pos = { x: CONFIG.AREA_SIZE - half, y: half + Math.random() * (CONFIG.AREA_SIZE - size) };
    else if (side === 2) pos = { x: half + Math.random() * (CONFIG.AREA_SIZE - size), y: CONFIG.AREA_SIZE - half };
    else pos = { x: half, y: half + Math.random() * (CONFIG.AREA_SIZE - size) };
    const dx = center.x - pos.x, dy = center.y - pos.y; const L = Math.max(1, Math.hypot(dx, dy));
    const dir = { x: dx / L, y: dy / L };
    const sp = CONFIG.SPEED_RANGES[r]; const speed = sp.min + Math.random() * (sp.max - sp.min);
    // 3ラウンド目以降で蛇行を有効化
    const wobbleEnabled = r >= 2;
    // ラウンドが進むほど強く速く（控えめに逓増）
    const ampBase = 16; // px
    const amp = ampBase + (r - 1) * 20 // r=2 -> 11, r=4 -> 17
    const hzBase = 0.8; // Hz
    const hz = hzBase + (r - 1) * 0.6; // r=2 -> 1.0Hz, r=4 -> 1.4Hz
    const omega = 2 * Math.PI * hz; // rad/s
    // 中心通過条件: t_center で sin(omega t + phase) = 0 となる位相を選ぶ
    // t_center ~ 直進で中心到達にかかる時間(L / speed)
    const tCenter = L / speed;
    // sin(omega tCenter + phase) = 0 -> phase = -omega tCenter (mod pi)
    const phase = -omega * tCenter;
    // 直交ベクトル
    const perp = { x: -dir.y, y: dir.x };
    return {
      position: pos,
      base: pos,
      dir,
      perp,
      speed,
      size,
      isMoving: true,
      wobbleEnabled,
      wobbleAmp: amp,
      wobbleOmega: omega,
      wobblePhase: phase,
    };
  }, [center]);

  // forward declarations with refs to avoid circular dependencies in callbacks
  const startRoundRef = useRef<(r: number) => void>(() => {});
  const startAttemptRef = useRef<(r: number, s: number) => void>(() => {});
  const shotsInRound = (r: number) => Math.min(r + 1, CONFIG.TOTAL_ROUNDS);
  const scheduleNext = useCallback((next: number): void => {
    if (roundTimeoutRef.current) { window.clearTimeout(roundTimeoutRef.current); roundTimeoutRef.current = null; }
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    setState('between');
    console.log(`⏭️ scheduleNext -> round ${next} (current results len=${resultsRef.current.length})`);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (next >= CONFIG.TOTAL_ROUNDS) {
        setState('finished');
        // 合計スコア送信 + 履歴保存（fire-and-forget）
        try {
          const finalTotal = Number(resultsRef.current.reduce((s, r) => s + r.points, 0).toFixed(3));
          CloudRankingService.getInstance().submitScore('trigger-timing', finalTotal);
          const history: TriggerTimingHistory = {
            date: new Date().toISOString(),
            totalScore: finalTotal,
            averageScore: resultsRef.current.length > 0 ? Number((finalTotal / resultsRef.current.length).toFixed(3)) : 0,
            bestRoundScore: resultsRef.current.length ? Number(Math.max(...resultsRef.current.map(r => r.points)).toFixed(3)) : 0,
            rounds: resultsRef.current.map((r, idx) => ({
              round: idx + 1,
              score: r.points,
              distance: r.distancePx,
              targetSpeed: 0,
              targetSize: 0,
              reactionTime: r.reactionTimeMs,
            })),
          };
          GameHistoryService.getInstance().saveGameHistory('trigger-timing', history);
        } catch {}
        navigate('/trigger-timing/result');
      }
      else startRoundRef.current(next);
    }, CONFIG.BETWEEN_MS) as unknown as number;
  }, [navigate, results]);

  const tick = useCallback((): void => {
    let didOutOfBounds = false;
    let outDistance = 0;
    setTarget(prev => {
      if (!prev || !prev.isMoving) return prev;
      if (stateRef.current !== 'moving') return prev;
      // 経過時間から直進成分を計算（蛇行の影響を排除）
      const t = (performance.now() - startTsRef.current) / 1000; // 秒
      const linear = { x: prev.base.x + prev.dir.x * prev.speed * t, y: prev.base.y + prev.dir.y * prev.speed * t };
      // 蛇行
      let wobbleOffset = { x: 0, y: 0 };
      if (prev.wobbleEnabled) {
        const s = prev.wobbleAmp * Math.sin(prev.wobbleOmega * t + prev.wobblePhase);
        wobbleOffset = { x: prev.perp.x * s, y: prev.perp.y * s };
      }
      const np = { x: linear.x + wobbleOffset.x, y: linear.y + wobbleOffset.y };
      const m = prev.size / 2; // 枠の内側基準で判定（直進成分で外へ出たら終了）
      if (linear.x < -m || linear.x > CONFIG.AREA_SIZE + m || linear.y < -m || linear.y > CONFIG.AREA_SIZE + m) {
        didOutOfBounds = true;
        outDistance = Math.hypot(center.x - np.x, center.y - np.y);
        return { ...prev, isMoving: false };
      }
      return { ...prev, position: np };
    });

    if (didOutOfBounds) {
      if (!scheduledRef.current) {
        scheduledRef.current = true;
        const rr: RoundResult = { round, hit: false, points: 0, distancePx: outDistance, reactionTimeMs: 0 };
        setResults(v => { const nv = [...v, rr]; console.log(`🟥 out-of-bounds: round=${round+1}, points=0.0, resultsLen(after)=${nv.length}`); return nv; });
        if (roundTimeoutRef.current) { window.clearTimeout(roundTimeoutRef.current); roundTimeoutRef.current = null; }
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        const currShot = shotRef.current;
        if (attemptTimerRef.current) { window.clearTimeout(attemptTimerRef.current); attemptTimerRef.current = null; }
        // 未タップで枠外に消えたら即次の球へ（待ち時間なし）
        if (currShot + 1 < shotsInRound(round)) {
          setShot(currShot + 1);
          startAttemptRef.current(round, currShot + 1);
        } else {
          scheduleNext(round + 1);
        }
        return;
      }
    }

    if (stateRef.current !== 'finished') {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [round, center, scheduleNext]);

  const startAttempt = useCallback((r: number, s: number): void => {
    setState('spawning');
    const t = spawnTarget(r);
    setTarget(t);
    startTsRef.current = performance.now();
    scheduledRef.current = false;
    setState('moving');
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    if (roundTimeoutRef.current) { window.clearTimeout(roundTimeoutRef.current); }
    roundTimeoutRef.current = window.setTimeout(() => {
      if (scheduledRef.current) return;
      scheduledRef.current = true;
      let dist = 0;
      setTarget(prev => {
        if (prev) {
          dist = Math.hypot(center.x - prev.position.x, center.y - prev.position.y);
        }
        return prev ? { ...prev, isMoving: false } : prev;
      });
      const rr: RoundResult = { round: r, hit: false, points: 0, distancePx: dist, reactionTimeMs: performance.now() - startTsRef.current };
      setResults(v => { const nv = [...v, rr]; console.log(`⏰ timeout: round=${r+1} shot=${s+1}, resultsLen(after)=${nv.length}`); return nv; });
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (attemptTimerRef.current) { window.clearTimeout(attemptTimerRef.current); attemptTimerRef.current = null; }
      // タイムアウト経由も即時で次へ進む
      if (s + 1 < shotsInRound(r)) {
        setShot(s + 1);
        startAttemptRef.current(r, s + 1);
      } else {
        scheduleNext(r + 1);
      }
    }, CONFIG.ROUND_TIMEOUT_MS) as unknown as number;
  }, [spawnTarget, tick, center, scheduleNext]);
  startAttemptRef.current = startAttempt;

  const startRound = useCallback((r: number): void => {
    setRound(r);
    setShot(0);
    startAttemptRef.current(r, 0);
  }, []);
  startRoundRef.current = startRound;

  // 中間サマリーは廃止

  const startGame = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    if (roundTimeoutRef.current) { window.clearTimeout(roundTimeoutRef.current); roundTimeoutRef.current = null; }
    if (attemptTimerRef.current) { window.clearTimeout(attemptTimerRef.current); attemptTimerRef.current = null; }
    if (countdownTimerRef.current) { window.clearInterval(countdownTimerRef.current); countdownTimerRef.current = null; }
    setResults([]); setTarget(null); setRound(0); setState('spawning');
    // 3→2→1 カウントダウン後に開始
    setCountdown(3);
    countdownTimerRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) { window.clearInterval(countdownTimerRef.current); countdownTimerRef.current = null; }
          // わずかな間を置かず即開始
          startRound(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  }, [startRound]);

  // auto-start when arriving at /trigger-timing/game (always start on route enter)
  useEffect(() => {
    if (mode === 'game') {
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
      // 先に視覚効果を同期描画してラグを無くす
      flushSync(() => {
        // スコアポップアップ（的の中心上）
        const fx = target.position.x;
        const fy = target.position.y - (target.size / 2) - 6;
        setFloatingScores(prev => [...prev, { id: ++floatIdRef.current, x: fx, y: fy, value: points, start: performance.now() }]);
        // パーティクル生成
        const now = performance.now();
        const NUM = 14;
        const created: Particle[] = [];
        for (let i = 0; i < NUM; i++) {
          const angle = (Math.PI * 2 * i) / NUM + Math.random() * 0.6 - 0.3;
          const speed = 120 + Math.random() * 160; // px/s
          const size = 3 + Math.random() * 3;
          created.push({
            id: ++particleIdRef.current,
            x: target.position.x,
            y: target.position.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            start: now,
            life: 700 + Math.random() * 300,
            size,
          });
        }
        setParticles(prev => [...prev, ...created]);
      });
      setResults(v => { const nv = [...v, rr]; console.log(`✅ click: round=${round+1}, hit=${onTarget}, points=${points.toFixed(1)}, resultsLen(after)=${nv.length}`); return nv; });
      setTarget(p => p ? { ...p, isMoving: false } : p);
      setState('between');
      if (roundTimeoutRef.current) { window.clearTimeout(roundTimeoutRef.current); roundTimeoutRef.current = null; }
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      const currShot = shotRef.current;
      if (attemptTimerRef.current) { window.clearTimeout(attemptTimerRef.current); attemptTimerRef.current = null; }
      attemptTimerRef.current = window.setTimeout(() => {
        if (currShot + 1 < shotsInRound(round)) {
          setShot(currShot + 1);
          startAttemptRef.current(round, currShot + 1);
        } else {
          scheduleNext(round + 1);
        }
      }, CONFIG.ATTEMPT_BETWEEN_MS) as unknown as number;
    }
  }, [target, round, center]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) window.clearTimeout(timerRef.current!);
    if (roundTimeoutRef.current) window.clearTimeout(roundTimeoutRef.current!);
    if (attemptTimerRef.current) window.clearTimeout(attemptTimerRef.current!);
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current!);
  }, []);

  if (mode === 'instructions') {
    return (
      <div className="min-h-screen">
        <div className="py-4 px-4">
          <div className="max-w-3xl mx-auto">
            {/* ヘッダー（反射神経と同レイアウト） */}
            <div className="text-right mb-4">
              <h1 className="text-sm font-medium text-gray-500">トリガートレーニング</h1>
            </div>

            {/* ルール説明（白カード＋グレー枠） */}
            <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">ルール</h2>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center">
                  <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">1</div>
                  <p>円はエリアの縁から<span className="font-medium text-gray-900">中心へ向かって移動</span>します（3ラウンド目以降は軽い蛇行）。</p>
                </div>
                <div className="flex items-center">
                  <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">2</div>
                  <p>クリック時の<span className="font-medium text-gray-900">円の中心と目印の中心距離</span>が近いほど高得点（最大<span className="text-blue-600 font-semibold">100点</span>）。</p>
                </div>
                <div className="flex items-center">
                  <div className="inline-flex w-6 h-6 bg-gray-500 text-white rounded-md items-center justify-center mr-3 flex-shrink-0">3</div>
                  <p>各ラウンドの試行回数は <span className="text-blue-600 font-semibold">1→5回</span>（合計15回）。合計点で勝負。</p>
                </div>
              </div>
            </div>

            {/* ボタン（青/灰） */}
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={() => navigate('/trigger-timing/game')}
                className="w-full max-w-xs px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-300"
              >
                トレーニング開始
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full max-w-40 px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300"
              >
                戻る
              </button>
            </div>

            {/* ランキング（上位10位） */}
            <div className="mt-8">
              <GameRankingTable gameType="trigger-timing" limit={10} highlightCurrentUser={true} />
            </div>
          </div>
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
              <h1 className="text-sm font-medium text-gray-500 font-bold">トリガートレーニング</h1>
            </div>

            {/* 進捗表示（カード） */}
            <div className="bg-white rounded-lg p-4 mb-8 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">トレーニング進行状況</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-blue-600">{shot + 1}</span>
                  <span className="text-sm text-gray-400">/</span>
                  <span className="text-sm text-gray-600">{Math.min(round + 1, CONFIG.TOTAL_ROUNDS)}</span>
                  <span className="text-xs text-gray-500 ml-1">ショット</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(round / CONFIG.TOTAL_ROUNDS) * 100}%` }}
                />
              </div>
            </div>

            {/* ゲームエリア（カード） */}
            <div className="flex justify-center mb-8 relative">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div
                  ref={areaRef}
                  className="relative bg-gray-100 rounded-lg mx-auto select-none overflow-hidden"
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
                      className="absolute rounded-full bg-blue-600 border border-white/80 shadow-sm drop-shadow-[0_1px_4px_rgba(0,0,0,0.24)]"
                      style={{
                        left: target.position.x - target.size / 2,
                        top: target.position.y - target.size / 2,
                        width: target.size,
                        height: target.size,
                      }}
                    />
                  )}
                  {/* 浮遊スコア */}
                  {floatingScores.map((fs) => {
                    const progress = Math.min(1, (performance.now() - fs.start) / 900);
                    const translateY = -30 * progress;
                    const opacity = 1 - progress;
                    return (
                      <div
                        key={fs.id}
                        className="absolute pointer-events-none select-none"
                        style={{
                          left: fs.x,
                          top: fs.y,
                          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
                          opacity,
                        }}
                      >
                        <div className="px-2 py-0.5 rounded-md bg-black/70 text-white text-xs font-mono">
                          {fs.value.toFixed(3)}
                        </div>
                      </div>
                    );
                  })}
                  {/* カウントダウンオーバーレイ */}
                  {countdown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-600">
                      <div className="text-6xl font-extrabold text-white">{countdown}</div>
                    </div>
                  )}
                  {/* パーティクル */}
                  {particles.map((p: Particle) => {
                    const age = performance.now() - p.start;
                    const opacity = Math.max(0, 1 - age / p.life);
                    return (
                      <div
                        key={p.id}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          left: p.x - p.size / 2,
                          top: p.y - p.size / 2,
                          width: p.size,
                          height: p.size,
                          backgroundColor: '#2563eb',
                          border: '1px solid rgba(255,255,255,0.7)',
                          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))',
                          opacity,
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 中間サマリーは廃止 */}
            </div>

            {/* 下部統計（反射神経のカードと同じ見た目） */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                <div className="text-sm text-gray-600 mb-2">このラウンドの得点</div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{currentRoundTotal.toFixed(3)}点</div>
                </div>
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
    <div className="flex-1">
      <div className="min-h-screen">
          <div className="py-4 px-4">
            <div className="max-w-4xl mx-auto">
              {/* ヘッダー */}
              <div className="text-center mb-4">
                <h1 className="text-m font-bold text-gray-800">トレーニング完了です！お疲れ様でした！</h1>
              </div>

              {/* コンパクト結果表示（合計・平均） */}
              <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">合計スコア</div>
                    <div className="text-2xl font-bold text-blue-600">{total.toFixed(3)}点</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">平均スコア</div>
                    <div className="text-2xl font-bold text-green-600">{averageScore.toFixed(3)}点</div>
                  </div>
                </div>

                {/* ランキング結果バナー（簡易） */}
                <RankingBanner total={total} />
                <div className="mt-3 flex justify-center gap-2">
                  <button
                    onClick={() => {
                      const shareText = `ハントレでトリガートレーニングをプレイしました！\n合計得点: ${total.toFixed(3)}点\n#ハントレ #狩猟`;
                      const shareUrl = window.location.origin;
                      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                      window.open(twitterUrl, '_blank');
                    }}
                    className="flex text-white items-center gap-1 px-3 py-1.5 bg-black/100 hover:bg-black/100 rounded-full text-sm font-medium transition-colors duration-200"
                    title="Xでシェア"
                  >
                    <Share2 className="w-4 h-4" />
                    Xでシェア
                  </button>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex flex-col gap-3 items-center">
                <button
                  onClick={() => navigate('/trigger-timing/game')}
                  className="w-full max-w-xs px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-300"
                >
                  もう一度トレーニングする
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full max-w-60 px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-300"
                >
                  メニューに戻る
                </button>
              </div>

              {/* ランキング表示 */}
              <div className="mt-12">
                <GameRankingTable 
                  gameType="trigger-timing" 
                  limit={10} 
                  highlightCurrentUser={true}
                  currentGameScore={Number(total.toFixed(3))}
                />
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

// ランキングバナー（現在スコアの順位を計算して表示）
const RankingBanner: React.FC<{ total: number }> = ({ total }) => {
  const [rank, setRank] = useState<number | null>(null);
  const [isTop10, setIsTop10] = useState<boolean>(false);
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const svc = HybridRankingService.getInstance();
        const res = await svc.getCurrentScoreRank('trigger-timing', Number(total.toFixed(3)));
        if (!mounted) return;
        setRank(res?.rank ?? null);
        setIsTop10(!!res?.isTop10);
      } catch {
        if (!mounted) return;
        setRank(null);
        setIsTop10(false);
      }
    };
    if (total > 0) run();
    return () => { mounted = false; };
  }, [total]);

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 text-center">
      <div className="text-sm text-blue-100 mb-1">トレーニング結果！</div>
      {rank && isTop10 ? (
        <div className="text-xl font-bold">第{rank}位</div>
      ) : (
        <>
          <div className="text-xl font-bold">ランキング圏外</div>
          <div className="text-xs text-blue-200 mt-1">(11位以下)</div>
        </>
      )}
    </div>
  );
};

export default TriggerTimingPage;
