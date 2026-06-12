import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserByEmail, updateUser } from "@/lib/pinecone";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const tasksList = user.tasks || [];
    let updatedTask = null;
    const updatedTasks = tasksList.map((t: any) => {
      if (t.id === id) {
        updatedTask = {
          ...t,
          title: body.title !== undefined ? body.title : t.title,
          description: body.description !== undefined ? body.description : t.description,
          startTime: body.startTime !== undefined ? body.startTime : t.startTime,
          duration: body.duration !== undefined ? body.duration : t.duration,
          color: body.color !== undefined ? body.color : t.color,
          dueDate: body.dueDate !== undefined ? body.dueDate : t.dueDate,
          completed: body.status !== undefined ? (body.status === "DONE" ? "o" : body.status === "PARTIAL" ? "triangle" : body.status === "FAILED" ? "x" : "none") : t.completed,
          timeSeconds: body.studyTime !== undefined ? body.studyTime * 60 : (body.timeSeconds !== undefined ? body.timeSeconds : t.timeSeconds),
        };
        return updatedTask;
      }
      return t;
    });

    await updateUser(user.id, { tasks: updatedTasks });

    return NextResponse.json({
      task: updatedTask,
      character: {
        level: user.characterLevel || 1,
        exp: user.characterExp || 0,
      },
      leveledUp: false,
    });
  } catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json({ error: "할 일을 수정하는 데 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const tasksList = user.tasks || [];
    const updatedTasks = tasksList.filter((t: any) => t.id !== id);
    await updateUser(user.id, { tasks: updatedTasks });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task delete error:", error);
    return NextResponse.json({ error: "할 일을 삭제하는 데 실패했습니다." }, { status: 500 });
  }
}
