import { NextResponse } from 'next/server';
import { admin } from '../../../../../server/firebase/admin';
import { requireUser } from '../../../../../server/auth/requireUser';

interface Ctx {
  params: Promise<{ chatId: string }>;
}

export async function GET(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { chatId } = await params;
    const { db } = admin();
    const ref = db.collection('users').doc(user.uid).collection('chats').doc(chatId).collection('messages').orderBy('createdAt', 'asc');
    const snap = await ref.get();
    const messages = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ messages }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'internal' }, { status: e?.message === 'unauthorized' ? 401 : 500 });
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { chatId } = await params;
    const { content, role = "user" } = await req.json();
    
    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const { db } = admin();
    const now = new Date();
    const messageData = {
      content,
      role,
      createdAt: now,
      chatId,
    };

    const messageRef = await db
      .collection("users")
      .doc(user.uid)
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .add(messageData);

    // Update chat's message count and updatedAt
    await db
      .collection("users")
      .doc(user.uid)
      .collection("chats")
      .doc(chatId)
      .update({
        messageCount: (await db
          .collection("users")
          .doc(user.uid)
          .collection("chats")
          .doc(chatId)
          .collection("messages")
          .get()).size,
        updatedAt: now,
      });

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
