import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import HomePage from '../pages/HomePage';
import ReflexTestPage from '../pages/ReflexTestPage';
import TargetTrackingPage from '../pages/TargetTrackingPage';
import SequenceGamePage from '../pages/SequenceGamePage';
import DiagnosisHomePage from '../pages/diagnosis/DiagnosisHomePage';
import DiagnosisPage from '../pages/DiagnosisPage';
import DiagnosisResultPage from '../pages/DiagnosisResultPage';
import DiagnosisGalleryPage from '../pages/DiagnosisGalleryPage';
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

                        {/* 狩猟鳥獣診断 */}
                        <Route path="/diagnosis" element={<DiagnosisHomePage />} />
                        <Route path="/diagnosis/quiz" element={<DiagnosisPage />} />
                        <Route path="/diagnosis/gallery" element={<DiagnosisGalleryPage />} />
                        <Route path="/diagnosis/result/:animalId/:userProfileHash" element={<DiagnosisResultPage />} />

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