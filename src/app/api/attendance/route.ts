import { redirect } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export async function POST(request: Request) {
  const formData = await request.formData();

  const studentId = String(formData.get("student_id"));
  const status = String(formData.get("status"));

  const today = new Date().toISOString().split("T")[0];

  await supabase.from("attendance").insert({
    student_id: studentId,
    status,
    date: today,
  });

  redirect("/dashboard/frequencia");
}