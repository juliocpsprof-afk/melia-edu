import { NextResponse, type NextRequest } from "next/server";

import { getSafeStudentAvatar } from "@/lib/studentAvatars";
import { getStudentPortalSession } from "@/lib/studentPortalSession";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const PHOTO_BUCKET = "student-photos";
const MAX_FILE_BYTES = 512 * 1024;
const ALLOWED_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

type StudentPhotoRecord = {
  id: string;
  name: string;
  class_id: string | null;
  photo_path: string | null;
  photo_status: "pending" | "approved" | "rejected" | null;
  photo_uploaded_by: "student" | "teacher" | null;
  photo_updated_at: string | null;
  photo_approved_at: string | null;
  photo_rejection_reason: string | null;
  identity_mode: "photo" | "avatar" | null;
  avatar_key: string | null;
  photo_required: boolean | null;
};

async function getTeacherUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  const admin = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

async function authorizeStudentOrTeacher(
  request: NextRequest,
  studentId: string
) {
  const teacher = await getTeacherUser(request);

  if (teacher) {
    return {
      role: "teacher" as const,
      teacher,
    };
  }

  const portalSession = await getStudentPortalSession(request);

  if (!portalSession || portalSession.studentId !== studentId) {
    return null;
  }

  return {
    role: "student" as const,
    session: portalSession,
  };
}

async function loadStudent(studentId: string) {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("students")
    .select(
      "id, name, class_id, photo_path, photo_status, photo_uploaded_by, photo_updated_at, photo_approved_at, photo_rejection_reason, identity_mode, avatar_key, photo_required"
    )
    .eq("id", studentId)
    .single();

  if (error || !data) {
    throw new Error("Aluno não encontrado.");
  }

  return {
    ...(data as Omit<StudentPhotoRecord, "name"> & { name: string | null }),
    name: String(data.name ?? "Aluno"),
  };
}

async function createSignedPhotoUrl(photoPath: string | null) {
  if (!photoPath) {
    return null;
  }

  const admin = getSupabaseAdmin();

  const { data, error } = await admin.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(photoPath, 60 * 60);

  if (error) {
    console.error("Erro ao assinar foto do aluno:", error.message);
    return null;
  }

  return data.signedUrl;
}

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get("studentId")?.trim();

    if (!studentId) {
      return NextResponse.json(
        { error: "Informe o aluno." },
        { status: 400 }
      );
    }

    const authorization = await authorizeStudentOrTeacher(request, studentId);

    if (!authorization) {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const student = await loadStudent(studentId);
    const signedUrl = await createSignedPhotoUrl(student.photo_path);

    return NextResponse.json({
      student,
      signedUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a foto.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const studentId = String(formData.get("studentId") ?? "").trim();
    const file = formData.get("file");

    if (!studentId || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Aluno e arquivo são obrigatórios." },
        { status: 400 }
      );
    }

    const authorization = await authorizeStudentOrTeacher(request, studentId);

    if (!authorization) {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Formato não permitido. Use WebP, JPEG ou PNG." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "A foto comprimida deve ter no máximo 512 KB." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    const photoPath = `students/${studentId}/profile.webp`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from(PHOTO_BUCKET)
      .upload(photoPath, arrayBuffer, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const uploadedBy = authorization.role;
    const now = new Date().toISOString();
    const photoStatus = uploadedBy === "teacher" ? "approved" : "pending";

    const { error: updateError } = await admin
      .from("students")
      .update({
        photo_path: photoPath,
        photo_status: photoStatus,
        photo_uploaded_by: uploadedBy,
        photo_updated_at: now,
        photo_approved_at: uploadedBy === "teacher" ? now : null,
        photo_rejection_reason: null,
      })
      .eq("id", studentId);

    if (updateError) {
      throw updateError;
    }

    const student = await loadStudent(studentId);
    const signedUrl = await createSignedPhotoUrl(photoPath);

    return NextResponse.json({
      student,
      signedUrl,
    });
  } catch (error) {
    console.error("Erro ao enviar foto do aluno:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar a foto.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: "preference" | "review";
      studentId?: string;
      identityMode?: "photo" | "avatar";
      avatarKey?: string;
      status?: "approved" | "rejected";
      reason?: string | null;
    };

    const studentId = String(body.studentId ?? "").trim();

    if (!studentId) {
      return NextResponse.json(
        { error: "Informe o aluno." },
        { status: 400 }
      );
    }

    const authorization = await authorizeStudentOrTeacher(request, studentId);

    if (!authorization) {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();

    if (body.action === "preference") {
      const identityMode =
        body.identityMode === "photo" ? "photo" : "avatar";
      const avatarKey = getSafeStudentAvatar(body.avatarKey);

      const currentStudent = await loadStudent(studentId);

      if (identityMode === "photo" && !currentStudent.photo_path) {
        return NextResponse.json(
          { error: "Envie uma foto antes de escolher esta opção." },
          { status: 400 }
        );
      }

      const { error } = await admin
        .from("students")
        .update({
          identity_mode: identityMode,
          avatar_key: avatarKey,
        })
        .eq("id", studentId);

      if (error) {
        throw error;
      }
    } else if (body.action === "review") {
      if (authorization.role !== "teacher") {
        return NextResponse.json(
          { error: "Somente o professor pode revisar a foto." },
          { status: 403 }
        );
      }

      if (body.status !== "approved" && body.status !== "rejected") {
        return NextResponse.json(
          { error: "Informe uma decisão válida." },
          { status: 400 }
        );
      }

      if (
        body.status === "rejected" &&
        !String(body.reason ?? "").trim()
      ) {
        return NextResponse.json(
          { error: "Informe o motivo da rejeição." },
          { status: 400 }
        );
      }

      const { error } = await admin
        .from("students")
        .update({
          photo_status: body.status,
          photo_approved_at:
            body.status === "approved" ? new Date().toISOString() : null,
          photo_rejection_reason:
            body.status === "rejected"
              ? String(body.reason ?? "").trim()
              : null,
        })
        .eq("id", studentId);

      if (error) {
        throw error;
      }
    } else {
      return NextResponse.json(
        { error: "Ação inválida." },
        { status: 400 }
      );
    }

    const student = await loadStudent(studentId);
    const signedUrl = await createSignedPhotoUrl(student.photo_path);

    return NextResponse.json({
      student,
      signedUrl,
    });
  } catch (error) {
    console.error("Erro ao atualizar foto do aluno:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a foto.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get("studentId")?.trim();

    if (!studentId) {
      return NextResponse.json(
        { error: "Informe o aluno." },
        { status: 400 }
      );
    }

    const teacher = await getTeacherUser(request);

    if (!teacher) {
      return NextResponse.json(
        { error: "Somente o professor pode remover uma foto." },
        { status: 403 }
      );
    }

    const student = await loadStudent(studentId);
    const admin = getSupabaseAdmin();

    if (student.photo_path) {
      await admin.storage.from(PHOTO_BUCKET).remove([student.photo_path]);
    }

    const { error } = await admin
      .from("students")
      .update({
        photo_path: null,
        photo_status: "pending",
        photo_uploaded_by: null,
        photo_updated_at: null,
        photo_approved_at: null,
        photo_rejection_reason: null,
        identity_mode: "avatar",
      })
      .eq("id", studentId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível remover a foto.",
      },
      { status: 500 }
    );
  }
}
