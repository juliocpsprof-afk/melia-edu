"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Student = {
  name: string;
  average: number;
  attendance: number;
};

export function DashboardCharts({ students }: { students: Student[] }) {
  const chartData = students.map((student) => ({
    name: student.name ? student.name.split(" ")[0] : "Aluno",
    media: Number(student.average || 0),
    frequencia: Number(student.attendance || 0),
  }));

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Média dos alunos</h2>
        <p className="mt-1 text-slate-400">
          Comparativo geral de desempenho.
        </p>

        <div className="mt-8 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="media" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Frequência dos alunos</h2>
        <p className="mt-1 text-slate-400">
          Acompanhamento percentual de presença.
        </p>

        <div className="mt-8 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="frequencia"
                stroke="#22c55e"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}