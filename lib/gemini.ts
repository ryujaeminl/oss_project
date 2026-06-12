import { GoogleGenAI } from "@google/genai";

function getAIClient(customApiKey?: string | null) {
  const key = customApiKey || process.env.GEMINI_API_KEY || "placeholder_key";
  return new GoogleGenAI({ apiKey: key });
}

export interface DifficultyResponse {
  difficulty: string;
  difficultyScore: number;
}

export interface MemoryIntentResponse {
  shouldSave: boolean;
  category?: string;
  content?: string;
}

export async function estimateTaskDifficulty(title: string, customApiKey?: string | null): Promise<DifficultyResponse> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || "placeholder_key";
  if (!apiKey || apiKey === "placeholder_key") {
    // Return mock data if API key is not configured
    return {
      difficulty: "medium",
      difficultyScore: 50,
    };
  }

  try {
    const ai = getAIClient(customApiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `사용자가 등록한 공부 할 일 제목: "${title}"
이 할 일의 난이도를 다음 5가지 기준을 바탕으로 분석해주세요:
1. 예상 소요 시간
2. 집중도
3. 복잡성
4. 수행 난이도
5. 긴급성

분석 결과를 바탕으로 전반적인 난이도(difficulty)와 0~100 사이의 난이도 점수(difficultyScore)를 평가해주세요.

다음 JSON 형식으로만 정확히 반환해주세요. 다른 설명이나 마크다운 백틱은 포함하지 마십시오:
{
  "difficulty": "hard",
  "difficultyScore": 85
}`,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      let diff = (parsed.difficulty || "medium").toLowerCase().trim();
      if (diff.includes("easy") || diff.includes("쉬움") || diff.includes("쉬")) {
        diff = "easy";
      } else if (diff.includes("hard") || diff.includes("difficult") || diff.includes("어려움") || diff.includes("어렵")) {
        diff = "hard";
      } else {
        diff = "medium";
      }
      return {
        difficulty: diff,
        difficultyScore: Number(parsed.difficultyScore) || 50,
      };
    }
    throw new Error("No JSON object found in Gemini response");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      difficulty: "medium",
      difficultyScore: 50,
    };
  }
}

export async function analyzeUserMemoryIntent(message: string, customApiKey?: string | null): Promise<MemoryIntentResponse> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || "placeholder_key";
  if (!apiKey || apiKey === "placeholder_key") {
    return { shouldSave: false };
  }

  try {
    const ai = getAIClient(customApiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `사용자 메시지를 분석하여, 사용자가 자신의 정보(일과, 공부 습관, 운동 루틴, 목표, 선호 학습 방식, 집중 시간대 등)를 기억하거나 저장해달라고 명시적으로 요청했는지 판단하세요.
(예: "내 평일 일정 기억해줘", "이 루틴 저장해줘", "내 공부 습관 기억해줘" 등)
단순한 대화나 질문이라면 저장하지 않습니다.

저장이 필요하다면 카테고리(category)와 내용(content)을 추출하세요. 카테고리는 영어로 짧게 작성하세요 (예: schedule, habit, routine, goal, style, focus_time 등).

반드시 다음 JSON 형식으로만 반환하고 마크다운 백틱은 포함하지 마십시오:
{
  "shouldSave": true 또는 false,
  "category": "추출된 카테고리 (shouldSave가 true일 때만)",
  "content": "저장할 실제 내용 요약 (shouldSave가 true일 때만)"
}`,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as MemoryIntentResponse;
    }
    return { shouldSave: false };
  } catch (error) {
    console.error("Gemini Intent Error:", error);
    return { shouldSave: false };
  }
}

export async function generateAIStudyFeedback(stats: {
  totalStudyTime: number;
  completedCount: number;
  partialCount: number;
  failedCount: number;
  subjectRatios: string;
}, customApiKey?: string | null) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || "placeholder_key";
  if (!apiKey || apiKey === "placeholder_key") {
    return "AI 분석을 활성화하려면 Gemini API 키를 설정해주세요! 현재는 임시 모드입니다. 학습 총량은 훌륭합니다.";
  }

  try {
    const ai = getAIClient(customApiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `다음 학습 통계를 분석하여 따뜻하고 구체적인 피드백과 내일의 학습 가이드를 한글로 3~4줄 요약해서 작성해주세요.
- 총 공부 시간: ${stats.totalStudyTime}분
- 완료한 일: ${stats.completedCount}개, 부분 완료: ${stats.partialCount}개, 미완료: ${stats.failedCount}개
- 과목별 학습 비율: ${stats.subjectRatios}
오늘 공부한 흐름을 보고 피드백하고 부족한 과목이 있다면 추천 계획을 포함해주세요.`,
    });
    return response.text || "피드백을 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini Feedback Error:", error);
    return "학습 분석 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.";
  }
}

export async function getAIStudyMateResponse(
  history: { role: "user" | "model"; parts: string[] }[],
  message: string,
  customApiKey?: string | null
) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || "placeholder_key";
  if (!apiKey || apiKey === "placeholder_key") {
    return "API 키가 등록되지 않아 스터디 메이트 답변을 생성할 수 없습니다.";
  }

  try {
    const formattedHistory = history.map((h) => ({
      role: h.role,
      parts: [{ text: h.parts[0] }],
    }));

    const ai = getAIClient(customApiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory.map(h => ({ role: h.role, parts: [{ text: h.parts[0].text }] })),
        { role: "user", parts: [{ text: message }] }
      ],
      // Adding a system instruction for study helper persona
      config: {
        systemInstruction: "당신은 학생들의 공부를 도와주는 친절하고 똑똑한 AI 스터디 메이트입니다. 학생들의 질문(개념 설명, 계획 수립, 공부 팁)에 성실하고 격려하는 어조로 답변해주세요.",
      }
    });

    return response.text || "죄송해요, 답변을 생성하지 못했습니다.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "스터디 메이트 서버에 문제가 발생했습니다.";
  }
}

export async function generateAutoStudyPlan(input: {
  daysLeft: number;
  dailyTime: number;
  subjects: string[];
}, customApiKey?: string | null) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || "placeholder_key";
  if (!apiKey || apiKey === "placeholder_key") {
    return JSON.stringify({
      plans: [
        { day: 1, content: "수학 미적분 공식 정리 (2시간), 영어 독해 3지문 (2시간)" },
        { day: 2, content: "자료구조 정렬 알고리즘 학습 (2시간), 수학 예제 풀이 (2시간)" }
      ]
    });
  }

  try {
    const ai = getAIClient(customApiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `시험까지 ${input.daysLeft}일이 남았고, 하루에 ${input.dailyTime}시간 공부가 가능합니다.
공부할 과목들: ${input.subjects.join(", ")}

남은 기간 동안의 과목별 밸런스를 맞춘 학습 플랜을 자동 생성해주세요.
결과는 반드시 아래의 JSON 형식으로만 정확히 반환해주시고 다른 텍스트나 마크다운은 절대 포함하지 마십시오.

{
  "plans": [
    { "day": 1, "content": "1일차 공부 내용 요약" },
    ...
  ]
}`,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { plans: [] };
  } catch (error) {
    console.error("Gemini Auto Plan Error:", error);
    return { plans: [] };
  }
}
