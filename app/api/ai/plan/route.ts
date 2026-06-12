import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAutoStudyPlan } from "@/lib/gemini";
import { findUserByEmail } from "@/lib/pinecone";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  try {
    const { daysLeft, dailyTime, subjects } = await req.json();
    if (!daysLeft || !dailyTime || !subjects || !subjects.length) {
      return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });
    }

    const user = await findUserByEmail(session.user.email);

    const plan = await generateAutoStudyPlan({
      daysLeft: Number(daysLeft),
      dailyTime: Number(dailyTime),
      subjects,
    }, user?.geminiApiKey);

    return NextResponse.json(plan);
  } catch (error) {
    console.error("AI Plan generation error:", error);
    return NextResponse.json({ error: "AI 스터디 계획을 생성하는 데 실패했습니다." }, { status: 500 });
  }
}
