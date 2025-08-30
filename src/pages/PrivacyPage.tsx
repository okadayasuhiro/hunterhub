import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import SEO from '../components/SEO';

const PrivacyPage: React.FC = () => {
    const navigate = useNavigate();

    const handleBackToHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen">
            <SEO 
                title="プライバシーポリシー - ハントレ"
                description="ハントレのプライバシーポリシーをご確認ください。個人情報の取り扱いやデータ保護について記載しています。"
                keywords="プライバシーポリシー,ハントレ,個人情報保護,データ保護"
                ogType="website"
                canonicalUrl="https://hantore.net/privacy"
                noIndex={true}
            />
            {/* ヘッダー */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={handleBackToHome}
                            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            ホームに戻る
                        </button>
                    </div>
                </div>
            </div>

            {/* メインコンテンツ */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
                    {/* タイトル */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <h1 className="text-3xl font-bold text-gray-800">プライバシーポリシー</h1>
                        </div>
                        <p className="text-gray-600">ハントレ 個人情報保護方針</p>
                        <p className="text-sm text-gray-500 mt-2">最終更新日: 2025年8月30日</p>
                    </div>

                    {/* プライバシーポリシー内容 */}
                    <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
                        
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">1. 収集する情報について</h2>
                            <p>
                                ハントレでは、サービス提供のために以下の情報を収集・利用します：
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                                <li><strong>任意のユーザー名</strong>：ランキング表示用（2-20文字、ローカル保存）</li>
                                <li><strong>ゲームプレイデータ</strong>：スコア、プレイ履歴（匿名化して保存）</li>
                                <li><strong>ブラウザ情報</strong>：匿名ユーザー識別用フィンガープリント</li>
                                <li><strong>X連携情報</strong>：表示名・プロフィール画像（連携時のみ、OAuth経由）</li>
                            </ul>
                            <p className="mt-3">
                                <strong>重要：</strong>氏名、住所、電話番号、メールアドレス等の個人を特定できる情報は一切収集しません。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">2. 情報の収集方法</h2>
                            <p>
                                ハントレでは、以下の方法で情報を収集します：
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                                <li><strong>ユーザー入力</strong>：任意のユーザー名設定時</li>
                                <li><strong>自動収集</strong>：ゲームプレイ時のスコア・操作データ</li>
                                <li><strong>ブラウザ技術</strong>：LocalStorage、ブラウザフィンガープリント</li>
                                <li><strong>OAuth認証</strong>：X（旧Twitter）連携時の公開プロフィール情報</li>
                            </ul>
                            <p className="mt-3">
                                <strong>注意：</strong>会員登録や個人情報の入力は一切不要です。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">3. 情報の利用目的</h2>
                            <p>収集した情報は、以下の目的でのみ利用します：</p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                                <li>ゲームサービスの提供・運営</li>
                                <li>ランキング機能の提供</li>
                                <li>ユーザー体験の向上・最適化</li>
                                <li>サービスの不正利用防止</li>
                                <li>統計データの作成（匿名化済み）</li>
                                <li>サービス改善のための分析</li>
                            </ul>
                            <p className="mt-3">
                                <strong>重要：</strong>メール送信、電話連絡、有料サービス等は一切行いません。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">4. 第三者への情報提供</h2>
                            <p>
                                ハントレでは、以下の場合を除き、収集した情報を第三者に提供することはありません：
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                                <li><strong>法令に基づく場合</strong>：法的要請がある場合</li>
                                <li><strong>緊急時</strong>：生命・身体・財産保護のため緊急に必要な場合</li>
                                <li><strong>統計データ</strong>：個人を特定できない形での統計情報提供</li>
                            </ul>
                            <p className="mt-3">
                                <strong>重要：</strong>個人を特定できる情報の第三者提供は一切行いません。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">5. データの管理・削除</h2>
                            <p>
                                ハントレでは、以下の方法でデータを管理しています：
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                                <li><strong>ローカルデータ</strong>：ブラウザのLocalStorageに保存（ユーザーが削除可能）</li>
                                <li><strong>ゲームデータ</strong>：匿名化してクラウドに保存</li>
                                <li><strong>X連携データ</strong>：連携解除時に自動削除</li>
                            </ul>
                            <p className="mt-3">
                                <strong>データ削除方法：</strong>
                            </p>
                            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                                <li>ブラウザの設定からLocalStorageを削除</li>
                                <li>X連携の解除（ヘッダーメニューから）</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">6. Cookie・トラッキング技術について</h2>
                            <p>
                                ハントレでは、以下のトラッキング技術を使用しています：
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                                <li><strong>Google Analytics</strong>：アクセス解析（匿名データ）</li>
                                <li><strong>Google AdSense</strong>：広告配信</li>
                                <li><strong>LocalStorage</strong>：ゲームデータ保存</li>
                            </ul>
                            <p className="mt-3">
                                これらの技術により収集されるデータは匿名化されており、個人を特定することはできません。
                                ブラウザの設定でCookieを無効にできますが、一部機能が制限される場合があります。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">7. プライバシーポリシーの変更</h2>
                            <p>
                                ハントレでは、必要に応じてこのプライバシーポリシーを変更することがあります。
                                変更時は、サイト上での告知により通知いたします。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">8. お問い合わせ</h2>
                            <p>
                                本ポリシーに関するご質問やご意見は、以下までお願いいたします：
                            </p>
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <p><strong>サービス名:</strong> ハントレ（hantore.net）</p>
                                <p><strong>運営者:</strong> ハントレ運営チーム</p>
                                <p><strong>お問い合わせ:</strong> <a href="https://forms.gle/FdWpWuBft4KS6q5A6" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline">お問い合わせフォーム</a>をご利用ください</p>
                            </div>
                        </section>

                    </div>

                    {/* 戻るボタン */}
                    <div className="text-center mt-12 pt-8 border-t border-gray-200">
                        <button
                            onClick={handleBackToHome}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                            ホームに戻る
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;
