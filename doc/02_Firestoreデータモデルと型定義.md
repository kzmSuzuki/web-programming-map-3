# Ticket 02: Firestoreデータモデルと型定義

## 目的
FirestoreスキーマとTypeScript型を一致させ、後続実装の土台を作る。

## スコープ
- `nodes`、`users/{email}/progress`、`config/admins` の型定義
- 状態遷移用のユニオン型整備
- Firestore入出力時の変換関数の準備

## ToDo
- [x] `Node` 型（`id`、`label`、`notionUrl`、`predecessorId`、`level`）を定義
- [x] `Progress` 型（`state`、`clearedAt`）を定義
- [x] `AdminConfig` 型を定義
- [x] `NodeState`（`initial | active | cleared`）を定義
- [x] Firestore Document <-> App Model の変換処理を作成

## 完了条件
- 型定義だけで主要コレクションの構造が表現できる
- 変換関数を利用して読み書きの型安全性が担保される

## 依存
- Ticket 01
