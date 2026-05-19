export const studentThemes = [
  {
    name: "Neon Azul",
    gradient: "from-cyan-400 to-blue-600",
    softGradient: "from-cyan-500/10 to-blue-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-300",
    glow: "shadow-cyan-500/20",
  },
  {
    name: "Neon Roxo",
    gradient: "from-purple-500 to-pink-500",
    softGradient: "from-purple-500/10 to-pink-500/10",
    border: "border-purple-500/20",
    text: "text-purple-300",
    glow: "shadow-purple-500/20",
  },
  {
    name: "Neon Verde",
    gradient: "from-emerald-400 to-green-600",
    softGradient: "from-emerald-500/10 to-green-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-300",
    glow: "shadow-emerald-500/20",
  },
  {
    name: "Neon Laranja",
    gradient: "from-orange-400 to-red-500",
    softGradient: "from-orange-500/10 to-red-500/10",
    border: "border-orange-500/20",
    text: "text-orange-300",
    glow: "shadow-orange-500/20",
  },
];

export function getStudentTheme(name: string) {
  const value = name || "Aluno";

  const total = value
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return studentThemes[total % studentThemes.length];
}