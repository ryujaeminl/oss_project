import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserByEmail, updateUser } from "@/lib/pinecone";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  try {
    const user = await findUserByEmail(session.user.email);
    return NextResponse.json({ geminiApiKey: user?.geminiApiKey || "" });
  } catch (error) {
    return NextResponse.json({ error: "API 키를 가져오는 데 실패했습니다." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  try {
    const { geminiApiKey } = await req.json();
    
    // Trim and clean the API key, convert empty string to ""
    const cleanedKey = geminiApiKey?.trim() || "";

    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    await updateUser(user.id, { geminiApiKey: cleanedKey });

    return NextResponse.json({ success: true, message: "Gemini API 키가 저장되었습니다." });
  } catch (error) {
    console.error("Gemini API key save error:", error);
    return NextResponse.json({ error: "API 키를 저장하는 데 실패했습니다." }, { status: 500 });
  }
}
