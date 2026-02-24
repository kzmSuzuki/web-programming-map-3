# Ticket 05: ノード状態表現とNotion遷移

## 目的
ノード状態に応じた見た目とクリック挙動を実装する。

## スコープ
- `initial / active / cleared` の色分け
- `Basic / Advanced` の視覚区別
- `active`/`cleared` ノードクリックでNotionを新規タブ表示
- `initial` ノードのクリック無効化

## ToDo
- [x] ノード状態ごとのスタイルを実装
- [x] `level` バッジまたはラベルを追加
- [x] クリック可能条件を状態で制御
- [x] Notion URL を `window.open(..., '_blank')` で開く
- [x] ロック状態の視覚表現を追加

## 完了条件
- 状態ごとに見た目が明確に異なる
- `initial` ノードは開けず、`active/cleared` は開ける

## 依存
- Ticket 04
