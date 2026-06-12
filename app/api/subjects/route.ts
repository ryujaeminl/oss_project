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
    const { name, color } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "과목명을 입력해주세요." }, { status: 400 });
    }

    // DB에 저장하지 않고 임시 모의 과목 데이터 반환
    const subject = {
      id: `subj_${Date.now()}`,
      userId,
      name,
      color: color || "#8b5cf6",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(subject);
  } catch (error) {
    return NextResponse.json({ error: "과목을 생성하는 데 실패했습니다." }, { status: 500 });
  }
}
