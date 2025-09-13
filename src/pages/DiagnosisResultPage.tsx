import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { animals } from '../data/diagnosis/animals';
import { decodeUserProfile, calculateCompatibility } from '../utils/profileHash';
import { mbtiDescriptions, overallWildlifeHarmData, wildlifeHarmInfo, huntingGuideInfo } from '../data/diagnosis/animalDescriptions';

export default function DiagnosisResultPage() {
    const { animalId, userProfileHash } = useParams<{ animalId: string; userProfileHash: string }>();
    const navigate = useNavigate();
    // MBTI風統合型のみを表示

    // 動物データを取得
    const animal = animals.find(a => a.id === animalId);
    console.log('Animal ID from URL:', animalId);
    console.log('Found animal:', animal);
    console.log('mbtiDescriptions keys:', Object.keys(mbtiDescriptions));
    console.log('mbtiDescriptions for animal:', mbtiDescriptions[animalId || '']);

    // ユーザープロファイルをデコード
    const userProfile = userProfileHash ? decodeUserProfile(userProfileHash) : null;

    // データが見つからない場合のエラーハンドリング
    if (!animal) {
        return (
            <div className="min-h-screen bg-slate-50 py-8 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-slate-800 mb-4">結果が見つかりません</h1>
                    <p className="text-slate-600 mb-8">
                        診断結果のURLが正しくないか、データが見つかりませんでした。
                    </p>
                    <button
                        onClick={() => navigate('/diagnosis')}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                        診断をやり直す
                    </button>
                </div>
            </div>
        );
    }

    // 適合度を計算（ユーザープロファイルがある場合のみ）
    const compatibility = userProfile ? calculateCompatibility(userProfile, animal) : null;

    // ページタイトルを設定
    useEffect(() => {
        const title = `私の狩猟鳥獣タイプは「${animal.name}」でした！ - HunterHub`;
        document.title = title;
    }, [animal]);

    // 動物の絵文字を取得
    const getAnimalEmoji = (animalName: string) => {
        if (animalName.includes('カモ') || animalName.includes('ガモ')) return '🦆';
        if (animalName.includes('カラス')) return '🐦‍⬛';
        if (animalName.includes('スズメ')) return '🐦';
        if (animalName.includes('キジ')) return '🐓';
        if (animalName.includes('クマ')) return '🐻';
        if (animalName.includes('イノシシ')) return '🐗';
        if (animalName.includes('シカ')) return '🦌';
        if (animalName.includes('タヌキ')) return '🦝';
        if (animalName.includes('キツネ')) return '🦊';
        if (animalName.includes('ウサギ')) return '🐰';
        if (animalName.includes('リス')) return '🐿️';
        if (animalName.includes('ノイヌ')) return '🐕';
        return '🐾';
    };

    // 動物の専用画像があるかチェック
    const hasCustomImage = (animalId: string) => {
        console.log('hasCustomImage check:', animalId);
        return animalId === 'nihon_shika' || animalId === 'tsukinowaguma' || animalId === 'kinkurohajiro' || animalId === 'noinu' || animalId === 'magamo' || animalId === 'kiji' || animalId === 'hidorigamo' || animalId === 'inoshishi' || animalId === 'nyunai_suzume' || animalId === 'no_usagi' || animalId === 'hashibuto_garasu' || animalId === 'ten' || animalId === 'hiyodori' || animalId === 'miyamagarasu' || animalId === 'kojukei' || animalId === 'ezo_raicho' || animalId === 'hashiboso_garasu' || animalId === 'hoshihajiro' || animalId === 'araiguma' || animalId === 'kogamo' || animalId === 'yuki_usagi' || animalId === 'nutria' || animalId === 'onagagamo' || animalId === 'kurogamo' || animalId === 'kijibato' || animalId === 'higuma' || animalId === 'taiwan_risu' || animalId === 'itachi_male' || animalId === 'suzugamo' || animalId === 'yamadori' || animalId === 'tanuki' || animalId === 'mukudori' || animalId === 'noneko' || animalId === 'shima_risu' || animalId === 'hakubishin' || animalId === 'anaguma' || animalId === 'yoshigamo' || animalId === 'suzume' || animalId === 'siberia_itachi' || animalId === 'yamashigi' || animalId === 'tashigi' || animalId === 'kitsune' || animalId === 'mink' || animalId === 'karugamo' || animalId === 'hashibirogamo' || animalId === 'kawau';
    };

    // 動物の画像パスを取得
    const getAnimalImagePath = (animalId: string): string => {
        console.log('getAnimalImagePath called with:', animalId);
        switch (animalId) {
            case 'nihon_shika':
                return '/images/animals/nihon_shika.webp';
            case 'tsukinowaguma':
                return '/images/animals/tsukinowaguma.webp';
            case 'kinkurohajiro':
                return '/images/animals/kinkurohajiro.webp';
            case 'noinu':
                return '/images/animals/noinu.webp';
            case 'magamo':
                return '/images/animals/magamo.webp';
            case 'kiji':
                return '/images/animals/kiji.webp';
            case 'hidorigamo':
                return '/images/animals/hidorigamo.webp';
            case 'inoshishi':
                return '/images/animals/inoshishi.webp';
            case 'nyunai_suzume':
                return '/images/animals/nyunai_suzume.webp';
            case 'no_usagi':
                return '/images/animals/no_usagi.webp';
            case 'hashibuto_garasu':
                return '/images/animals/hashibuto_garasu.webp';
            case 'ten':
                return '/images/animals/ten.webp';
            case 'hiyodori':
                return '/images/animals/hiyodori.webp';
            case 'miyamagarasu':
                return '/images/animals/miyamagarasu.webp';
            case 'kojukei':
                return '/images/animals/kojukei.webp';
            case 'ezo_raicho':
                return '/images/animals/ezo_raicho.webp';
            case 'hashiboso_garasu':
                return '/images/animals/hashiboso_garasu.webp';
            case 'hoshihajiro':
                return '/images/animals/hoshihajiro.webp';
            case 'araiguma':
                return '/images/animals/araiguma.webp';
            case 'kogamo':
                return '/images/animals/kogamo.webp';
            case 'yuki_usagi':
                return '/images/animals/yuki_usagi.webp';
            case 'nutria':
                return '/images/animals/nutria.webp';
            case 'onagagamo':
                return '/images/animals/onagagamo.webp';
            case 'kurogamo':
                return '/images/animals/kurogamo.webp';
            case 'kijibato':
                return '/images/animals/kijibato.webp';
            case 'higuma':
                return '/images/animals/higuma.webp';
            case 'taiwan_risu':
                return '/images/animals/taiwan_risu.webp';
            case 'itachi_male':
                return '/images/animals/itachi_male.webp';
            case 'suzugamo':
                return '/images/animals/suzugamo.webp';
            case 'yamadori':
                return '/images/animals/yamadori.webp';
            case 'tanuki':
                return '/images/animals/tanuki.webp';
            case 'mukudori':
                return '/images/animals/mukudori.webp';
            case 'noneko':
                return '/images/animals/noneko.webp';
            case 'shima_risu':
                return '/images/animals/shima_risu.webp';
            case 'hakubishin':
                return '/images/animals/hakubishin.webp';
            case 'anaguma':
                return '/images/animals/anaguma.webp';
            case 'yoshigamo':
                return '/images/animals/yoshigamo.webp';
            case 'suzume':
                return '/images/animals/suzume.webp';
            case 'siberia_itachi':
                return '/images/animals/siberia_itachi.webp';
            case 'yamashigi':
                return '/images/animals/yamashigi.webp';
            case 'tashigi':
                return '/images/animals/tashigi.webp';
            case 'kitsune':
                return '/images/animals/kitsune.webp';
            case 'mink':
                return '/images/animals/mink.webp';
            case 'karugamo':
                return '/images/animals/karugamo.webp';
            case 'hashibirogamo':
                return '/images/animals/hashibirogamo.webp';
            case 'kawau':
                return '/images/animals/kawau.webp';
            default:
                return '/images/animals/default.png';
        }
    };

    // シェア機能
    const shareResult = (platform: 'x' | 'facebook' | 'threads' | 'line') => {
        const currentUrl = window.location.href;
        const shareText = `私の狩猟鳥獣タイプは「${animal.name}」でした！${compatibility !== null ? `\n適合度: ${compatibility}%` : ''}\n${mbtiDescriptions[animal.id]?.subtitle || animal.catchphrase}\n\nあなたも診断してみませんか？`;

        if (platform === 'x') {
            const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
            window.open(xUrl, '_blank');
        } else if (platform === 'facebook') {
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(shareText)}`;
            window.open(facebookUrl, '_blank');
        } else if (platform === 'threads') {
            const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText + '\n' + currentUrl)}`;
            window.open(threadsUrl, '_blank');
        } else if (platform === 'line') {
            const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
            window.open(lineUrl, '_blank');
        }
    };

    // URLをクリップボードにコピー
    const copyUrl = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert('URLをクリップボードにコピーしました！');
        } catch (error) {
            console.error('コピーに失敗しました:', error);
            alert('URLのコピーに失敗しました。');
        }
    };

    // Markdownスタイルの太字を美しく表示（ブロック形式）
    const formatTextWithBold = (text: string) => {
        // **text** をブロック形式の強調に変換
        const formattedText = text.replace(
            /\*\*(.*?)\*\*/g,
            '<div class="my-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg"><span class="font-semibold text-blue-800 text-lg leading-relaxed">$1</span></div>'
        );

        return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* ヘッダー */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">診断結果</h1>
                    <p className="text-slate-600">あなたの狩猟鳥獣タイプは...</p>

                    {/* 統合型表示のみ - 切替ボタン削除 */}
                </div>

                {/* 結果カード */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                    {/* 動物画像 */}
                    <div
                        className="h-48 flex items-center justify-center"
                        style={{
                            backgroundImage: 'url(/images/bg_green.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center 77%',
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated'
                        }}
                    >
                        {hasCustomImage(animal.id) ? (
                            <img
                                src={getAnimalImagePath(animal.id)}
                                alt={animal.name}
                                className="max-h-40 max-w-40 object-contain"
                                style={{ imageRendering: 'pixelated' }}
                                onLoad={() => {
                                    console.log('Image loaded successfully:', getAnimalImagePath(animal.id));
                                }}
                                onError={(e) => {
                                    console.error('Image load error:', getAnimalImagePath(animal.id));
                                    console.error('Error event:', e);
                                    // 画像読み込みエラー時は絵文字にフォールバック
                                    e.currentTarget.style.display = 'none';
                                    const fallbackDiv = document.createElement('div');
                                    fallbackDiv.className = 'text-8xl';
                                    fallbackDiv.textContent = getAnimalEmoji(animal.name);
                                    e.currentTarget.parentNode?.appendChild(fallbackDiv);
                                }}
                            />
                        ) : (
                            <div className="text-8xl">
                                {getAnimalEmoji(animal.name)}
                            </div>
                        )}
                    </div>

                    {/* 動物情報 */}
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            {animal.name}
                        </h2>

                        <p className="text-blue-600 font-medium text-lg mb-4">
                            {mbtiDescriptions[animal.id]?.subtitle || animal.catchphrase}
                        </p>
                        <p className="text-slate-700 leading-relaxed max-w-2xl mx-auto whitespace-pre-line mb-6">
                            {mbtiDescriptions[animal.id]?.description || animal.description}
                        </p>
                        {/* 適合度表示（診断結果からのアクセス時のみ） */}
                        {compatibility !== null && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-600">適合度</span>
                                    <span className="font-bold text-lg text-blue-600">{compatibility}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                                    <div
                                        className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                                        style={{ width: `${compatibility}%` }}
                                    ></div>
                                </div>
                                <div className="bg-slate-50 border border-gray-300 rounded-lg p-3">
                                    <p className="text-xs text-slate-800">
                                        <span className="font-semibold">適合度とは？</span><br />
                                        あなたの性格プロファイル（活動性・思考性・社交性・安定性）と、この動物の特性がどれだけ一致しているかを数値化したものです。
                                        高いほど、あなたとこの動物の性格的特徴が似ていることを表します。
                                    </p>
                                </div>
                            </div>
                        )}


                    </div>
                </div>

                {/* 詳細解説セクション - MBTI風統合型のみ表示 */}
                {mbtiDescriptions[animal.id] ? (
                    /* MBTI風統合型表示 */
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="space-y-8">
                            {mbtiDescriptions[animal.id].sections.map((section, index) => (
                                <div key={index}>
                                    <h4 className="text-xl font-bold text-slate-800 mt-4 mb-4">
                                        {section.title}
                                    </h4>
                                    <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                                        {formatTextWithBold(section.description)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* データが見つからない場合のフォールバック */
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="text-center text-slate-600">
                            <p>この動物の詳細説明は現在準備中です。</p>
                        </div>
                    </div>
                )}

                {/* アナーキー犬のブリッジメッセージ - 野生鳥獣セクションへの導入 */}
                <div className="mb-8 flex items-start space-x-4">
                    {/* アナーキー犬の画像 */}
                    <div className="flex-shrink-0">
                        <img
                            src="/images/anarchy_dog.png"
                            alt="アナーキー犬"
                            className="w-16 h-16 object-cover rounded-full"
                        />
                    </div>

                    {/* 吹き出し */}
                    <div className="relative bg-white rounded-xl p-4 max-w-xl shadow-lg">
                        {/* 吹き出しの三角形 */}
                        <div className="absolute left-0 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white transform -translate-x-2"></div>

                        <p className="text-slate-700 font-medium text-sm leading-relaxed">
                            ところで、オマエの診断結果の<span className="font-bold">{animal.name}</span>だけど、実は狩猟鳥獣なんだワーン。知ってた？日本では野生鳥獣による被害が深刻な問題になってるんだワーン。ちょっと現実の話をしてもいいかワーン？
                        </p>
                    </div>
                </div>

                {/* 獣害情報セクション */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
                        狩猟鳥獣　{animal.name}と私たちの暮らし
                        <span className="block text-sm font-normal text-slate-600 mt-1">〜知っておきたい現実と向き合う方法〜</span>
                    </h3>

                    {/* 全体獣害データ */}
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
                        <h4 className="text-lg font-semibold text-red-800 mb-2">野生鳥獣による被害の現状</h4>
                        <p className="text-red-700 text-sm mb-3">{overallWildlifeHarmData.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="bg-white px-3 py-2 rounded-lg">
                                <span className="font-semibold text-red-600">年間被害額：</span>
                                <span className="text-red-800">{overallWildlifeHarmData.totalDamage}</span>
                            </div>
                            <div className="bg-white px-3 py-2 rounded-lg">
                                <span className="font-semibold text-red-600">データ年度：</span>
                                <span className="text-red-800">{overallWildlifeHarmData.year}</span>
                            </div>
                        </div>

                        {/* 出典情報 */}
                        <div className="mt-4 text-xs text-red-600">
                            <div className="mb-2">
                                <span className="font-semibold">出典：</span>
                                <a
                                    href={overallWildlifeHarmData.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-700 hover:text-red-900 underline ml-1"
                                >
                                    {overallWildlifeHarmData.source}
                                </a>
                            </div>

                            {/* 詳細リンク */}
                            {overallWildlifeHarmData.detailLinks && overallWildlifeHarmData.detailLinks.length > 0 && (
                                <div>
                                    <span className="font-semibold">関連リンク：</span>
                                    <div className="mt-1 space-y-1">
                                        {overallWildlifeHarmData.detailLinks.map((link, index) => (
                                            <div key={index}>
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-red-700 hover:text-red-900 underline inline-flex items-center"
                                                >
                                                    {link.title}
                                                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 動物別被害情報（該当動物のみ） */}
                    {wildlifeHarmInfo[animal.id] && (
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded-r-lg">
                            <h4 className="text-lg font-semibold text-orange-800 mb-2">
                                {animal.name}による被害について
                            </h4>
                            <p className="text-orange-700 text-sm mb-3 whitespace-pre-line">
                                {wildlifeHarmInfo[animal.id]?.damageDescription || '被害情報は記録されていません。'}
                            </p>

                            <div className="flex flex-wrap gap-3">
                                {wildlifeHarmInfo[animal.id].damageAmount && (
                                    <div className="bg-white px-3 py-2 rounded-lg">
                                        <span className="font-semibold text-orange-600">年間被害額：</span>
                                        <span className="text-orange-800">{wildlifeHarmInfo[animal.id].damageAmount}</span>
                                    </div>
                                )}
                                {wildlifeHarmInfo[animal.id].latestYear && (
                                    <div className="bg-white px-3 py-2 rounded-lg">
                                        <span className="font-semibold text-orange-600">データ年度：</span>
                                        <span className="text-orange-800">{wildlifeHarmInfo[animal.id].latestYear}</span>
                                    </div>
                                )}
                            </div>

                            {wildlifeHarmInfo[animal.id].sources && wildlifeHarmInfo[animal.id].sources!.length > 0 && (
                                <div className="mt-3 text-xs text-orange-600">
                                    <span className="font-semibold">出典：</span>
                                    {wildlifeHarmInfo[animal.id].sources!.join('、')}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* アナーキー犬のお礼メッセージ */}
                <div className="mb-8 flex items-start space-x-4">
                    {/* アナーキー犬の画像 */}
                    <div className="flex-shrink-0">
                        <img
                            src="/images/anarchy_dog.png"
                            alt="アナーキー犬"
                            className="w-16 h-16 object-cover rounded-full"
                        />
                    </div>

                    {/* 吹き出し */}
                    <div className="relative bg-white rounded-xl p-4 max-w-xl shadow-lg">
                        {/* 吹き出しの三角形 */}
                        <div className="absolute left-0 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white transform -translate-x-2"></div>

                        <p className="text-slate-700 font-medium text-sm leading-relaxed">
                            ちょっと重い話になったけど、これも現実なんだワーン。でも診断は楽しかっただろ？オマエは<span className="font-bold">{animal.name}</span>だったんだな。イカスなワーン！<br />この結果をぜひ友達にもシェアして、みんなで楽しんでほしいワンッ！
                        </p>
                    </div>
                </div>

                {/* シェアボタン */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">結果をシェアしよう！</h3>
                    <div className="grid grid-cols-5 gap-3">
                        {/* X (Twitter) */}
                        <button
                            onClick={() => shareResult('x')}
                            className="bg-black hover:bg-gray-800 text-white font-bold py-4 px-3 rounded-lg transition-colors duration-200 flex flex-col items-center gap-2"
                            title="Xでシェア"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span className="text-xs">X</span>
                        </button>

                        {/* Facebook */}
                        <button
                            onClick={() => shareResult('facebook')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-3 rounded-lg transition-colors duration-200 flex flex-col items-center gap-2"
                            title="Facebookでシェア"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span className="text-xs">Facebook</span>
                        </button>

                        {/* Threads */}
                        <button
                            onClick={() => shareResult('threads')}
                            className="bg-black hover:bg-gray-800 text-white font-bold py-4 px-3 rounded-lg transition-colors duration-200 flex flex-col items-center gap-2"
                            title="Threadsでシェア"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068c0-3.518.85-6.373 2.495-8.424C5.845 1.205 8.598.024 12.179 0h.014c3.581.024 6.334 1.205 8.184 3.509 1.645 2.051 2.495 4.906 2.495 8.424 0 3.518-.85 6.373-2.495 8.424C18.533 22.795 15.781 23.976 12.186 24zM12.179 2.174c-2.687.018-4.912.942-6.204 2.548C4.8 6.293 4.174 8.845 4.174 12.068c0 3.223.626 5.775 1.801 7.346 1.292 1.606 3.517 2.53 6.204 2.548h.014c2.687-.018 4.912-.942 6.204-2.548 1.175-1.571 1.801-4.123 1.801-7.346 0-3.223-.626-5.775-1.801-7.346-1.292-1.606-3.517-2.53-6.204-2.548h-.014z" />
                                <path d="M17.99 13.191c-.1-.066-.202-.158-.202-.158-.644-.406-1.644-.84-2.811-.84-2.35 0-4.329 1.492-4.329 3.346 0 .67.28 1.273.743 1.73.463.456 1.091.707 1.767.707.676 0 1.304-.251 1.767-.707.463-.457.743-1.06.743-1.73 0-.402-.094-.784-.262-1.133-.168-.35-.413-.665-.716-.915z" />
                            </svg>
                            <span className="text-xs">Threads</span>
                        </button>

                        {/* LINE */}
                        <button
                            onClick={() => shareResult('line')}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-3 rounded-lg transition-colors duration-200 flex flex-col items-center gap-2"
                            title="LINEでシェア"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                            </svg>
                            <span className="text-xs">LINE</span>
                        </button>

                        {/* URLコピー */}
                        <button
                            onClick={copyUrl}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-3 rounded-lg transition-colors duration-200 flex flex-col items-center gap-2"
                            title="URLをコピー"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">コピー</span>
                        </button>
                    </div>
                </div>

                {/* 狩猟に興味をもったら */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
                        もし、狩猟に興味をもったら
                        <span className="block text-sm font-normal text-slate-600 mt-1">〜野生鳥獣問題解決への参加方法〜</span>
                    </h3>

                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                        <h4 className="text-lg font-semibold text-green-800 mb-2">{huntingGuideInfo.title}</h4>
                        <p className="text-green-700 text-sm mb-4">{huntingGuideInfo.description}</p>

                        {/* 表形式のアクションガイド */}
                        <div className="overflow-x-auto mb-4">
                            <table className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
                                <thead className="bg-green-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-green-800">ステップ</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-green-800">アクション</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-green-800">リンク</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {huntingGuideInfo.actions.map((action, index) => (
                                        <tr key={index} className="border-t border-green-100">
                                            <td className="px-4 py-3 text-sm font-bold text-green-700">
                                                {action.step}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-semibold text-green-800 text-sm">{action.title}</div>
                                                    <div className="text-green-700 text-xs mt-1">{action.description}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <a
                                                    href={action.linkUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                                                >
                                                    {action.linkText}
                                                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 注意書き */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h5 className="text-sm font-semibold text-yellow-800">重要な注意事項</h5>
                                    <div className="space-y-1 mt-2">
                                        {huntingGuideInfo.warnings.map((warning, index) => (
                                            <div key={index} className="flex items-start text-sm text-yellow-700">
                                                <span className="mr-2 text-yellow-500">{warning.split(' ')[0]}</span>
                                                <span>{warning.split(' ').slice(1).join(' ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* アクションボタン */}
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/diagnosis')}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                        もう一度診断する
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                    >
                        ホームに戻る
                    </button>
                </div>
            </div>
        </div>
    );
} 