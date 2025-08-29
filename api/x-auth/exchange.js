// Vercel Functions - X認証プロキシ
export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { code, state, redirectUri, codeVerifier } = req.body;
    
    console.log('🔄 Processing X token exchange...');

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    if (!codeVerifier) {
      return res.status(400).json({
        success: false,
        error: 'Code verifier is required for PKCE'
      });
    }

    const X_CLIENT_ID = process.env.X_CLIENT_ID;
    const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;

    if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'X API credentials not configured'
      });
    }

    // Step 1: トークン交換
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: X_CLIENT_ID,
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier // 正しいPKCE code_verifier
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      return res.status(400).json({
        success: false,
        error: 'Token exchange failed'
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: ユーザープロフィール取得
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ User profile fetch failed:', errorText);
      return res.status(400).json({
        success: false,
        error: 'User profile fetch failed'
      });
    }

    const userData = await userResponse.json();
    const user = userData.data;

    console.log('✅ User profile fetched:', user.name);

    // 成功レスポンス
    res.json({
      success: true,
      data: {
        name: user.name,
        profileImageUrl: user.profile_image_url
      }
    });

  } catch (error) {
    console.error('❌ X authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
