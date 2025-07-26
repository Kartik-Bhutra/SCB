import firebase, { ServiceAccount } from "firebase-admin";
import keys from "../firebase.json";

if (!firebase.apps.length) {
  firebase.initializeApp({
    credential: firebase.credential.cert(keys as ServiceAccount),
  });
}

export const admin = firebase;
export const auth = firebase.auth();
export const messanger = firebase.messaging();
