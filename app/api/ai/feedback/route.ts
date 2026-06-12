import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserByEmail, upsertStudyRecord } from "@/lib/pinecone";
import { generateAIStudyFeedback } from "@/lib/gemini";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // 클라이언트 로컬 DB에서 집계된 통계를 요청 본문(JSON)으로 전달받음
    const body = await req.json().catch(() => ({}));
    const totalStudyTime = body.totalStudyTime !== undefined ? Number(body.totalStudyTime) : 0;
    const completedCount = body.completedCount !== undefined ? Number(body.completedCount) : 0;
    const partialCount = body.partialCount !== undefined ? Number(body.partialCount) : 0;
    const failedCount = body.failedCount !== undefined ? Number(body.failedCount) : 0;
    const subjectRatios = body.subjectRatios || "기록 없음";

    // Pinecone에서 사용자 정보 조회하여 Gemini API Key 확인
    const user = await findUserByEmail(session.user.email);

    // Call Gemini to generate feedback
    const feedback = await generateAIStudyFeedback({
      totalStudyTime,
      completedCount,
      partialCount,
      failedCount,
      subjectRatios,
    }, user?.geminiApiKey);

    // Save feedback action in Pinecone for personalization context
    const totalTasks = completedCount + partialCount + failedCount;
    await upsertStudyRecord(userId, `feedback_${Date.now()}`, `AI 학습 분석 피드백 받음: ${feedback}`, {
      type: "ai_feedback_generated",
      totalStudyTime,
      completionRate: totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0,
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("AI Feedback generation error:", error);
    return NextResponse.json({ error: "AI 피드백을 생성하는 데 실패했습니다." }, { status: 500 });
  }
}
