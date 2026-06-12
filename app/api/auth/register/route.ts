import { NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/pinecone";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, name, password, goalTime, image } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      email,
      name,
      password: hashedPassword,
      goalTime: goalTime ? Number(goalTime) : 120,
      image: image || "",
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "회원가입에 실패했습니다." }, { status: 500 });
  }
}
