import firebase from "firebase-admin";
import { ServiceAccount } from "firebase-admin";
import keys from "../firebase.json";

if (!firebase.apps.length) {
  firebase.initializeApp({
    credential: firebase.credential.cert(keys as ServiceAccount),
  });
}

export default firebase;
