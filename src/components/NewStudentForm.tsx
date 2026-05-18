"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

type CourseItem = {
  id: string;
  name: string;
};

export function NewStudentForm({
  classes,
  courses,
}: {
  classes: ClassItem[];
  courses: CourseItem[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [classId, setClassId] = useState("");
  const [courseId, setCourseId] = useState("");

  const [average, setAverage] = useState("");
  const [attendance, setAttendance] = useState("");

  const [status, setStatus] = useState("Regular");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleCreateStudent() {
    setMessage(null);

    if (!name || !email || !phone || !classId || !courseId) {
      setMessage({
        type: "error",
        text: "Preencha nome, e-mail, telefone, turma e curso.",
      });

      return;
    }

    const selectedClass = classes.find((item) => item.id === classId);
    const selectedCourse = courses.find((item) => item.id === courseId);

    setLoading(true);

    const { error } = await supabase.from("students").insert({
      name,
      email,
      phone,

      class_id: classId,
      class_name: selectedClass?.name,

      course_id: courseId,
      course_name: selectedCourse?.name,

      average: average ? Number(average) : 0,
      attendance: attendance ? Number(attendance) : 0,

      status,
    });

    setLoading(false);

    if (error) {
      console.error(error);

      setMessage({
        type: "error",
        text: "Erro ao cadastrar aluno.",
      });

      return;
    }

    setMessage({
      type: "success",
      text: "Aluno cadastrado com sucesso!",
    });

    setName("");
    setEmail("");
    setPhone("");
    setClassId("");
    setCourseId("");
    setAverage("");
    setAttendance("");
    setStatus("Regular");

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">Cadastrar novo aluno</h2>

      {message && (
        <div
          className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}

          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          placeholder="Nome do aluno"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <input
          placeholder="E-mail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <input
          placeholder="Telefone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <select
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="">Selecione a turma</option>

          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
            </option>
          ))}
        </select>

        <select
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="">Selecione o curso</option>

          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Média"
          type="number"
          value={average}
          onChange={(event) => setAverage(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <input
          placeholder="Frequência"
          type="number"
          value={attendance}
          onChange={(event) => setAttendance(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="Regular">Regular</option>
          <option value="Atenção">Atenção</option>
          <option value="Excelente">Excelente</option>
        </select>
      </div>

      <button
        onClick={handleCreateStudent}
        disabled={loading}
        className="mt-5 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar aluno"}
      </button>
    </div>
  );
}