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
    
    const handleCallback = async () => {
      // URLパラメータをチェック（新しい連携試行か判断）
      const code = searchParams.get('code');
      const currentProcessedCode = sessionStorage.getItem('x-callback-current-code');
      
      // 新しいcodeの場合は前の処理状態をクリア
      if (code && code !== currentProcessedCode) {
        sessionStorage.removeItem(CALLBACK_PROCESSED_KEY);
        sessionStorage.setItem('x-callback-current-code', code);
      }
      
      // 既に処理済みかチェック
      if (sessionStorage.getItem(CALLBACK_PROCESSED_KEY)) {
        console.log('⚠️ Callback already processed globally, skipping...');
        setStatus('success');
        setTimeout(() => navigate('/', { replace: true }), 1000);
        return;
      }
      
      // 処理開始をマーク
      sessionStorage.setItem(CALLBACK_PROCESSED_KEY, 'true');
      
      try {
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`認証がキャンセルされました: ${error}`);
        }

        if (!code || !state) {
          throw new Error('認証パラメータが不正です');
        }

        setStatus('processing');

        // X認証処理
        const { name, profileImageUrl } = await xAuthService.handleCallback(code, state);

        // ユーザーサービスに連携情報を保存
        await userService.linkXAccountWithImage(name, profileImageUrl);

        setStatus('success');
        
        // 処理完了後、sessionStorageをクリア
        setTimeout(() => {
          sessionStorage.removeItem(CALLBACK_PROCESSED_KEY);
          sessionStorage.removeItem('x-callback-current-code');
          navigate('/', { replace: true });
        }, 2000);

      } catch (error) {
        console.error('X authentication callback failed:', error);
        setErrorMessage(error instanceof Error ? error.message : '認証に失敗しました');
        setStatus('error');
        
        // エラー時もsessionStorageをクリア
        setTimeout(() => {
          sessionStorage.removeItem(CALLBACK_PROCESSED_KEY);
          sessionStorage.removeItem('x-callback-current-code');
          navigate('/', { replace: true });
        }, 5000);
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
