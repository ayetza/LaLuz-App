// lib/firebase.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB0M0Cu05j0PW1sEOTH8hdU8Efthm7RLPU",
  authDomain: "laluz-app-5f71b.firebaseapp.com",
  projectId: "laluz-app-5f71b",
  storageBucket: "laluz-app-5f71b.firebasestorage.app",
  messagingSenderId: "305415036972",
  appId: "1:305415036972:web:73965036eae682cf1df189"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };
