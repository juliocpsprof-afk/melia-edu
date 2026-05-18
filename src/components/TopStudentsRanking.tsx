type Student = {
  id: string;
  name: string;
  average: number;
  attendance: number;
};

export function TopStudentsRanking({ students }: { students: Student[] }) {
  const topStudents = [...students]
    .sort((a, b) => {
      const scoreA = Number(a.average || 0) + Number(a.attendance || 0) / 10;
      const scoreB = Number(b.average || 0) + Number(b.attendance || 0) / 10;

      return scoreB - scoreA;
    })
    .slice(0, 5);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">Ranking pedagógico</h2>

      <p className="mt-1 text-slate-400">
        Alunos com melhor combinação de média e frequência.
      </p>

      <div className="mt-6 space-y-4">
        {topStudents.map((student, index) => (
          <div
            key={student.id}
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500 font-bold">
                {index + 1}
              </div>

              <div>
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-slate-400">
                  Média {Number(student.average || 0).toFixed(1)} • Frequência{" "}
                  {Number(student.attendance || 0).toFixed(0)}%
                </p>
              </div>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
              Destaque
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}