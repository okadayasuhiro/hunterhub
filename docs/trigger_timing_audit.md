# Trigger Timing ランキング/DB 棚卸しメモ

- 現状経路（保存系）
  - `src/pages/TriggerTimingPage.tsx`
    - ゲーム終了時に `CloudRankingService.getInstance().submitScore('trigger-timing', finalTotal)` を実行
    - 同時に `GameHistoryService.getInstance().saveGameHistory('trigger-timing', history)` を実行
  - `src/services/cloudRankingService.ts`
    - `submitScore(gameType, score)` が `createGameScore` Mutation を実行（`metadata` 等はスキーマ未対応のため送信せず）
  - `src/services/gameHistoryService.ts`
    - `saveGameHistory` が `createGameHistory` Mutation を実行（details にJSON保存）

- 現状経路（取得系）
  - `src/components/GameRankingTable.tsx`
    - `HybridRankingService.getInstance().getRankings(gameType, 10)` を呼び、上位10件を表示
    - `CloudRankingService.getRankings` は GraphQL で `listGameScores` を全走査し、クライアント側でソート

- 主要仕様と問題点
  - ランキングの優劣
    - Reflex/Target/Sequence: 値が小さいほど上位
    - Trigger Timing: 値が大きいほど上位（ポイント制）
  - 問題: `cloudRankingService.sortScoresByGameType` が全ゲームで昇順（小さいほど上位）になっており、Trigger Timing で逆になっていた
  - 問題: `getCurrentScoreRank`/`getCurrentScoreRankOptimized` の「より良いスコア判定」が Trigger Timing を考慮していなかった（小さい方が良い前提）

- 本コミットでの修正
  - `sortScoresByGameType` をゲームタイプ別に分岐
    - Trigger Timing は降順（大きいほど上位）
  - 現在スコアの順位計算ロジックをゲームタイプ別に分岐
    - Trigger Timing は `score > currentScore` を「上位」と判定
    - Top10 閾値判定も `>=` に変更
  - 結果画面に `GameRankingTable` を統合し、Trigger Timing の上位10を表示

- 残課題（別TODO）
  - 週間ランキング対応（集計キー: `weekKey` などの導入、GSI 設計）
  - 「自分の順位」軽量クエリ（Count 専用 + Top10 参照のハイブリッド）を週次集計に最適化
  - Amplify/AppSync/DynamoDB のスキーマ/インデックス整備と本番反映
  - 既存データのバックフィル計画（週次キー生成）
