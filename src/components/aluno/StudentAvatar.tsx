"use client";
import { getStudentTheme } from "@/lib/studentThemes";
type StudentAvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizes = {
  sm: "h-10 w-10 text-sm rounded-2xl",
  md: "h-14 w-14 text-lg rounded-3xl",
  lg: "h-20 w-20 text-2xl rounded-[28px]",
  xl: "h-28 w-28 text-4xl rounded-[36px]",
};


function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function StudentAvatar({
  name,
  size = "md",
}: StudentAvatarProps) {
  const theme = getStudentTheme(name || "Aluno");

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${theme.gradient} ${sizes[size]} font-black text-white shadow-lg shadow-cyan-500/20`}
    >
      {getInitials(name || "Aluno")}
    </div>
  );
}