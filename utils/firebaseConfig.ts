import { getApps, initializeApp } from "firebase/app";
import {
    doc,
    getDoc,
    getFirestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAI2-FCmWHJY5ZXBYKgUqGiX2Bf4bQMSJQ",
  authDomain: "notes-app-59abe.firebaseapp.com",
  projectId: "notes-app-59abe",
  storageBucket: "notes-app-59abe.firebasestorage.app",
  messagingSenderId: "29560446221",
  appId: "1:29560446221:web:8b54ff7cfb626bd6a36444",
  measurementId: "G-1FR9C49MR2"
};

// live data
// const firebaseConfig = {
//   apiKey: "AIzaSyBvCx7x8KR_avnavFvb-E-jMrA1_E8hsEo",
//   authDomain: "calendar-app-ba9d6.firebaseapp.com",
//   projectId: "calendar-app-ba9d6",
//   storageBucket: "calendar-app-ba9d6.firebasestorage.app",
//   messagingSenderId: "557672501111",
//   appId: "1:557672501111:web:7f5c9952b3fa3fd9849b72",
//   measurementId: "G-PSLGEMZW9G"
// };

// Initialize Firebase Only Once
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

const db = getFirestore(app);

// ------------------------------
//  FETCH APP CONFIG FROM FIRESTORE
// ------------------------------

export async function fetchAppConfig() {
  try {
    const ref = doc(db, "configs", "app_config"); 
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      console.log("Firestore Config Loaded:", data);
      return data;
    } else {
      console.log("No config document found!");
      return null;
    }
  } catch (error) {
    console.log("Firestore Config Fetch Failed:", error);
    return null;
  }
}
