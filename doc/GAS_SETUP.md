# GAS セットアップ手順

1. Google FormごとにApps Scriptを作成し、`scripts/gas-onFormSubmit.js` を貼り付ける。
2. `NODE_ID` をそのフォームに対応するノードIDへ変更する。
3. `FIREBASE_PROJECT_ID` / サービスアカウント情報を設定する。
4. トリガーで `onFormSubmit` を「フォーム送信時」に設定する。
5. テスト送信し、`users/{email}/progress/{nodeId}` が `cleared` へ更新されることを確認する。
