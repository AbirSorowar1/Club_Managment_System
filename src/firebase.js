import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCoImM-eczjl0vRl74QkA4BSOwvurWthWk",
    authDomain: "club-managment-system-a8b97.firebaseapp.com",
    databaseURL: "https://club-managment-system-a8b97-default-rtdb.firebaseio.com",
    projectId: "club-managment-system-a8b97",
    storageBucket: "club-managment-system-a8b97.firebasestorage.app",
    messagingSenderId: "167850558434",
    appId: "1:167850558434:web:42850bc1b060c363ceefbb",
    measurementId: "G-SEZ06JB6WK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
