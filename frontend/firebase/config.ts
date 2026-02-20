import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCIDvWHJCv7k3c0RLg14aBFj1AnmDWrvBc",
  authDomain: "snapshroom-39671.firebaseapp.com",
  projectId: "snapshroom-39671",
  storageBucket: "snapshroom-39671.firebasestorage.app",
  messagingSenderId: "439538035488",
  appId: "1:439538035488:web:6c69faac08c13c637fc545",
  measurementId: "G-EHFW3QK0MQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
