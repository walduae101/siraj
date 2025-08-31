import { NextRequest, NextResponse } from "next/server";
import { loadServerEnv } from "~/env-server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  const env = await loadServerEnv();
  try {
    if (env.FIREBASE_SERVICE_ACCOUNT_JSON && env.FIREBASE_SERVICE_ACCOUNT_JSON !== "{}") {
      const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      // Use default credentials (ADC)
      initializeApp({
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    // Fallback to default credentials
    initializeApp({
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const chatsRef = db.collection("users").doc(userId).collection("chats");
    const snapshot = await chatsRef.orderBy("createdAt", "desc").limit(50).get();
    
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, initialMessage } = await request.json();
    
    if (!userId || !title) {
      return NextResponse.json(
        { error: "userId and title are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const chatData = {
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };

    const chatRef = await db.collection("users").doc(userId).collection("chats").add(chatData);
    
    // If there's an initial message, add it
    if (initialMessage) {
      const messageData = {
        content: initialMessage,
        role: "user",
        createdAt: now,
        chatId: chatRef.id,
      };
      
      await chatRef.collection("messages").add(messageData);
      await chatRef.update({ messageCount: 1 });
    }

    return NextResponse.json({
      id: chatRef.id,
      ...chatData,
    });
  } catch (error) {
    console.error("Failed to create chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}
