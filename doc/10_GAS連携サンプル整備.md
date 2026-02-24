# Ticket 10: GAS連携サンプル整備

## 目的
Google Form送信を起点に進捗を`cleared`へ更新し、後続ノードを`active`化する運用を整える。

## スコープ
- Formごとの `NODE_ID` 切替前提のGASサンプル整備
- Firestore更新処理
- 後続ノード有効化ロジック
- 導入手順ドキュメント

## ToDo
- [x] `onFormSubmit` を含むGASサンプルを作成
- [x] サービスアカウントJWTでアクセストークン取得処理を整理
- [x] `users/{email}/progress/{nodeId}` 更新処理を実装
- [x] `predecessorId` ベースの後続ノード有効化処理を実装
- [x] Formごとの設定手順（`NODE_ID`差し替え）をドキュメント化

## 完了条件
- フォーム送信で対象ノードが`cleared`になる
- 条件を満たす後続ノードが`active`になる

## 依存
- Ticket 02
- Ticket 06
