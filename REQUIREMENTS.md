# スキルマップ可視化アプリ 要件定義書

## プロジェクト概要

大学の授業（Web Programming）用のスキルマップ可視化Webアプリケーションを新規作成する。学習ノードをReact Flowでグラフ表示し、各ノードにはNotionページが紐付く。学生はノードをクリアしていくことで次のノードがアンロックされるスキルツリー型の学習管理システムである。

---

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | React 19 + TypeScript |
| ビルドツール | Vite |
| グラフ描画 | React Flow（`@xyflow/react`） |
| グラフレイアウト | dagre（決定的レイアウト） |
| 認証 | Firebase Authentication（Googleログイン） |
| データベース | Cloud Firestore |
| ホスティング | Firebase Hosting |
| スタイリング | CSS Modules または Tailwind CSS（モダンなもの） |

---

## Firestoreデータモデル

### ノード定義（全ユーザー共通）

```
nodes/{nodeId}
  - id: string                    # 一意のID
  - label: string                 # ノード名（表示用）
  - notionUrl: string             # NotionページのURL
  - predecessorId: string | null  # 前提ノードのID（ルートノードはnull）
  - level: "basic" | "advanced"   # Basic（必修）/ Advanced（任意）
```

### ユーザーごとの進捗

```
users/{email}/progress/{nodeId}
  - state: "initial" | "active" | "cleared"
  - clearedAt: Timestamp | null   # クリアした日時（社会的可視化に使用）
```

### 管理者メールリスト

```
config/admins
  - emails: string[]              # 管理者のメールアドレス配列
```

---

## ノードの状態遷移

```
initial（ロック） → active（アンロック） → cleared（クリア済み）
```

- **initial → active**：前提ノード（`predecessorId`で指定）を `cleared` にすると自動的にアンロック。ルートノード（`predecessorId` が `null`）は最初から `active`。
- **active → cleared**：Google Formの送信をトリガーとして、GAS経由でFirestoreを更新。
- **管理者による手動変更**：管理者UIから任意のユーザーの任意のノード状態を変更可能。

---

## 画面構成

### 1. ログイン画面

- Googleログインボタンを表示
- Firebase AuthenticationのGoogleプロバイダでログイン
- 未認証ユーザーはログイン画面にリダイレクト

### 2. 学生画面（メイン画面）

- **ヘッダー**：ユーザー名（またはメールアドレス）、ログアウトボタン
- **メインエリア**：React Flowによるスキルマップグラフ

#### ノード表示

- 状態ごとに色分け（ライトグレー系のカラーテーマ）
  - `initial`：暗いグレー（ロック状態を示す）
  - `active`：アクセントカラー（オレンジ/アンバー系）
  - `cleared`：明るい白/ライトグレー
- `level` の表示：`Basic` と `Advanced` を視覚的に区別（ラベルやバッジ等）
- **他の学生の到達状況の可視化**：
  - 各学生の「最後にクリアしたノード」（`clearedAt` が最新のノード）を集計
  - **自分自身は含めず**、他の学生のみを対象
  - そのノードに到達している学生数に応じて、ノードに**光彩（glow / box-shadow）** をつける
  - 学生数が多いほど glow が大きく/明るくなる

#### エッジ表示

- `predecessorId` → `nodeId` の方向に矢印付きエッジ

#### レイアウト

- dagre アルゴリズムで自動配置（読み込むたびに同じ位置になる決定的レイアウト）

#### インタラクション

- `active` または `cleared` のノードをクリック → 紐付くNotionページを新しいタブで開く
- `initial` のノードはクリック不可（視覚的にもロック状態であることを示す）

#### 規模

- ノード数は50〜60程度を想定

### 3. 管理者画面（`/admin` ルート）

#### アクセス制御

- Firestoreの `config/admins` に登録されたメールアドレスのユーザーのみアクセス可能
- それ以外のユーザーはメイン画面にリダイレクト

#### 機能A：ノード管理（CRUD）

- フォーム/テーブル形式でノードを一覧表示
- 各ノードの現在のステータスがわかるように表示
- ノードの新規作成：`label`、`notionUrl`、`predecessorId`、`level` を入力
- ノードの編集：既存ノードのフィールドを変更
- ノードの削除

#### 機能B：学生進捗管理

- 受講生一覧を表示
- 各受講生のノード進捗状況を一覧表示（どのノードがどの状態か）
- 特定の学生の特定のノード状態を手動で変更（`initial` ↔ `active` ↔ `cleared`）

---

## UIデザイン方針

- **カラーテーマ**：ライトグレー系
  - 背景：`#f0f0f0` 〜 `#e8e8e8` 程度のライトグレー
  - カード/ノード：白ベース、薄いシャドウ
  - テキスト：ダークグレー〜ブラック
  - アクセント：控えめな色（オレンジ/アンバー系をノードの active 状態に使用）
- **フォント**：モダンなサンセリフ体（Inter, Noto Sans JP 等）
- **ノードデザイン**：角丸のカード型、クリーンでミニマル
- **サイドバーなし**：ヘッダー + メインコンテンツのシンプルなレイアウト
- **レスポンシブ**：デスクトップ優先だが、タブレット程度まで対応

---

## Google Form / GAS連携

### 概要

- 各ノードにはそれぞれ別のGoogle Formが紐付く
- 各FormにはGASのトリガー（`onFormSubmit`）が設定される
- GASはFirebase Admin SDK（サービスアカウント）を使ってFirestoreに書き込む

### GASの処理フロー

1. フォーム送信時に `onFormSubmit` が発火
2. 回答からメールアドレスを取得（Formの「メールアドレスを収集」設定を使用）
3. Firestoreの `users/{email}/progress/{nodeId}` を更新（`state` を `"cleared"`、`clearedAt` を現在時刻に設定）
4. 前提ノードとして参照しているノードがあれば、そのノードの `state` を `"active"` に更新（初期化がまだの場合）

### サンプルGASコード

各Formごとに `NODE_ID` を設定して使用する形式のサンプルコードを提供すること。

```javascript
// === 設定 ===
const NODE_ID = "node_xxx"; // このFormに対応するノードID
const FIREBASE_PROJECT_ID = "your-project-id";
const SERVICE_ACCOUNT_EMAIL = "your-service-account@your-project.iam.gserviceaccount.com";
const SERVICE_ACCOUNT_KEY = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n";

/**
 * フォーム送信時のトリガー
 */
function onFormSubmit(e) {
  const email = e.response.getRespondentEmail();
  if (!email) {
    console.error("メールアドレスが取得できませんでした");
    return;
  }

  const firestore = getFirestore();
  const now = new Date().toISOString();

  // 該当ノードを cleared に更新
  updateDocument(firestore, `users/${email}/progress/${NODE_ID}`, {
    state: "cleared",
    clearedAt: now,
  });

  // 後続ノードを active に更新（predecessorId が NODE_ID のノードを検索）
  activateSuccessorNodes(firestore, email, NODE_ID);
}

/**
 * Firestoreアクセストークンを取得
 */
function getFirestore() {
  const token = ScriptApp.getOAuthToken();
  return {
    projectId: FIREBASE_PROJECT_ID,
    token: getFirebaseAccessToken(),
  };
}

/**
 * サービスアカウントでFirebase Access Tokenを取得
 */
function getFirebaseAccessToken() {
  const jwt = createJwt(SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_KEY);
  const response = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    },
  });
  return JSON.parse(response.getContentText()).access_token;
}

/**
 * JWTを作成
 */
function createJwt(email, key) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64Header = Utilities.base64EncodeWebSafe(JSON.stringify(header));
  const base64Payload = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  const signatureInput = `${base64Header}.${base64Payload}`;

  const signature = Utilities.computeRsaSha256Signature(
    signatureInput,
    key
  );
  const base64Signature = Utilities.base64EncodeWebSafe(signature);

  return `${base64Header}.${base64Payload}.${base64Signature}`;
}

/**
 * Firestoreドキュメントを更新
 */
function updateDocument(firestore, path, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${firestore.projectId}/databases/(default)/documents/${path}`;

  const fields = {};
  for (const key in data) {
    if (typeof data[key] === "string") {
      fields[key] = { stringValue: data[key] };
    }
  }

  UrlFetchApp.fetch(url + "?updateMask.fieldPaths=" + Object.keys(data).join("&updateMask.fieldPaths="), {
    method: "patch",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${firestore.token}` },
    payload: JSON.stringify({ fields }),
  });
}

/**
 * 後続ノード（predecessorId が clearedNodeId のノード）を active にする
 */
function activateSuccessorNodes(firestore, email, clearedNodeId) {
  const url = `https://firestore.googleapis.com/v1/projects/${firestore.projectId}/databases/(default)/documents:runQuery`;

  const query = {
    structuredQuery: {
      from: [{ collectionId: "nodes" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "predecessorId" },
          op: "EQUAL",
          value: { stringValue: clearedNodeId },
        },
      },
    },
  };

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${firestore.token}` },
    payload: JSON.stringify(query),
  });

  const results = JSON.parse(response.getContentText());
  for (const result of results) {
    if (result.document) {
      const successorNodeId = result.document.fields.id.stringValue;
      // 後続ノードの進捗が initial の場合のみ active に変更
      try {
        const progressUrl = `https://firestore.googleapis.com/v1/projects/${firestore.projectId}/databases/(default)/documents/users/${email}/progress/${successorNodeId}`;
        const existing = UrlFetchApp.fetch(progressUrl, {
          headers: { Authorization: `Bearer ${firestore.token}` },
          muteHttpExceptions: true,
        });

        if (existing.getResponseCode() === 200) {
          const doc = JSON.parse(existing.getContentText());
          if (doc.fields && doc.fields.state && doc.fields.state.stringValue === "initial") {
            updateDocument(firestore, `users/${email}/progress/${successorNodeId}`, {
              state: "active",
              clearedAt: "",
            });
          }
        }
      } catch (e) {
        console.error(`Error activating successor node ${successorNodeId}:`, e);
      }
    }
  }
}
```

---

## Firebaseセキュリティルール（Firestore）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ノード定義：認証済みユーザーは読み取り可、管理者のみ書き込み可
    match /nodes/{nodeId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ユーザー進捗：本人のみ読み取り可、管理者は全員分読み書き可
    // GASはAdmin SDKを使うのでルール適用外
    match /users/{email}/progress/{nodeId} {
      allow read: if request.auth.token.email == email || isAdmin();
      allow write: if isAdmin();
    }

    // 全ユーザーの進捗読み取り（他の学生の到達状況の可視化用）
    // 認証済みユーザーは他の学生の進捗も読み取り可能（集計用）
    match /users/{email}/progress/{nodeId} {
      allow read: if request.auth != null;
    }

    // 管理者設定：認証済みユーザーは読み取り可（自身が管理者か判定するため）、書き込みは管理者のみ
    match /config/{document} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    function isAdmin() {
      return request.auth != null &&
        request.auth.token.email in get(/databases/$(database)/documents/config/admins).data.emails;
    }
  }
}
```

---

## ルーティング

| パス | 画面 | アクセス権 |
|------|------|-----------|
| `/` | ログイン画面（未認証時）/ グラフ画面（認証済み時） | 全員 |
| `/admin` | 管理者画面 | 管理者のみ |

React Router を使用。

---

## プロジェクト構成

```
src/
├── components/
│   ├── common/          # 共通コンポーネント（Header, ProtectedRoute 等）
│   ├── graph/           # React Flow関連（CustomNode, GraphView 等）
│   ├── admin/           # 管理者画面コンポーネント
│   └── auth/            # ログイン関連
├── hooks/               # カスタムフック（useAuth, useNodes, useProgress 等）
├── firebase/            # Firebase初期化、Firestoreアクセス関数
├── types/               # TypeScript型定義
├── pages/               # ページコンポーネント（StudentPage, AdminPage）
├── utils/               # ユーティリティ（レイアウト計算等）
├── App.tsx
├── main.tsx             # Viteエントリーポイント
└── index.css
```

---

## デプロイ

- Vite でビルド（`dist` ディレクトリ出力）
- Firebase Hosting 設定（`firebase.json`）で `dist` を公開ディレクトリに指定
- SPA 用リライト設定を含める

---

## 非機能要件

- ノード数50〜60で快適に動作すること
- dagre レイアウトは決定的（同じデータなら毎回同じ位置）
- Firestore のリアルタイムリスナー（`onSnapshot`）を使用し、ノード状態の変更がリアルタイムに反映されること
