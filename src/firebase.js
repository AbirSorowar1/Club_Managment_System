import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBiHJKxJi32u98aw7NgBhJh4A_X3Hcp85Y",
    authDomain: "independent-club.firebaseapp.com",
    databaseURL: "https://independent-club-default-rtdb.firebaseio.com",
    projectId: "independent-club",
    storageBucket: "independent-club.firebasestorage.app",
    messagingSenderId: "705336834856",
    appId: "1:705336834856:web:4e3499aa1cc30fe257ee1d",
    measurementId: "G-7MGRXEBT8M"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
