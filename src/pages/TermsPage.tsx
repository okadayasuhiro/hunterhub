import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsPage: React.FC = () => {
    const navigate = useNavigate();

    const handleBackToHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
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
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* タイトル */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-600 mr-3" />
                            <h1 className="text-3xl font-bold text-gray-800">利用規約</h1>
                        </div>
                        <p className="text-gray-600">ハントレ サービス利用規約</p>
                        <p className="text-sm text-gray-500 mt-2">最終更新日: 2025年8月30日</p>
                    </div>

                    {/* 利用規約内容 */}
                    <div className="space-y-8 text-gray-700 leading-relaxed">
                        
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第1条（適用）</h2>
                            <p>
                                本規約は、ハントレ（以下「当サービス」）の利用に関して、当サービスを提供する運営者（以下「当社」）と利用者（以下「ユーザー」）との間の権利義務関係を定めることを目的とし、ユーザーと当社との間の当サービスの利用に関わる一切の関係に適用されます。
                            </p>
                            <p className="mt-3">
                                <strong>サービス概要：</strong>ハントレは、ハンター向けのトレーニングゲーム（反射神経テスト、ターゲット追跡、数字記憶）および狩猟動物診断を提供する無料のWebサービスです。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第2条（サービス利用）</h2>
                            <p>
                                当サービスは、<strong>会員登録不要</strong>でご利用いただけます。ユーザーは本規約に同意することで、直ちにサービスを利用できます。
                            </p>
                            <p className="mt-3">
                                <strong>任意機能：</strong>以下の機能は任意でご利用いただけます：
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-1">
                                <li>ユーザー名設定（ランキング表示用）</li>
                                <li>X（旧Twitter）連携（プロフィール表示用）</li>
                            </ul>
                            <p className="mt-3">
                                これらの機能を利用しない場合でも、全てのゲーム機能をお楽しみいただけます。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第3条（禁止事項）</h2>
                            <p>ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません：</p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                                <li>法令または公序良俗に違反する行為</li>
                                <li>サーバーやシステムに過度な負荷をかける行為</li>
                                <li>自動化ツール・BOT等を使用した不正なスコア獲得</li>
                                <li>他のユーザーになりすます行為</li>
                                <li>不適切なユーザー名の設定</li>
                                <li>サービスの運営を妨害する行為</li>
                                <li>その他、当社が不適切と判断する行為</li>
                            </ul>
                            <p className="mt-3">
                                <strong>注意：</strong>ゲームは公正にプレイしてください。不正行為が発見された場合、該当データを削除することがあります。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第4条（本サービスの提供の停止等）</h2>
                            <p>
                                当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-1">
                                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第5条（利用制限）</h2>
                            <p>
                                当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、当該ユーザーのデータ削除やアクセス制限を行うことができるものとします：
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-1">
                                <li>本規約に違反した場合</li>
                                <li>不正なスコア獲得が確認された場合</li>
                                <li>システムに過度な負荷をかけた場合</li>
                                <li>その他、当社がサービス利用を適当でないと判断した場合</li>
                            </ul>
                            <p className="mt-3">
                                <strong>注意：</strong>当サービスは会員登録制ではないため、「登録抹消」ではなくデータ削除・アクセス制限を行います。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第6条（免責事項）</h2>
                            <p>
                                当サービスは<strong>無料</strong>で提供されており、以下について保証いたしません：
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-1">
                                <li>サービスの継続性・安定性</li>
                                <li>ゲームスコアの永続的保存</li>
                                <li>システムエラーやデータ消失の防止</li>
                                <li>他のユーザーの行為</li>
                            </ul>
                            <p className="mt-3">
                                当社は、本サービスの利用により生じた損害について責任を負いません。
                                ただし、消費者契約法に定める消費者契約の場合、この免責規定は適用されません。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第7条（サービス内容の変更等）</h2>
                            <p>
                                当社は、サービス向上のため、事前通知なくサービス内容を変更または提供を中止することがあります。
                                重要な変更については、可能な限りサイト上で事前にお知らせいたします。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第8条（利用規約の変更）</h2>
                            <p>
                                当社は、必要に応じて本規約を変更することがあります。
                                変更後は、サイト上での告知により通知し、継続利用により変更に同意したものとみなします。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第9条（個人情報の取扱い）</h2>
                            <p>
                                当社は、本サービスで収集する情報について、別途定める「プライバシーポリシー」に従い適切に取り扱います。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第10条（準拠法・裁判管轄）</h2>
                            <p>
                                本規約は日本法に準拠し、本サービスに関する紛争については、当社所在地を管轄する裁判所を専属的合意管轄とします。
                            </p>
                        </section>

                    </div>

                    {/* 戻るボタン */}
                    <div className="text-center mt-12 pt-8 border-t border-gray-200">
                        <button
                            onClick={handleBackToHome}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                            ホームに戻る
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
