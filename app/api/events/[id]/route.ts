import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const { title, date, color } = await req.json();

    // 로컬 DB 구조 변경에 맞추어 클라이언트용 모의 데이터 반환
    const updatedEvent = {
      id,
      userId,
      title: title !== undefined ? title : "임시 일정",
      date: date !== undefined ? new Date(date).toISOString() : new Date().toISOString(),
      color: color !== undefined ? color : "#8b5cf6",
    };

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Mock Event update error:", error);
    return NextResponse.json({ error: "일정을 수정하는 데 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
