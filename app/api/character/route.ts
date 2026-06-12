import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserByEmail, updateUser } from "@/lib/pinecone";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const user = await findUserByEmail(session.user.email);
    return NextResponse.json({
      id: `char_${userId}`,
      userId,
      name: user?.characterName || "올리니",
      imageUrl: user?.characterImage || null,
      level: user?.characterLevel !== undefined ? Number(user.characterLevel) : 1,
      exp: user?.characterExp !== undefined ? Number(user.characterExp) : 0,
      totalStudyTime: user?.totalStudyTime !== undefined ? Number(user.totalStudyTime) : 0,
      completedTasks: user?.completedTasks !== undefined ? Number(user.completedTasks) : 0,
      partialTasks: user?.partialTasks !== undefined ? Number(user.partialTasks) : 0,
      failedTasks: user?.failedTasks !== undefined ? Number(user.failedTasks) : 0,
    });
  } catch (error) {
    console.error("Character GET error:", error);
    return NextResponse.json({ error: "캐릭터 정보를 조회하는 데 실패했습니다." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { name, imageUrl, level, exp } = await req.json();

    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const updated = await updateUser(user.id, {
      characterName: name !== undefined ? name : user.characterName,
      characterImage: imageUrl !== undefined ? imageUrl : user.characterImage,
      characterLevel: level !== undefined ? Number(level) : user.characterLevel,
      characterExp: exp !== undefined ? Number(exp) : user.characterExp,
    });

    return NextResponse.json({
      id: `char_${userId}`,
      userId,
      name: updated.characterName || "올리니",
      imageUrl: updated.characterImage || null,
      level: updated.characterLevel !== undefined ? Number(updated.characterLevel) : 1,
      exp: updated.characterExp !== undefined ? Number(updated.characterExp) : 0,
      totalStudyTime: updated.totalStudyTime !== undefined ? Number(updated.totalStudyTime) : 0,
      completedTasks: updated.completedTasks !== undefined ? Number(updated.completedTasks) : 0,
      partialTasks: updated.partialTasks !== undefined ? Number(updated.partialTasks) : 0,
      failedTasks: updated.failedTasks !== undefined ? Number(updated.failedTasks) : 0,
    });
  } catch (error) {
    console.error("Character update error:", error);
    return NextResponse.json({ error: "캐릭터 설정을 업데이트하는 데 실패했습니다." }, { status: 500 });
  }
}
