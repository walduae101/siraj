import { NextRequest, NextResponse } from "next/server";
import { loadServerEnv } from "~/env-server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import OpenAI from "openai";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { chatId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const messagesRef = db
      .collection("users")
      .doc(userId)
      .collection("chats")
      .doc(chatId)
      .collection("messages");
      
    const snapshot = await messagesRef.orderBy("createdAt", "asc").get();
    
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }));

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { userId, content, role = "user" } = await request.json();
    const { chatId } = await params;
    
    if (!userId || !content) {
      return NextResponse.json(
        { error: "userId and content are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const messageData = {
      content,
      role,
      createdAt: now,
      chatId,
    };

    const messageRef = await db
      .collection("users")
      .doc(userId)
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .add(messageData);

    // Update chat's message count and updatedAt
    await db
      .collection("users")
      .doc(userId)
      .collection("chats")
      .doc(chatId)
      .update({
        messageCount: (await db
          .collection("users")
          .doc(userId)
          .collection("chats")
          .doc(chatId)
          .collection("messages")
          .get()).size,
        updatedAt: now,
      });

    // If this is a user message, generate assistant response
    if (role === "user") {
      // Generate assistant response asynchronously
      generateAssistantResponse(userId, chatId, content).catch(console.error);
    }

    return NextResponse.json({
      id: messageRef.id,
      ...messageData,
    });
  } catch (error) {
    console.error("Failed to create message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

async function generateAssistantResponse(userId: string, chatId: string, userMessage: string) {
  try {
    const env = await loadServerEnv();
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    // Get conversation history
    const messagesRef = db
      .collection("users")
      .doc(userId)
      .collection("chats")
      .doc(chatId)
      .collection("messages");
      
    const snapshot = await messagesRef.orderBy("createdAt", "asc").get();
    const conversationHistory = snapshot.docs.map(doc => ({
      role: doc.data().role,
      content: doc.data().content,
    }));

    // Add system message for Arabic context
    const messages = [
      {
        role: "system" as const,
        content: "أنت مساعد ذكي يتحدث العربية بطلاقة. يجب أن تكون إجاباتك مفيدة ودقيقة ومكتوبة باللغة العربية.",
      },
      ...conversationHistory,
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    
    if (assistantResponse) {
      const now = new Date();
      const messageData = {
        content: assistantResponse,
        role: "assistant",
        createdAt: now,
        chatId,
      };

      await messagesRef.add(messageData);

      // Update chat's message count and updatedAt
      await db
        .collection("users")
        .doc(userId)
        .collection("chats")
        .doc(chatId)
        .update({
          messageCount: (await messagesRef.get()).size,
          updatedAt: now,
        });
    }
  } catch (error) {
    console.error("Failed to generate assistant response:", error);
  }
}
