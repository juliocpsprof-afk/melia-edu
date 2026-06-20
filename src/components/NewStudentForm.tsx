"use client";

import { useState } from "react";
import {
  Camera,
  CheckCircle,
  ImagePlus,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";

import { uploadStudentPhoto } from "../lib/studentPhoto";
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
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [classId, setClassId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [average, setAverage] = useState("");
  const [attendance, setAttendance] = useState("");
  const [status, setStatus] = useState("Regular");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handlePhotoSelection(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Selecione uma imagem válida para a foto do aluno.",
      });
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoConfirmed(false);
    setPhotoPreview(URL.createObjectURL(file));
    setMessage(null);
  }

  async function handleCreateStudent() {
    setMessage(null);

    if (!name.trim()) {
      setMessage({
        type: "error",
        text: "Digite pelo menos o nome do aluno.",
      });
      return;
    }

    if (photoFile && !photoConfirmed) {
      setMessage({
        type: "error",
        text: "Confirme que a foto mostra o aluno de frente e com o rosto legível.",
      });
      return;
    }

    const selectedClass = classes.find((item) => item.id === classId);
    const selectedCourse = courses.find((item) => item.id === courseId);

    setLoading(true);

    const { data: createdStudent, error } = await supabase
      .from("students")
      .insert({
        name: name.trim(),
        birth_date: birthDate || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        class_id: selectedClass?.id || null,
        class_name: selectedClass?.name || null,
        course_id: selectedCourse?.id || null,
        course_name: selectedCourse?.name || null,
        average: average ? Number(average) : 0,
        attendance: attendance ? Number(attendance) : 0,
        status: status || "Regular",
        photo_required: false,
      })
      .select("id, name")
      .single();

    if (error || !createdStudent?.id) {
      setLoading(false);
      console.error(error);
      setMessage({
        type: "error",
        text: `Erro ao cadastrar aluno: ${
          error?.message || "registro não retornado"
        }`,
      });
      return;
    }

    let photoWarning = "";

    if (photoFile) {
      try {
        await uploadStudentPhoto({
          studentId: String(createdStudent.id),
          file: photoFile,
          viewer: "teacher",
        });
      } catch (photoError) {
        photoWarning =
          photoError instanceof Error
            ? ` O aluno foi criado, mas a foto não foi enviada: ${photoError.message}`
            : " O aluno foi criado, mas a foto não foi enviada.";
      }
    }

    setLoading(false);
    setMessage({
      type: photoWarning ? "error" : "success",
      text: photoWarning
        ? `Aluno cadastrado.${photoWarning}`
        : photoFile
        ? "Aluno cadastrado com foto!"
        : "Aluno cadastrado. A foto poderá ser incluída depois na lista ou no perfil individual.",
    });

    setName("");
    setBirthDate("");
    setEmail("");
    setPhone("");
    setClassId("");
    setCourseId("");
    setAverage("");
    setAttendance("");
    setStatus("Regular");
    setPhotoFile(null);
    setPhotoConfirmed(false);

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview("");
    }

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">Cadastrar novo aluno</h2>

      <p className="mt-1 text-sm leading-6 text-slate-400">
        Preencha os dados principais. A foto é opcional e pode ser adicionada
        agora, na lista de alunos ou no perfil individual.
      </p>

      {message && (
        <div
          className={`mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} className="mt-0.5 shrink-0" />
          ) : (
            <XCircle size={20} className="mt-0.5 shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <details className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <summary className="cursor-pointer font-semibold text-cyan-100">
          Adicionar foto agora (opcional)
        </summary>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-cyan-400/40 bg-slate-950 text-cyan-200">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Prévia da foto do aluno"
                className="h-full w-full object-cover"
              />
            ) : (
              <Camera size={30} />
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs leading-5 text-slate-300">
              Use uma foto de frente, bem iluminada e com somente o aluno. A
              imagem será comprimida para WebP 640 × 640 antes do envio.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">
                <ImagePlus size={16} />
                Escolher foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    handlePhotoSelection(event.target.files?.[0] ?? null)
                  }
                />
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20">
                <Camera size={16} />
                Tirar agora
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(event) =>
                    handlePhotoSelection(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            </div>

            {photoPreview && (
              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={photoConfirmed}
                  onChange={(event) => setPhotoConfirmed(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-violet-500"
                />
                <span>
                  Confirmo que o aluno está sozinho, de frente, com o rosto
                  visível e a foto legível.
                </span>
              </label>
            )}
          </div>
        </div>
      </details>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          placeholder="Nome do aluno"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Data de nascimento opcional
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            style={{ colorScheme: "dark" }}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-400"
          />
        </div>

        <input
          placeholder="Telefone opcional"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <input
          placeholder="E-mail opcional"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <select
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="">Turma opcional</option>
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
          <option value="">Curso opcional</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Média opcional"
          type="number"
          value={average}
          onChange={(event) => setAverage(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <input
          placeholder="Frequência opcional"
          type="number"
          value={attendance}
          onChange={(event) => setAttendance(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 md:col-span-2"
        >
          <option value="Regular">Regular</option>
          <option value="Atenção">Atenção</option>
          <option value="Excelente">Excelente</option>
        </select>
      </div>

      <button
        onClick={handleCreateStudent}
        disabled={loading}
        className="mt-5 flex items-center gap-2 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : photoFile ? (
          <Upload size={18} />
        ) : null}
        {loading ? "Salvando..." : "Salvar aluno"}
      </button>
    </div>
  );
}
