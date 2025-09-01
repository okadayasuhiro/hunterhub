import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import XAuthService from '../services/xAuthService';
import { UserIdentificationService } from '../services/userIdentificationService';

/**
 * X OAuth コールバックページ
 * 認証後のリダイレクト先として使用
 */
const XCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const xAuthService = XAuthService.getInstance();
  const userService = UserIdentificationService.getInstance();

  useEffect(() => {
    // グローバルな処理状態管理
    const CALLBACK_PROCESSED_KEY = 'x-callback-processed';
    const CALLBACK_RESULT_KEY = 'x-callback-result';
    
    const handleCallback = async () => {
      // URLパラメータをチェック（新しい連携試行か判断）
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const currentProcessedCode = sessionStorage.getItem('x-callback-current-code');
      
      // 🔍 開発環境のみ: 詳細デバッグログ
      if (import.meta.env.DEV) {
        const allParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          allParams[key] = value;
        });
        console.log('🔍 [DEBUG] XCallback URL Parameters:', {
          url: window.location.href,
          params: allParams,
          paramCount: searchParams.size
        });
        
        console.log('🔍 [DEBUG] Key Parameters:', {
          code: code ? `${code.substring(0, 10)}...` : null,
          state: state ? `${state.substring(0, 10)}...` : null,
          error: error,
          errorDescription: errorDescription,
          currentProcessedCode: currentProcessedCode ? `${currentProcessedCode.substring(0, 10)}...` : null
        });
      }

      // sessionStorage状態チェック
      const savedResult = sessionStorage.getItem(CALLBACK_RESULT_KEY);
      if (import.meta.env.DEV) {
        console.log('🔍 [DEBUG] SessionStorage State:', {
          processed: sessionStorage.getItem(CALLBACK_PROCESSED_KEY),
          result: savedResult,
          currentCode: currentProcessedCode,
          allKeys: Object.keys(sessionStorage)
        });
      }
      
      // 新しいcodeの場合は前の処理状態をクリア
      if (code && code !== currentProcessedCode) {
        if (import.meta.env.DEV) {
          console.log('🔍 [DEBUG] New code detected, clearing previous state');
        }
        sessionStorage.removeItem(CALLBACK_PROCESSED_KEY);
        sessionStorage.removeItem(CALLBACK_RESULT_KEY);
        sessionStorage.setItem('x-callback-current-code', code);
      }
      
      // 既に処理済みかチェック（結果に基づく状態復元）
      if (sessionStorage.getItem(CALLBACK_PROCESSED_KEY)) {
        console.log('🔄 X認証: 処理済み状態を復元中...', savedResult);
        
        if (savedResult === 'success') {
          setStatus('success');
          // X連携完了フラグを設定してHeaderの更新をトリガー
          sessionStorage.setItem('x-link-completed', 'true');          setTimeout(() => navigate('/', { replace: true }), 1000);
        } else if (savedResult === 'error') {
          const savedError = sessionStorage.getItem('x-callback-error-message') || '認証に失敗しました';
          setErrorMessage(savedError);
          setStatus('error');
          setTimeout(() => navigate('/', { replace: true }), 3000);
        } else if (savedResult === 'processing') {
          // 処理中の場合は継続（再レンダリング対応）
          console.log('🔄 X認証: 処理継続中...');
          setStatus('processing');
          return; // 処理を継続
        } else {
          // 不明な状態の場合はエラー扱い
          console.warn('⚠️ X認証: 不明な状態のためエラー扱いします');
          setErrorMessage('認証処理で予期しないエラーが発生しました');
          setStatus('error');
          setTimeout(() => navigate('/', { replace: true }), 3000);
        }
        return;
      }
      
      // 処理開始をマーク
      console.log('🚀 X認証: コールバック処理を開始...');
      sessionStorage.setItem(CALLBACK_PROCESSED_KEY, 'true');
      // 処理中状態を明示的に保存
      sessionStorage.setItem(CALLBACK_RESULT_KEY, 'processing');
      
      try {

        // エラー条件のチェック
        if (error) {
          console.log('❌ X認証: キャンセルされました -', error);
          if (import.meta.env.DEV) {
            console.log('🔍 [DEBUG] Error details:', { error, errorDescription });
          }
          throw new Error(`認証がキャンセルされました: ${error}`);
        }

        if (!code || !state) {
          console.error('❌ X認証: 必要なパラメータが不足しています');
          if (import.meta.env.DEV) {
            console.log('🔍 [DEBUG] Missing parameters:', { hasCode: !!code, hasState: !!state });
          }
          throw new Error('認証パラメータが不正です');
        }

        console.log('✅ X認証: パラメータ検証完了、処理開始...');
        setStatus('processing');

        // X認証処理
        console.log('🔐 X認証: トークン交換中...');
        const userProfile = await xAuthService.handleCallback(code, state);
        console.log('✅ X認証: 認証成功 -', userProfile.name);

        // 🔒 重複チェック: 同じXアカウントの既存連携確認
        console.log('🔍 X認証: 重複チェック中...');
        const isDuplicate = await xAuthService.checkXAccountDuplicate(userProfile.id);
        
        if (isDuplicate) {
          console.error('❌ X認証: このXアカウントは既に他のユーザーと連携済みです');
          throw new Error('このXアカウントは既に他のユーザーと連携されています。別のXアカウントでお試しください。');
        }

        // ユーザーサービスに連携情報を保存
        console.log('💾 X認証: ユーザー情報保存中...');
        await userService.linkXAccountWithImage(userProfile.name, userProfile.profile_image_url, userProfile.username, userProfile.id);
        console.log('✅ X認携: 連携完了');
        // X連携完了フラグを設定してHeaderの更新をトリガー
        sessionStorage.setItem('x-link-completed', 'true');
        setStatus('success');
        sessionStorage.setItem(CALLBACK_RESULT_KEY, 'success');
        
        // 処理完了後、sessionStorageをクリア
        setTimeout(() => {
          if (import.meta.env.DEV) {
            console.log('🔍 [DEBUG] Cleaning up and navigating to home');
          }
          sessionStorage.removeItem(CALLBACK_PROCESSED_KEY);
          sessionStorage.removeItem(CALLBACK_RESULT_KEY);
          sessionStorage.removeItem('x-callback-current-code');
          sessionStorage.removeItem('x-callback-error-message');
          navigate('/', { replace: true });
        }, 2000);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '認証に失敗しました';
        console.error('❌ X認証: 処理失敗 -', errorMsg);
        
        if (import.meta.env.DEV) {
          console.log('🔍 [DEBUG] Error details:', {
            errorType: error?.constructor?.name,
            errorMessage: errorMsg,
            errorStack: error instanceof Error ? error.stack : null
          });
        }
        
        setErrorMessage(errorMsg);
        setStatus('error');
        
        // エラー結果を保存
        sessionStorage.setItem(CALLBACK_RESULT_KEY, 'error');
        sessionStorage.setItem('x-callback-error-message', errorMsg);
        
        // エラー時もsessionStorageをクリア（3秒後）
        setTimeout(() => {
          if (import.meta.env.DEV) {
            console.log('🔍 [DEBUG] Error cleanup and navigating to home');
          }
          sessionStorage.removeItem(CALLBACK_PROCESSED_KEY);
          sessionStorage.removeItem(CALLBACK_RESULT_KEY);
          sessionStorage.removeItem('x-callback-current-code');
          sessionStorage.removeItem('x-callback-error-message');
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, xAuthService, userService]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">X連携処理中...</h2>
              <p className="text-gray-600">認証情報を処理しています</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">X連携完了！</h2>
              <p className="text-gray-600">アイコンと名前が取得されました</p>
              <p className="text-sm text-gray-500 mt-2">ホームページに戻ります...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">連携に失敗しました</h2>
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <p className="text-sm text-gray-500">ホームページに戻ります...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default XCallbackPage;
