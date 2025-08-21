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
                        <p className="text-gray-600">HunterHub サービス利用規約</p>
                        <p className="text-sm text-gray-500 mt-2">最終更新日: 2024年12月23日</p>
                    </div>

                    {/* 利用規約内容 */}
                    <div className="space-y-8 text-gray-700 leading-relaxed">
                        
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第1条（適用）</h2>
                            <p>
                                本規約は、HunterHub（以下「当サービス」）の利用に関して、当サービスを提供する運営者（以下「当社」）と利用者（以下「ユーザー」）との間の権利義務関係を定めることを目的とし、ユーザーと当社との間の当サービスの利用に関わる一切の関係に適用されます。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第2条（利用登録）</h2>
                            <p>
                                当サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
                            </p>
                            <p className="mt-3">
                                当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-1">
                                <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                                <li>本規約に違反したことがある者からの申請である場合</li>
                                <li>その他、当社が利用登録を相当でないと判断した場合</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第3条（禁止事項）</h2>
                            <p>ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                                <li>法令または公序良俗に違反する行為</li>
                                <li>犯罪行為に関連する行為</li>
                                <li>当社、当サービスの他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                                <li>当サービスの運営を妨害するおそれのある行為</li>
                                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                                <li>不正アクセスをし、またはこれを試みる行為</li>
                                <li>他のユーザーに成りすます行為</li>
                                <li>反社会的勢力に対して直接または間接に利益を供与する行為</li>
                                <li>その他、当社が不適切と判断する行為</li>
                            </ul>
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
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第5条（利用制限および登録抹消）</h2>
                            <p>
                                当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-1">
                                <li>本規約のいずれかの条項に違反した場合</li>
                                <li>登録事項に虚偽の事実があることが判明した場合</li>
                                <li>料金等の支払債務の不履行があった場合</li>
                                <li>当社からの連絡に対し、一定期間返答がない場合</li>
                                <li>本サービスについて、最終の利用から一定期間利用がない場合</li>
                                <li>その他、当社が本サービスの利用を適当でないと判断した場合</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第6条（保証の否認および免責事項）</h2>
                            <p>
                                当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
                            </p>
                            <p className="mt-3">
                                当社は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する当社とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第7条（サービス内容の変更等）</h2>
                            <p>
                                当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第8条（利用規約の変更）</h2>
                            <p>
                                当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第9条（個人情報の取扱い）</h2>
                            <p>
                                当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第10条（通知または連絡）</h2>
                            <p>
                                ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、ユーザーから、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第11条（権利義務の譲渡の禁止）</h2>
                            <p>
                                ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">第12条（準拠法・裁判管轄）</h2>
                            <p>
                                本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
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
