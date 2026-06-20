import { NextResponse, type NextRequest } from "next/server";

import {
  deleteStudentPortalSession,
  STUDENT_SESSION_COOKIE,
} from "@/lib/studentPortalSession";

export async function POST(request: NextRequest) {
  try {
    await deleteStudentPortalSession(request);
  } catch (error) {
    console.error("Erro ao encerrar sessão do aluno:", error);
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set(STUDENT_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
