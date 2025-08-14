/**
 * ユーザー名登録モーダル
 * ゲーム終了後に表示される任意のユーザー名登録UI
 */

import React, { useState, useEffect } from 'react';
import { UserIdentificationService } from '../services/userIdentificationService';

interface UsernameRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsernameSet: (username: string) => void;
  gameType: string;
  score: number;
  isNewRecord?: boolean;
}

export const UsernameRegistrationModal: React.FC<UsernameRegistrationModalProps> = ({
  isOpen,
  onClose,
  onUsernameSet,
  gameType,
  score,
  isNewRecord = false
}) => {
  const [username, setUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const userService = UserIdentificationService.getInstance();

  useEffect(() => {
    if (isOpen) {
      loadCurrentUsername();
    }
  }, [isOpen]);

  const loadCurrentUsername = async () => {
    try {
      const existingUsername = await userService.getUsername();
      setCurrentUsername(existingUsername || '');
      setUsername(existingUsername || '');
    } catch (error) {
      console.error('Failed to load username:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.trim().length < 2) {
      setError('ユーザー名は2文字以上で入力してください');
      return;
    }

    if (username.trim().length > 20) {
      setError('ユーザー名は20文字以内で入力してください');
      return;
    }

    // 不適切な文字チェック
    const invalidChars = /[<>\"'&]/;
    if (invalidChars.test(username)) {
      setError('使用できない文字が含まれています');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await userService.setUsername(username.trim());
      setShowSuccess(true);
      
      setTimeout(() => {
        onUsernameSet(username.trim());
        onClose();
        setShowSuccess(false);
      }, 1500);
    } catch (error) {
      setError('ユーザー名の保存に失敗しました');
      console.error('Failed to save username:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          {isNewRecord ? (
            <div className="mb-4">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">新記録達成！</h2>
              <p className="text-sm text-gray-600">スコア: {score}点</p>
            </div>
          ) : (
            <div className="mb-4">
              <div className="text-4xl mb-2">🎮</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">ゲーム完了</h2>
              <p className="text-sm text-gray-600">スコア: {score}点</p>
            </div>
          )}
          
          <p className="text-gray-700">
            ランキングに表示する名前を設定しませんか？
          </p>
          <p className="text-xs text-gray-500 mt-1">
            （任意・後から変更可能）
          </p>
        </div>

        {showSuccess ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-green-600 font-medium">ユーザー名を保存しました！</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* 現在のユーザー名表示 */}
            {currentUsername && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">現在のユーザー名:</p>
                <p className="font-medium text-gray-800">{currentUsername}</p>
              </div>
            )}

            {/* ユーザー名入力 */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                ユーザー名
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: ハンター太郎"
                maxLength={20}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                2-20文字、特殊文字不可
              </p>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* ボタン群 */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                スキップ
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                disabled={isLoading || username.trim().length < 2}
              >
                {isLoading ? '保存中...' : currentUsername ? '更新' : '設定'}
              </button>
            </div>
          </form>
        )}

        {/* プライバシー説明 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            🔒 ユーザー名はお使いの端末にのみ保存され、個人情報は収集されません
          </p>
        </div>
      </div>
    </div>
  );
};