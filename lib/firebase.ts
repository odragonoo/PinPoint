import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCUuGBuOCmDOUMABciifaNjD4ezpML4En8",
  authDomain: "pinpoint-95107.firebaseapp.com",
  projectId: "pinpoint-95107",
  storageBucket: "pinpoint-95107.appspot.com",
  messagingSenderId: "896139017077",
  appId: "1:896139017077:ios:fdc8c5349806db94c2f13c",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);