import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../utils/firebase";

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "songs"));
    const songs = querySnapshot.docs.map(doc => doc.data());
    return new Response(JSON.stringify(songs), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Firebase fetch error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch songs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
      error: error.message,
    });
  }
}
