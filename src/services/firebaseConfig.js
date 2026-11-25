import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCtAXrdpg16IiBUIuH1SnsIq1zTmbeqYc",
  authDomain: "smart-parking-hub.firebaseapp.com",
  projectId: "smart-parking-hub",
  storageBucket: "smart-parking-hub.firebasestorage.app",
  messagingSenderId: "757901910966",
  appId: "1:757901910966:web:430b954a71bcc2b3e49717",
  measurementId: "G-DTJX5THNTY"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ (Auth và Database)
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
