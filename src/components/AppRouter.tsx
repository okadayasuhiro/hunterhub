import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import HomePage from '../pages/HomePage';
import ReflexTestPage from '../pages/ReflexTestPage';
import TargetTrackingPage from '../pages/TargetTrackingPage';
import SequenceGamePage from '../pages/SequenceGamePage';
import RankingPage from '../pages/RankingPage';
import DiagnosisHomePage from '../pages/diagnosis/DiagnosisHomePage';
import DiagnosisPage from '../pages/DiagnosisPage';
import DiagnosisResultPage from '../pages/DiagnosisResultPage';
import DiagnosisGalleryPage from '../pages/DiagnosisGalleryPage';
import AnimalQuizInstructionsPage from '../pages/AnimalQuizInstructionsPage';
import AnimalQuizGamePage from '../pages/AnimalQuizGamePage';
import AnimalQuizAnswerResultPage from '../pages/AnimalQuizAnswerResultPage';
import TermsPage from '../pages/TermsPage';
import PrivacyPage from '../pages/PrivacyPage';
import AnimalQuizResultPage from '../pages/AnimalQuizResultPage';
import XCallbackPage from '../pages/XCallbackPage';
import NotFoundPage from '../pages/NotFoundPage';

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

const AppRouter: React.FC = () => {
    return (
        <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1">
                    <Routes>
                        {/* ホームページ */}
                        <Route path="/" element={<HomePage />} />

                        {/* 反射神経テスト */}
                        <Route path="/reflex" element={<Navigate to="/reflex/instructions" replace />} />
                        <Route path="/reflex/instructions" element={<ReflexTestPage mode="instructions" />} />
                        <Route path="/reflex/game" element={<ReflexTestPage mode="game" />} />
                        <Route path="/reflex/result" element={<ReflexTestPage mode="result" />} />

                        {/* ターゲット追跡ゲーム */}
                        <Route path="/target" element={<Navigate to="/target/instructions" replace />} />
                        <Route path="/target/instructions" element={<TargetTrackingPage mode="instructions" />} />
                        <Route path="/target/game" element={<TargetTrackingPage mode="game" />} />
                        <Route path="/target/result" element={<TargetTrackingPage mode="result" />} />

                        {/* 数字順序ゲーム */}
                        <Route path="/sequence" element={<Navigate to="/sequence/instructions" replace />} />
                        <Route path="/sequence/instructions" element={<SequenceGamePage mode="instructions" />} />
                        <Route path="/sequence/game" element={<SequenceGamePage mode="game" />} />
                        <Route path="/sequence/result" element={<SequenceGamePage mode="result" />} />

                        {/* 動物クイズゲーム */}
                        <Route path="/animal-quiz" element={<Navigate to="/animal-quiz/instructions" replace />} />
                        <Route path="/animal-quiz/instructions" element={<AnimalQuizInstructionsPage />} />
                        <Route path="/animal-quiz/game" element={<AnimalQuizGamePage />} />
                        <Route path="/animal-quiz/answer-result" element={<AnimalQuizAnswerResultPage />} />
                        <Route path="/animal-quiz/result" element={<AnimalQuizResultPage />} />

                        {/* ランキング */}
                        <Route path="/ranking" element={<RankingPage />} />

                        {/* 狩猟鳥獣診断 */}
                        <Route path="/diagnosis" element={<DiagnosisHomePage />} />
                        <Route path="/diagnosis/quiz" element={<DiagnosisPage />} />
                        <Route path="/diagnosis/gallery" element={<DiagnosisGalleryPage />} />
                        <Route path="/diagnosis/result/:animalId/:userProfileHash" element={<DiagnosisResultPage />} />

                        {/* X OAuth コールバック */}
                        <Route path="/x-callback" element={<XCallbackPage />} />

                        {/* 法的文書 */}
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />

                        {/* 404ページ */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </div>
                <Footer />
            </div>
        </Router>
    );
};

export default AppRouter; 