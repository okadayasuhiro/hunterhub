import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPage: React.FC = () => {
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
                            <Shield className="w-8 h-8 text-green-600 mr-3" />
                            <h1 className="text-3xl font-bold text-gray-800">プライバシーポリシー</h1>
                        </div>
                        <p className="text-gray-600">HunterHub 個人情報保護方針</p>
                        <p className="text-sm text-gray-500 mt-2">最終更新日: 2024年12月23日</p>
                    </div>

                    {/* プライバシーポリシー内容 */}
                    <div className="space-y-8 text-gray-700 leading-relaxed">
                        
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">1. 個人情報の定義</h2>
                            <p>
                                本プライバシーポリシーにおいて、「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">2. 個人情報の収集方法</h2>
                            <p>
                                当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号、運転免許証番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、当社の提携先（情報提供元、広告主、広告配信先などを含みます。以下、「提携先」といいます。）などから収集することがあります。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">3. 個人情報を収集・利用する目的</h2>
                            <p>当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                                <li>当社サービスの提供・運営のため</li>
                                <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                                <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</li>
                                <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                                <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                                <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
                                <li>有料サービスにおいて、ユーザーに利用料金を請求するため</li>
                                <li>上記の利用目的に付随する目的</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">4. 利用目的の変更</h2>
                            <p>
                                当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">5. 個人情報の第三者提供</h2>
                            <p>
                                当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-1">
                                <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                                <li>予め次の事項を告知あるいは公表し、かつ当社が個人情報保護委員会に届出をしたとき</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">6. 個人情報の開示</h2>
                            <p>
                                当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。なお、個人情報の開示に際しては、1件あたり1,000円の手数料を申し受けます。
                            </p>
                            <ul className="list-disc list-inside mt-3 ml-4 space-y-1">
                                <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
                                <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
                                <li>その他法令に違反することとなる場合</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">7. 個人情報の訂正および削除</h2>
                            <p>
                                ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下、「訂正等」といいます。）を請求することができます。当社は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">8. 個人情報の利用停止等</h2>
                            <p>
                                当社は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下、「利用停止等」といいます。）を求められた場合には、遅滞なく必要な調査を行います。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">9. Cookieの使用について</h2>
                            <p>
                                当社のサービスは、ユーザーの利便性向上のためにCookie（クッキー）を使用することがあります。Cookieの使用を希望されない場合は、ブラウザの設定でCookieを無効にすることができます。ただし、Cookieを無効にした場合、サービスの一部機能がご利用いただけない場合があります。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">10. アクセス解析ツールについて</h2>
                            <p>
                                当社のサービスでは、Googleによるアクセス解析ツール「Googleアナリティクス」を使用しています。このGoogleアナリティクスはデータの収集のためにCookieを使用しています。このデータは匿名で収集されており、個人を特定するものではありません。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">11. プライバシーポリシーの変更</h2>
                            <p>
                                当社は、必要に応じて、このプライバシーポリシーの内容を変更することがあります。この場合、変更後のプライバシーポリシーの施行時期と内容を適切な方法により周知または通知します。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-600 pb-2">12. お問い合わせ窓口</h2>
                            <p>
                                本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
                            </p>
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <p><strong>サービス名:</strong> HunterHub</p>
                                <p><strong>運営者:</strong> HunterHub運営チーム</p>
                                <p><strong>メールアドレス:</strong> privacy@hunterhub.example.com</p>
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
