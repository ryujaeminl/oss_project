import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  // 로컬 DB 전향으로 백엔드는 빈 배열 응답
  return NextResponse.json([]);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { title, date, color } = await req.json();
    if (!title || !date) {
      return NextResponse.json({ error: "일정명과 날짜를 입력해주세요." }, { status: 400 });
    }

    // DB에 저장하지 않고 임시 모의 일정 데이터 반환
    const event = {
      id: `ev_${Date.now()}`,
      userId,
      title,
      date: new Date(date).toISOString(),
      color: color || "#8b5cf6",
    };

    return NextResponse.json(event);
  } catch (error) {
    console.error("Mock Event creation error:", error);
    return NextResponse.json({ error: "일정을 생성하는 데 실패했습니다." }, { status: 500 });
  }
}
