import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import {
    getFirestore,
    serverTimestamp
} from "firebase/firestore";

import { getStorage } from "firebase/storage";

import { getFunctions } from "firebase/functions";

const firebaseConfig = {

    apiKey: "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU",

    authDomain: "horecaapp-e16cf.firebaseapp.com",

    projectId: "horecaapp-e16cf",

    storageBucket: "horecaapp-e16cf.firebasestorage.app",

    messagingSenderId: "1033337228120",

    appId: "1:1033337228120:web:549fee0fe3dd656845332d",

    measurementId: "G-Q36V58CL8C"
};

const app = initializeApp(firebaseConfig);

/**
 * AUTH
 */

export const auth = getAuth(app);

/**
 * FIRESTORE
 */

export const db = getFirestore(app);

export const firestore = getFirestore(app);

/**
 * STORAGE
 */

export const storage = getStorage(app);

/**
 * FUNCTIONS
 */

export const functions = getFunctions(app, "us-central1");


export { serverTimestamp };