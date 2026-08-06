import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const environment = {
  production: true,
  firebaseConfig: {
    apiKey: "AIzaSyBTxcogz01HMruIuFwxGKxohrd7OZn0TrU",
    authDomain: "chats-f56f1.firebaseapp.com",
    projectId: "chats-f56f1",
    storageBucket: "chats-f56f1.firebasestorage.app",
    messagingSenderId: "37690167915",
    appId: "1:37690167915:web:2d6cbcb39fbb2b5f19d72e"
  }
};

export const app = initializeApp(environment.firebaseConfig);
export const db = getFirestore(app);
