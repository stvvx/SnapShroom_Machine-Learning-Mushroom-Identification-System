
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC-83opsnCjYJbsOwJE3v_dtFbMIfu0QXE",
  authDomain: "snapshroom-1e01e.firebaseapp.com",
  projectId: "snapshroom-1e01e",
  storageBucket: "snapshroom-1e01e.appspot.com",
  messagingSenderId: "1098545643387",
  appId: "1:1098545643387:web:f5fac5bdbcc33805ab47de"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);