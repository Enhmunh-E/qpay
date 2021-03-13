import firebase from 'firebase'
import 'firebase/firestore'
import 'firebase/storage'
import 'firebase/auth'
firebase.initializeApp ({
    apiKey: "AIzaSyC-bDCpfJkNJHUNYw0GwXCBlE3IbhS6-Zg",
    authDomain: "app-1-56fa0.firebaseapp.com",
    projectId: "app-1-56fa0",
    storageBucket: "app-1-56fa0.appspot.com",
    messagingSenderId: "3715170376",
    appId: "1:3715170376:web:01fe0c683edc92159d587d",
    measurementId: "G-QJ6SZ429GR"
});
  // Initialize Firebase
let auth = firebase.auth();
let db = firebase.firestore();
export { firebase, db, auth }