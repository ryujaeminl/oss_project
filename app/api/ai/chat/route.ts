import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIStudyMateResponse, analyzeUserMemoryIntent } from "@/lib/gemini";
import { findUserByEmail, queryStudyRecords, upsertStudyRecord } from "@/lib/pinecone";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { message, history } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
    }

    const user = await findUserByEmail(session.user.email);

    // 1. Analyze if the user explicitly wants to save information
    const memoryIntent = await analyzeUserMemoryIntent(message, user?.geminiApiKey);

    if (memoryIntent.shouldSave && memoryIntent.category && memoryIntent.content) {
      // Save only user requested information to Pinecone
      const memoryId = `mem_${Date.now()}`;
      const vectorText = `[기억 - ${memoryIntent.category}] ${memoryIntent.content}`;
      await upsertStudyRecord(userId, memoryId, vectorText, {
        type: "user_memory",
        userId,
        category: memoryIntent.category,
        content: memoryIntent.content,
      });
    }

    // Save the user's actual chat messages/questions as well
    const questionId = `q_${Date.now()}`;
    await upsertStudyRecord(userId, questionId, `[질문] ${message}`, {
      type: "user_question",
      userId,
      text: message,
    });

    // 2. RAG: Search Pinecone if user asks for plans, routines, schedules, etc.
    const keywords = ["계획", "루틴", "일정", "추천", "습관", "목표", "기억", "학습 방식", "집중", "스케줄", "일과", "하루", "생활"];
    const shouldRetrieve = keywords.some(keyword => message.includes(keyword));

    let contextualPrompt = message;

    if (shouldRetrieve) {
      const relevantLogs = await queryStudyRecords(userId, message, 5);
      
      if (relevantLogs && relevantLogs.length > 0) {
        // Separate saved memories and other task logs for better prompt structure
        const userMemories = relevantLogs.filter((log: any) => log.type === "user_memory" || log.category !== undefined);
        const taskLogs = relevantLogs.filter((log: any) => log.type !== "user_memory" && log.category === undefined);

        let contextText = "";
        if (userMemories.length > 0) {
          contextText += `[저장된 사용자 정보 (일정, 습관, 목표 등)]\n` + 
            userMemories.map((log: any) => `- [${log.category}] ${log.content || log.text}`).join("\n") + "\n\n";
        }
        if (taskLogs.length > 0) {
          contextText += `[참고용 기존 학습 기록]\n` + 
            taskLogs.map((log: any) => `- ${log.text}`).join("\n") + "\n\n";
        }

        contextualPrompt = `${contextText}사용자 메시지: ${message}\n\n위 정보를 바탕으로 사용자의 의도(계획 수립, 루틴 추천 등)에 맞추어 구체적이고 유용한 답변을 작성해주세요.`;
      }
    }

    // If we just saved information, instruct Gemini to confirm it friendly
    if (memoryIntent.shouldSave && memoryIntent.category && memoryIntent.content) {
      contextualPrompt = `[시스템 메시지: 사용자가 정보를 저장해달라고 요청하여 시스템이 성공적으로 저장했습니다. 카테고리: ${memoryIntent.category}, 내용: ${memoryIntent.content}]\n\n사용자 메시지: ${message}\n\n위 정보를 안전하게 기억해두었다고 사용자에게 친절하게 응답해주세요.`;
    }

    // 3. Call Gemini
    const reply = await getAIStudyMateResponse(history, contextualPrompt, user?.geminiApiKey);

    // [중요] 기존의 대화 전체를 Pinecone에 저장하는 로직은 삭제합니다. (저장을 요청한 정보만 저장)

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI Chat error:", error);
    return NextResponse.json({ error: "AI 답변을 생성하는 데 실패했습니다." }, { status: 500 });
  }
}
