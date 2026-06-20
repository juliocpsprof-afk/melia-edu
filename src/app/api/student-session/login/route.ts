import { NextResponse, type NextRequest } from "next/server";

import {
  createStudentPortalSession,
  STUDENT_SESSION_COOKIE,
  STUDENT_SESSION_MAX_AGE_SECONDS,
} from "@/lib/studentPortalSession";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizePin(value: string) {
  return normalizeText(value).replace(/\s+/g, "");
}

function getDefaultPin(name: string) {
  const firstName = normalizeText(name).split(/\s+/)[0] || "aluno";
  return `${firstName}123`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      studentId?: string;
      classId?: string;
      pin?: string;
    };

    const studentId = String(body.studentId ?? "").trim();
    const classId = String(body.classId ?? "").trim();
    const typedPin = String(body.pin ?? "").trim();

    if (!studentId || !classId || !typedPin) {
      return NextResponse.json(
        { error: "Informe aluno, turma e PIN." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("students")
      .select(
        "id, name, class_id, class_name, portal_pin, must_change_pin, archived"
      )
      .eq("id", studentId)
      .eq("class_id", classId)
      .eq("archived", false)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    const savedPin =
      typeof data.portal_pin === "string" ? data.portal_pin.trim() : "";
    const defaultPin = getDefaultPin(String(data.name ?? "Aluno"));

    const savedPinIsCorrect = Boolean(savedPin) && typedPin === savedPin;
    const defaultPinIsCorrect =
      !savedPin && normalizePin(typedPin) === normalizePin(defaultPin);

    if (!savedPinIsCorrect && !defaultPinIsCorrect) {
      return NextResponse.json(
        {
          error:
            "PIN incorreto. Use o PIN inicial da escola ou seu PIN pessoal.",
        },
        { status: 401 }
      );
    }

    let mustChangePin = data.must_change_pin !== false || !savedPin;

    if (!savedPin && defaultPinIsCorrect) {
      const { error: updatePinError } = await admin
        .from("students")
        .update({
          portal_pin: defaultPin,
          must_change_pin: true,
          pin_updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (updatePinError) {
        return NextResponse.json(
          { error: "Não foi possível preparar o PIN do primeiro acesso." },
          { status: 500 }
        );
      }

      mustChangePin = true;
    }

    const portalSession = await createStudentPortalSession({
      studentId: String(data.id),
      classId: data.class_id ? String(data.class_id) : null,
    });

    const response = NextResponse.json({
      session: {
        studentId: String(data.id),
        classId: String(data.class_id ?? classId),
        studentName: String(data.name ?? "Aluno"),
        mustChangePin,
        loggedAt: new Date().toISOString(),
      },
    });

    response.cookies.set(STUDENT_SESSION_COOKIE, portalSession.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: STUDENT_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Erro no login do portal do aluno:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível entrar no portal.",
      },
      { status: 500 }
    );
  }
}
