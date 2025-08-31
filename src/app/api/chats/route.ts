import { NextResponse } from 'next/server';
import { admin } from '../../../server/firebase/admin';
import { requireUser } from '../../../server/auth/requireUser';

export async function GET() {
  try {
    const user = await requireUser();
    const { db } = admin();
    const snap = await db.collection('users').doc(user.uid).collection('chats').orderBy('updatedAt', 'desc').limit(50).get();
    const chats = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ chats }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'internal' }, { status: e?.message === 'unauthorized' ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { userId, title, initialMessage } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const { db } = admin();
    const now = new Date();
    const chatData = {
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };

    const chatRef = await db.collection("users").doc(user.uid).collection("chats").add(chatData);
    
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
