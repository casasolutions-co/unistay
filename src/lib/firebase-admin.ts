import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | undefined;

function getAdminApp(): App {
  if (!app) {
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID env var is not set');
    }
    app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
  }
  return app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

// Lazy proxy so existing imports still work without changing call sites
export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    return getAdminAuth()[prop as keyof Auth];
  },
});
