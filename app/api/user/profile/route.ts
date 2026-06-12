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
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.characterName || user.name || "학습자",
      email: user.email,
      image: user.characterImage || user.image || "",
      goalTime: user.goalTime !== undefined ? Number(user.goalTime) : 120,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return NextResponse.json({ error: "사용자 정보 조회에 실패했습니다." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  try {
    const { name, goalTime, image } = await req.json();
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const updated = await updateUser(user.id, {
      name,
      goalTime: goalTime !== undefined ? Number(goalTime) : undefined,
      image,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
      goalTime: updated.goalTime !== undefined ? Number(updated.goalTime) : 120,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "사용자 정보 수정에 실패했습니다." }, { status: 500 });
  }
}
