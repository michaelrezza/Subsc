import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Octokit } from '@octokit/rest';

// Parse the service account JSON from GitHub Secrets
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || process.env.PERSONAL_ACCESS_TOKEN,
});

const owner = 'michaelrezza';
const repo = 'WoW-Go'; // اگر ریپو چیز دیگه‌ایه، اینو عوض کن
const branch = 'main';

async function cleanExpiredSubscriptions() {
  const now = new Date();
  const snapshot = await db.collection('subscriptions').get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
    const status = data.status;

    if (expiresAt < now || status !== 'active') {
      const fileUrl = data.url;
      const pathParts = fileUrl.split(`/refs/heads/${branch}/`)[1];
      if (!pathParts) continue;

      const filePath = pathParts;

      try {
        const fileInfo = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: branch,
        });

        const sha = fileInfo.data.sha;

        await octokit.repos.deleteFile({
          owner,
          repo,
          path: filePath,
          message: `Delete expired subscription: ${filePath}`,
          sha,
          branch,
        });

        await db.collection('subscriptions').doc(doc.id).delete();

        console.log(`Deleted expired subscription: ${filePath}`);
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error.message);
      }
    }
  }
}

cleanExpiredSubscriptions().catch(err => {
  console.error("Cleaning process failed:", err);
});