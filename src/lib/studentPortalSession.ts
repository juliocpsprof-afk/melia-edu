import "server-only";

import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "./supabaseAdmin";

export const STUDENT_SESSION_COOKIE = "melia_student_portal_session";
export const STUDENT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createStudentPortalSession({
  studentId,
  classId,
}: {
  studentId: string;
  classId: string | null;
}) {
  const admin = getSupabaseAdmin();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + STUDENT_SESSION_MAX_AGE_SECONDS * 1000
  ).toISOString();

  await admin
    .from("student_portal_sessions")
    .delete()
    .lt("expires_at", now);

  const { error } = await admin.from("student_portal_sessions").insert({
    token_hash: tokenHash,
    student_id: studentId,
    class_id: classId,
    expires_at: expiresAt,
  });

  if (error) {
    throw error;
  }

  return {
    token,
    expiresAt,
  };
}

export async function getStudentPortalSession(request: NextRequest) {
  const token = request.cookies.get(STUDENT_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const admin = getSupabaseAdmin();
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("student_portal_sessions")
    .select("id, student_id, class_id, expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", now)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  await admin
    .from("student_portal_sessions")
    .update({ last_used_at: now })
    .eq("id", data.id);

  return {
    id: String(data.id),
    studentId: String(data.student_id),
    classId: data.class_id ? String(data.class_id) : null,
    expiresAt: String(data.expires_at),
  };
}

export async function deleteStudentPortalSession(request: NextRequest) {
  const token = request.cookies.get(STUDENT_SESSION_COOKIE)?.value;

  if (!token) {
    return;
  }

  const admin = getSupabaseAdmin();

  await admin
    .from("student_portal_sessions")
    .delete()
    .eq("token_hash", hashToken(token));
}
