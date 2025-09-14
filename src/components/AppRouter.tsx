import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import HomePage from '../pages/HomePage'; // ホームページのみ即座読み込み

// PSI最適化: 動的インポート（Code Splitting）でScript Evaluation削減
const ReflexTestPage = lazy(() => import('../pages/ReflexTestPage'));
const TargetTrackingPage = lazy(() => import('../pages/TargetTrackingPage'));
const SequenceGamePage = lazy(() => import('../pages/SequenceGamePage'));
const RankingPage = lazy(() => import('../pages/RankingPage'));
const DiagnosisHomePage = lazy(() => import('../pages/diagnosis/DiagnosisHomePage'));
const DiagnosisPage = lazy(() => import('../pages/DiagnosisPage'));
const DiagnosisResultPage = lazy(() => import('../pages/DiagnosisResultPage'));
const DiagnosisGalleryPage = lazy(() => import('../pages/DiagnosisGalleryPage'));
const AnimalQuizInstructionsPage = lazy(() => import('../pages/AnimalQuizInstructionsPage'));
const AnimalQuizGamePage = lazy(() => import('../pages/AnimalQuizGamePage'));
const AnimalQuizAnswerResultPage = lazy(() => import('../pages/AnimalQuizAnswerResultPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));
const AnimalQuizResultPage = lazy(() => import('../pages/AnimalQuizResultPage'));
const TriggerTimingPage = lazy(() => import('../pages/TriggerTimingPage'));
const XCallbackPage = lazy(() => import('../pages/XCallbackPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const NewsPage = lazy(() => import('../pages/NewsPage'));
const MyHistoryPage = lazy(() => import('../pages/MyHistoryPage'));

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

// PSI最適化: 軽量ローディングコンポーネント（Style & Layout削減）
const PageLoader: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">読み込み中...</p>
        </div>
    </div>
);

const AppRouter: React.FC = () => {
    return (
        <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1">
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            {/* ホームページ（即座読み込み） */}
                            <Route path="/" element={<HomePage />} />

                            {/* マイ履歴ページ */}
                            <Route path="/my/history" element={<MyHistoryPage />} />

                            {/* 反射神経テスト（遅延読み込み） */}
                            <Route path="/reflex" element={<Navigate to="/reflex/instructions" replace />} />
                            <Route path="/reflex/instructions" element={<ReflexTestPage mode="instructions" />} />
                            <Route path="/reflex/game" element={<ReflexTestPage mode="game" />} />
                            <Route path="/reflex/result" element={<ReflexTestPage mode="result" />} />

                            {/* ターゲット追跡ゲーム（遅延読み込み） */}
                            <Route path="/target" element={<Navigate to="/target/instructions" replace />} />
                            <Route path="/target/instructions" element={<TargetTrackingPage mode="instructions" />} />
                            <Route path="/target/game" element={<TargetTrackingPage mode="game" />} />
                            <Route path="/target/result" element={<TargetTrackingPage mode="result" />} />

                            {/* 数字順序ゲーム（遅延読み込み） */}
                            <Route path="/sequence" element={<Navigate to="/sequence/instructions" replace />} />
                            <Route path="/sequence/instructions" element={<SequenceGamePage mode="instructions" />} />
                            <Route path="/sequence/game" element={<SequenceGamePage mode="game" />} />
                            <Route path="/sequence/result" element={<SequenceGamePage mode="result" />} />

                            {/* 動物クイズゲーム（遅延読み込み） */}
                            <Route path="/animal-quiz" element={<Navigate to="/animal-quiz/instructions" replace />} />
                            <Route path="/animal-quiz/instructions" element={<AnimalQuizInstructionsPage />} />
                            <Route path="/animal-quiz/game" element={<AnimalQuizGamePage />} />
                            <Route path="/animal-quiz/answer-result" element={<AnimalQuizAnswerResultPage />} />
                            <Route path="/animal-quiz/result" element={<AnimalQuizResultPage />} />

                            {/* トリガータイミングトレーニング（単一ファイル） */}
                            <Route path="/trigger-timing" element={<Navigate to="/trigger-timing/instructions" replace />} />
                            <Route path="/trigger-timing/instructions" element={<TriggerTimingPage mode="instructions" />} />
                            <Route path="/trigger-timing/game" element={<TriggerTimingPage mode="game" />} />
                            <Route path="/trigger-timing/result" element={<TriggerTimingPage mode="result" />} />

                            {/* ランキング（遅延読み込み） */}
                            <Route path="/ranking" element={<RankingPage />} />

                            {/* ニュース（遅延読み込み） */}
                            <Route path="/news" element={<NewsPage />} />

                            {/* 狩猟鳥獣診断（遅延読み込み） */}
                            <Route path="/diagnosis" element={<DiagnosisHomePage />} />
                            <Route path="/diagnosis/quiz" element={<DiagnosisPage />} />
                            <Route path="/diagnosis/gallery" element={<DiagnosisGalleryPage />} />
                            <Route path="/diagnosis/result/:animalId/:userProfileHash" element={<DiagnosisResultPage />} />

                            {/* X OAuth コールバック（遅延読み込み） */}
                            <Route path="/x-callback" element={<XCallbackPage />} />

                            {/* 法的文書（遅延読み込み） */}
                            <Route path="/terms" element={<TermsPage />} />
                            <Route path="/privacy" element={<PrivacyPage />} />

                            {/* 404ページ（遅延読み込み） */}
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </Suspense>
                </div>
                <Footer />
            </div>
        </Router>
    );
};

export default AppRouter; 