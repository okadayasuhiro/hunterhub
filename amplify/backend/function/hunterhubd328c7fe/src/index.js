
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
};

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: ''
        };
    }

    // ランキング更新エンドポイント
    if (event.path === '/ranking/update-x-link' && event.httpMethod === 'POST') {
        return await handleRankingUpdate(event);
    }

    // デフォルトレスポンス
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify('HunterHub Lambda Function'),
    };
};

/**
 * X連携解除時のランキング更新処理
 */
async function handleRankingUpdate(event) {
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

        // GameScoreテーブルとUserProfileテーブルを更新
        let totalUpdatedRecords = 0;
        
        try {
            // 1. GameScoreテーブルの更新
            const gameScoreTableName = process.env.API_HUNTERHUB_GAMESCORETABLE_NAME;
            if (gameScoreTableName) {
                console.log(`📊 Updating GameScore table: ${gameScoreTableName}`);
                
                const scanParams = {
                    TableName: gameScoreTableName,
                    FilterExpression: 'userId = :userId',
                    ExpressionAttributeValues: {
                        ':userId': userId
                    }
                };

                const scanResult = await dynamodb.scan(scanParams).promise();
                console.log(`📊 Found ${scanResult.Items.length} GameScore records`);

                // 各レコードのX連携情報を削除
                for (const item of scanResult.Items) {
                    const updateParams = {
                        TableName: gameScoreTableName,
                        Key: {
                            id: item.id
                        },
                        UpdateExpression: 'REMOVE xDisplayName, xProfileImageUrl SET xLinked = :false',
                        ExpressionAttributeValues: {
                            ':false': false
                        }
                    };

                    await dynamodb.update(updateParams).promise();
                    totalUpdatedRecords++;
                    
                    console.log(`✅ Updated GameScore record: ${item.id}`);
                }
            }

            // 2. UserProfileテーブルの更新
            const userProfileTableName = process.env.API_HUNTERHUB_USERPROFILETABLE_NAME;
            if (userProfileTableName) {
                console.log(`👤 Updating UserProfile table: ${userProfileTableName}`);
                
                const updateParams = {
                    TableName: userProfileTableName,
                    Key: {
                        id: userId
                    },
                    UpdateExpression: 'REMOVE xDisplayName, xProfileImageUrl SET xLinked = :false',
                    ExpressionAttributeValues: {
                        ':false': false
                    }
                };

                await dynamodb.update(updateParams).promise();
                totalUpdatedRecords++;
                
                console.log(`✅ Updated UserProfile: ${userId.substring(0, 8)}...`);
            }

        } catch (error) {
            console.error(`❌ Error updating tables:`, error);
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
}
