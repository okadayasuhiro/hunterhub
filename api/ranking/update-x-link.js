/**
 * ランキング更新 Lambda関数
 * X連携解除時にDynamoDBの既存ランキングレコードを更新
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  console.log('📝 Ranking update request:', JSON.stringify(event, null, 2));

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  try {
    const { userId, action } = JSON.parse(event.body);

    if (!userId || action !== 'unlink_x') {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: 'Invalid request parameters'
        })
      };
    }

    console.log(`🔄 Processing X unlink for user: ${userId.substring(0, 8)}...`);

    // 全てのゲームタイプのランキングテーブルを更新
    const gameTypes = ['reflex', 'target', 'sequence'];
    let totalUpdatedRecords = 0;

    for (const gameType of gameTypes) {
      const tableName = `HunterHub-${gameType}-rankings`;
      
      try {
        // 該当ユーザーのランキングレコードを検索
        const scanParams = {
          TableName: tableName,
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        };

        const scanResult = await dynamodb.scan(scanParams).promise();
        console.log(`📊 Found ${scanResult.Items.length} records in ${tableName}`);

        // 各レコードのX連携情報を削除
        for (const item of scanResult.Items) {
          const updateParams = {
            TableName: tableName,
            Key: {
              userId: item.userId,
              timestamp: item.timestamp
            },
            UpdateExpression: 'REMOVE xDisplayName, xProfileImageUrl SET xLinked = :false',
            ExpressionAttributeValues: {
              ':false': false
            }
          };

          await dynamodb.update(updateParams).promise();
          totalUpdatedRecords++;
          
          console.log(`✅ Updated record: ${item.userId.substring(0, 8)}... at ${item.timestamp}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${tableName}:`, error);
        // 他のテーブルの処理は継続
      }
    }

    console.log(`🎉 Total updated records: ${totalUpdatedRecords}`);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        updatedRecords: totalUpdatedRecords
      })
    };

  } catch (error) {
    console.error('❌ Lambda execution error:', error);
    
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        updatedRecords: 0
      })
    };
  }
};
