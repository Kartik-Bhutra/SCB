import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT || "{}");

const firebaseAdmin = !getApps().length
  ? initializeApp({ credential: cert(serviceAccount) })
  : getApp();

const messaging = getMessaging(firebaseAdmin);

export { messaging };
