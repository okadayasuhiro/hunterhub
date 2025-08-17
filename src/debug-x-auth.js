// X認証のデバッグ用テストファイル
console.log('=== X Auth Debug ===');
console.log('Client ID:', import.meta.env.VITE_X_CLIENT_ID);
console.log('Redirect URI:', import.meta.env.VITE_X_REDIRECT_URI);

// 簡単な認証URL生成テスト
const testClientId = import.meta.env.VITE_X_CLIENT_ID || 'test';
const testRedirectUri = import.meta.env.VITE_X_REDIRECT_URI || 'http://localhost:5173/x-callback';

const params = new URLSearchParams({
  response_type: 'code',
  client_id: testClientId,
  redirect_uri: testRedirectUri,
  scope: 'tweet.read users.read',
  state: 'test-state'
});

const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
console.log('Generated Auth URL:', authUrl);
console.log('===================');
