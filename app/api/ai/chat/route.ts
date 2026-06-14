import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIStudyMateResponse, analyzeUserMemoryIntent } from "@/lib/gemini";
import { findUserByEmail, queryStudyRecords, upsertStudyRecord } from "@/lib/pinecone";

interface SessionUserWithId {
  id?: string;
  email?: string | null;
}

interface UserTaskSummary {
  title?: string;
  completed?: "o" | "x" | "triangle" | "none";
  status?: "DONE" | "PARTIAL" | "FAILED" | "TODO";
}

interface StudyRecordMetadata {
  type?: string;
  category?: string;
  content?: string;
  text?: string;
}

interface ProposedPlanItem {
  date: string;
  title: string;
  duration: string;
  content: string;
}

function isProposedPlanItem(value: unknown): value is ProposedPlanItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.date === "string" &&
    typeof item.title === "string" &&
    typeof item.duration === "string" &&
    typeof item.content === "string"
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  const userId = (session.user as SessionUserWithId).id;
  if (!userId) {
    return NextResponse.json({ error: "사용자 ID를 확인할 수 없습니다." }, { status: 401 });
  }

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

    // 2. Compute user task statistics for adaptive planning
    const tasks = (user?.tasks || []) as UserTaskSummary[];
    
    // Helper function to extract subject from title
    const getSubjectFromTitle = (title: string): string => {
      const commonSubjects = [
        "수학", "영어", "국어", "과학", "사회", "코딩", "프로그래밍", 
        "선형대수", "광학", "머신러닝", "알고리즘", "자료구조", 
        "데이터베이스", "디자인", "NumPy", "파이썬"
      ];
      for (const subject of commonSubjects) {
        if (title.toLowerCase().includes(subject.toLowerCase())) {
          return subject;
        }
      }
      const words = title.trim().split(/\s+/);
      if (words.length > 0) {
        const firstWord = words[0].replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
        if (firstWord.length >= 2) {
          return firstWord;
        }
      }
      return "기타";
    };

    const subjectStats: Record<string, { total: number; done: number; partial: number; failed: number }> = {};
    let overallTotal = 0;
    let overallDone = 0;
    let overallPartial = 0;

    tasks.forEach((task) => {
      const title = task.title || "";
      const status = task.completed || task.status;
      const isDone = status === "o" || status === "DONE";
      const isPartial = status === "triangle" || status === "PARTIAL";

      const subj = getSubjectFromTitle(title);
      if (!subjectStats[subj]) {
        subjectStats[subj] = { total: 0, done: 0, partial: 0, failed: 0 };
      }
      subjectStats[subj].total++;
      if (isDone) subjectStats[subj].done++;
      else if (isPartial) subjectStats[subj].partial++;
      else subjectStats[subj].failed++;

      overallTotal++;
      if (isDone) overallDone++;
      else if (isPartial) overallPartial++;
    });

    const kstOffset = 9 * 60 * 60 * 1000;
    const now = new Date();
    const kstDate = new Date(now.getTime() + kstOffset);
    const currentDateStr = kstDate.toISOString().split("T")[0];

    let statsContext = `[현재 날짜 및 시간]\n- 오늘 날짜: ${currentDateStr} (이 날짜를 기준 날짜로 사용하여 학습 계획의 날짜 YYYY-MM-DD를 지정하세요)\n\n[사용자의 과거 학습 수행 통계]\n`;
    if (overallTotal === 0) {
      statsContext += `- 아직 등록된 학습 계획 및 수행 기록이 없습니다. 사용자가 첫 번째 계획 수립 요청입니다.\n`;
    } else {
      const overallRate = overallTotal > 0 ? Math.round(((overallDone + overallPartial * 0.5) / overallTotal) * 100) : 0;
      statsContext += `- 전체 계획 완료율: ${overallRate}% (총 ${overallTotal}개 중 완료 ${overallDone}개, 부분완료 ${overallPartial}개)\n`;
      statsContext += `- 과목별 수행 현황:\n`;
      Object.entries(subjectStats).forEach(([subj, stat]) => {
        const rate = stat.total > 0 ? Math.round(((stat.done + stat.partial * 0.5) / stat.total) * 100) : 0;
        statsContext += `  * ${subj}: 완료율 ${rate}% (총 ${stat.total}개 중 완료 ${stat.done}개, 부분완료 ${stat.partial}개, 미완료 ${stat.failed}개)\n`;
      });
    }

    // 3. RAG: Search Pinecone if user asks for plans, routines, schedules, etc.
    const keywords = ["계획", "루틴", "일정", "추천", "습관", "목표", "기억", "학습 방식", "집중", "스케줄", "일과", "하루", "생활"];
    const shouldRetrieve = keywords.some(keyword => message.includes(keyword));

    let contextualPrompt = `${statsContext}\n\n`;

    if (memoryIntent.shouldSave && memoryIntent.category && memoryIntent.content) {
      contextualPrompt += `[시스템 메시지: 사용자가 정보를 저장해달라고 요청하여 시스템이 성공적으로 저장했습니다. 카테고리: ${memoryIntent.category}, 내용: ${memoryIntent.content}]\n\n사용자 메시지: ${message}\n\n위 정보를 안전하게 기억해두었다고 사용자에게 친절하게 응답해주세요.`;
    } else {
      if (shouldRetrieve) {
        const relevantLogs = await queryStudyRecords(userId, message, 5);
        
        if (relevantLogs && relevantLogs.length > 0) {
          // Separate saved memories and other task logs for better prompt structure
          const records = relevantLogs as StudyRecordMetadata[];
          const userMemories = records.filter((log) => log.type === "user_memory" || log.category !== undefined);
          const taskLogs = records.filter((log) => log.type !== "user_memory" && log.category === undefined);

          let contextText = "";
          if (userMemories.length > 0) {
            contextText += `[저장된 사용자 정보 (일정, 습관, 목표 등)]\n` + 
              userMemories.map((log) => `- [${log.category}] ${log.content || log.text}`).join("\n") + "\n\n";
          }
          if (taskLogs.length > 0) {
            contextText += `[참고용 기존 학습 기록]\n` + 
              taskLogs.map((log) => `- ${log.text}`).join("\n") + "\n\n";
          }

          contextualPrompt += `${contextText}사용자 메시지: ${message}\n\n위 정보를 바탕으로 사용자의 의도(계획 수립, 루틴 추천 등)에 맞추어 구체적이고 유용한 답변을 작성해주세요.`;
        } else {
          contextualPrompt += `사용자 메시지: ${message}`;
        }
      } else {
        contextualPrompt += `사용자 메시지: ${message}`;
      }
    }

    // 4. Call Gemini
    const reply = await getAIStudyMateResponse(history, contextualPrompt, user?.geminiApiKey);

    // [중요] 기존의 대화 전체를 Pinecone에 저장하는 로직은 삭제합니다. (저장을 요청한 정보만 저장)

    let proposedPlan: ProposedPlanItem[] | undefined = undefined;
    let cleanReply = reply;

    // Extract proposedPlan JSON block
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/i;
    const match = reply.match(jsonBlockRegex);
    if (match) {
      try {
        const jsonText = match[1].trim();
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed) && parsed.every(isProposedPlanItem)) {
          proposedPlan = parsed;
          // Clean the markdown json block from user display message
          cleanReply = reply.replace(jsonBlockRegex, "").trim();
        }
      } catch (e) {
        console.error("Failed to parse proposed plan JSON:", e);
      }
    }

    return NextResponse.json({ reply: cleanReply, proposedPlan });
  } catch (error) {
    console.error("AI Chat error:", error);
    return NextResponse.json({ error: "AI 답변을 생성하는 데 실패했습니다." }, { status: 500 });
  }
}
