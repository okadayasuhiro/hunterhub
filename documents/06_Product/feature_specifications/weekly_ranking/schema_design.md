# 週間ランキング スキーマ/インデックス設計（提案）

目的: 各ゲームの週間ランキング（東京タイムゾーンのISO週単位）を高速に取得し、トップ10と「自分の順位」を軽量に返す。

## 1. 追加フィールド/正規化
- GameScore テーブル（既存）へ以下を追加（書き込み時に算出）
  - weekKey: `YYYY-WW`（例: `2025-37`。東京のISO週）
  - sortScore: 数値。ソート用の正規化スコア
    - reflex/target/sequence: 小さいほど上位 → `sortScore = score`
    - trigger-timing: 大きいほど上位 → `sortScore = -score`（昇順で上位）

備考: 既存の総合ランキングは引き続き `listGameScores` 全走査でも可。週間ではGSI利用で負荷削減。

## 2. GSI 設計
- GSI: byGameWeek
  - partitionKey: `gameType` + `#` + `weekKey`（例: `trigger-timing#2025-37`）
  - sortKey: `sortScore`（Number, 昇順）
  - 投影: 必要最小限（userId, score, timestamp）

- GSI: byUserWeek（自分の順位を軽量取得）
  - partitionKey: `userId` + `#` + `gameType` + `#` + `weekKey`
  - sortKey: `sortScore`
  - 用途: 最新スコアの確認・自己ベスト検索（週次）

## 3. 書き込み時（Amplify/AppSync）
- クライアントで `getCurrentWeekInfoTokyo()` から `weekKey` を算出
- `sortScore` をゲームタイプ毎に決定
- `createGameScore` に `weekKey` と `sortScore` を付与

## 4. 取得クエリ
- 週間トップ10
  - Query: GSI `byGameWeek` を `limit=10` 昇順で取得
  - trigger-timing は `sortScore` を `-score` で保存しているため、そのまま昇順で上位

- 自分の順位（軽量）
  - `byGameWeek` の上位10を取得して閾値（10位の `sortScore`）を確認
  - 10位以内なら、上位配列内で `sortScore` と比較しランク算出
  - 圏外なら Count 最適化：`byGameWeek` を `limit` 大きめ×ページネーションし、`sortScore < currentSortScore` の件数を集約（AppSync resolver/VTLで集計 or Lambda resolver）
  - 返却: `{ rank?: number|null, totalPlayers, isTop10, top10Threshold?: number }`

## 5. バックフィル
- 既存データに `weekKey` と `sortScore` を付与するバッチ（Lambda）
  - `listGameScores` 全走査
  - `weekKey` を東京ISO週で再計算
  - `sortScore` を再計算
  - `updateGameScore` で部分更新

## 6. 影響範囲
- フロント: 書き込み時の `weekKey/sortScore` 付与、週間ランキング/自己順位のクエリ切替
- バックエンド: スキーマ拡張、GSI追加、バックフィル用Lambdaとジョブ実行

## 7. メモ
- 曜日境界はアプリ共通の `Asia/Tokyo` に固定（`utils/week.ts` 既存）
- 週番号はISO週を使用（年跨ぎの整合性担保）
