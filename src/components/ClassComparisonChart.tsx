"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ClassItem = {
  id: string;
  name: string;
  students: {
    average: number;
    attendance: number;
  }[];
};

export function ClassComparisonChart({ classes }: { classes: ClassItem[] }) {
  const data = classes.map((classItem) => {
    const students = classItem.students ?? [];
    const total = students.length;

    const media =
      total > 0
        ? students.reduce((sum, student) => sum + Number(student.average || 0), 0) / total
        : 0;

    const frequencia =
      total > 0
        ? students.reduce((sum, student) => sum + Number(student.attendance || 0), 0) / total
        : 0;

    return {
      turma: classItem.name,
      media: Number(media.toFixed(1)),
      frequencia: Number(frequencia.toFixed(0)),
    };
  });

  return (
    <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">Comparação entre turmas</h2>

      <p className="mt-1 text-slate-400">
        Média e frequência geral de cada turma.
      </p>

      <div className="mt-8 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="turma" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="media" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
            <Bar dataKey="frequencia" fill="#22c55e" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}