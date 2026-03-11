import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("customerPhone", "==", "123456"), where("channel", "==", "instagram"));
    const querySnapshot = await getDocs(q);
    console.log("Success:", querySnapshot.empty);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();
