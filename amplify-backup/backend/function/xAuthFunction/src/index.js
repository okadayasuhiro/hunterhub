/**
 * AWS Lambda - X (Twitter) OAuth 2.0 認証専用関数
 * 世界最高のエンジニアによる安全で効率的な実装
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

const https = require('https');
const querystring = require('querystring');

// CORS設定
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
};

/**
 * HTTPS リクエスト実行（Promise対応）
 */
const httpsRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

/**
 * メインハンドラー
 */
exports.handler = async (event) => {
  console.log(`🚀 xAuthFunction invoked:`, JSON.stringify({
    httpMethod: event.httpMethod,
    path: event.path,
    headers: Object.keys(event.headers || {}),
    hasBody: !!event.body
  }, null, 2));

  // CORS プリフライト対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    // リクエストボディの解析
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      console.error('❌ Invalid JSON body:', error);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON body'
        })
      };
    }

    const { code, state, redirectUri, codeVerifier, userId } = body;
    
    console.log('🔄 Processing X token exchange...');
    console.log('📝 Request params:', {
      hasCode: !!code,
      hasState: !!state,
      hasCodeVerifier: !!codeVerifier,
      hasUserId: !!userId,
      redirectUri: redirectUri
    });

    // 必須パラメータチェック
    if (!code) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Authorization code is required'
        })
      };
    }

    if (!codeVerifier) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Code verifier is required for PKCE'
        })
      };
    }

    // 環境変数確認
    const X_CLIENT_ID = process.env.X_CLIENT_ID;
    const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;

    console.log('🔑 Environment variables check:', {
      hasClientId: !!X_CLIENT_ID,
      hasClientSecret: !!X_CLIENT_SECRET,
      clientIdLength: X_CLIENT_ID?.length || 0
    });

    if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
      console.error('❌ Missing X API credentials');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'X API credentials not configured'
        })
      };
    }

    // Step 1: X API トークン交換
    console.log('🔐 Step 1: X API token exchange...');
    
    const tokenRequestData = querystring.stringify({
      grant_type: 'authorization_code',
      client_id: X_CLIENT_ID,
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    });

    const tokenOptions = {
      hostname: 'api.twitter.com',
      path: '/2/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Length': Buffer.byteLength(tokenRequestData)
      }
    };

    const tokenResponse = await httpsRequest(tokenOptions, tokenRequestData);
    
    console.log('📊 Token exchange response:', {
      statusCode: tokenResponse.statusCode,
      hasAccessToken: !!(tokenResponse.data && tokenResponse.data.access_token)
    });

    if (tokenResponse.statusCode !== 200) {
      console.error('❌ Token exchange failed:', {
        statusCode: tokenResponse.statusCode,
        response: tokenResponse.data
      });
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Token exchange failed'
        })
      };
    }

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Step 1: Access token obtained successfully');

    // Step 2: X ユーザープロフィール取得
    console.log('👤 Step 2: Fetching X user profile...');
    
    const userOptions = {
      hostname: 'api.twitter.com',
      path: '/2/users/me?user.fields=profile_image_url',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };

    const userResponse = await httpsRequest(userOptions);
    
    console.log('📊 User profile response:', {
      statusCode: userResponse.statusCode,
      hasUserData: !!(userResponse.data && userResponse.data.data)
    });

    if (userResponse.statusCode !== 200) {
      console.error('❌ User profile fetch failed:', {
        statusCode: userResponse.statusCode,
        response: userResponse.data
      });
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'User profile fetch failed'
        })
      };
    }

    const user = userResponse.data.data;
    console.log('✅ Step 2: User profile fetched successfully:', {
      id: user.id,
      name: user.name,
      username: user.username,
      hasProfileImage: !!user.profile_image_url
    });

    // 成功レスポンス
    const responseData = {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        profileImageUrl: user.profile_image_url || null
      }
    };

    console.log('🎉 X authentication completed successfully for user:', user.name);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('❌ Lambda execution error:', {
      message: error.message,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};