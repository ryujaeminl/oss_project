import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserByEmail, updateUser } from "@/lib/pinecone";
import { estimateTaskDifficulty } from "@/lib/gemini";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  try {
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json(user.tasks || []);
  } catch (error) {
    console.error("GET tasks error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  try {
    const { title, description, startTime, duration, color, date, dueDate, scheduledAt } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "할 일 제목을 입력해주세요." }, { status: 400 });
    }

    // Pinecone에서 사용자 정보 조회하여 Gemini API Key 확인
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // Call Gemini API to estimate difficulty and XP
    const aiEstimation = await estimateTaskDifficulty(title, user?.geminiApiKey);

    const getExpReward = (difficulty: string) => {
      if (difficulty === "easy") return 10;
      if (difficulty === "hard") return 50;
      return 30; // medium
    };
    const expReward = getExpReward(aiEstimation.difficulty);

    const responseTask = {
      id: `task_${Date.now()}`,
      title,
      description: description || "",
      startTime: startTime || null,
      duration: duration || "0시간 0분",
      color: color || "#85b8b1",
      completed: "none",
      date: date || new Date().toISOString().split("T")[0],
      dueDate: dueDate || null,
      difficulty: aiEstimation.difficulty,
      difficultyScore: aiEstimation.difficultyScore || 50,
      expReward: expReward,
      scheduledAt: scheduledAt || null,
      createdAt: new Date().toISOString(),
    };

    // Save task to user metadata in Pinecone
    const existingTasks = user.tasks || [];
    const updatedTasks = [...existingTasks, responseTask];
    await updateUser(user.id, { tasks: updatedTasks });

    return NextResponse.json(responseTask);
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json({ error: "할 일을 평가하는 데 실패했습니다." }, { status: 500 });
  }
}
