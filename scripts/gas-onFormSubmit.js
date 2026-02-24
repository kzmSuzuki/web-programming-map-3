// === 設定 ===
const NODE_ID = 'node_xxx';
const FIREBASE_PROJECT_ID = 'your-project-id';
const SERVICE_ACCOUNT_EMAIL = 'your-service-account@your-project.iam.gserviceaccount.com';
const SERVICE_ACCOUNT_KEY = '-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n';

function onFormSubmit(e) {
  const email = e.response.getRespondentEmail();
  if (!email) {
    console.error('メールアドレスが取得できませんでした');
    return;
  }

  const firestore = getFirestore();
  const now = new Date().toISOString();

  updateDocument(firestore, `users/${email}/progress/${NODE_ID}`, {
    state: 'cleared',
    clearedAt: now,
  });

  activateSuccessorNodes(firestore, email, NODE_ID);
}

function getFirestore() {
  return {
    projectId: FIREBASE_PROJECT_ID,
    token: getFirebaseAccessToken(),
  };
}

function getFirebaseAccessToken() {
  const jwt = createJwt(SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_KEY);
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    },
  });
  return JSON.parse(response.getContentText()).access_token;
}

function createJwt(email, key) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64Header = Utilities.base64EncodeWebSafe(JSON.stringify(header));
  const base64Payload = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  const signatureInput = `${base64Header}.${base64Payload}`;
  const signature = Utilities.computeRsaSha256Signature(signatureInput, key);
  const base64Signature = Utilities.base64EncodeWebSafe(signature);
  return `${base64Header}.${base64Payload}.${base64Signature}`;
}

function updateDocument(firestore, path, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${firestore.projectId}/databases/(default)/documents/${path}`;
  const fields = {};

  Object.keys(data).forEach((key) => {
    if (typeof data[key] === 'string') {
      fields[key] = { stringValue: data[key] };
    }
  });

  UrlFetchApp.fetch(url + '?updateMask.fieldPaths=' + Object.keys(data).join('&updateMask.fieldPaths='), {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${firestore.token}` },
    payload: JSON.stringify({ fields }),
  });
}

function activateSuccessorNodes(firestore, email, clearedNodeId) {
  const url = `https://firestore.googleapis.com/v1/projects/${firestore.projectId}/databases/(default)/documents:runQuery`;
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'nodes' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'predecessorId' },
          op: 'EQUAL',
          value: { stringValue: clearedNodeId },
        },
      },
    },
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${firestore.token}` },
    payload: JSON.stringify(query),
  });

  const results = JSON.parse(response.getContentText());
  results.forEach((result) => {
    if (!result.document) {
      return;
    }

    const successorNodeId = result.document.fields.id.stringValue;
    const progressUrl = `https://firestore.googleapis.com/v1/projects/${firestore.projectId}/databases/(default)/documents/users/${email}/progress/${successorNodeId}`;
    const existing = UrlFetchApp.fetch(progressUrl, {
      headers: { Authorization: `Bearer ${firestore.token}` },
      muteHttpExceptions: true,
    });

    if (existing.getResponseCode() !== 200) {
      return;
    }

    const doc = JSON.parse(existing.getContentText());
    const state = doc.fields?.state?.stringValue;
    if (state === 'initial') {
      updateDocument(firestore, `users/${email}/progress/${successorNodeId}`, {
        state: 'active',
        clearedAt: '',
      });
    }
  });
}
