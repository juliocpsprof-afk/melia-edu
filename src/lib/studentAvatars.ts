export const studentAvatars = [
  "🚀",
  "🔥",
  "⚡",
  "🎮",
  "👾",
  "🤖",
  "🧠",
  "🏆",
  "🐺",
  "🦊",
  "🐼",
  "🐸",
  "🐯",
  "🦁",
  "🐵",
  "🐧",
  "🦉",
  "🐲",
  "🦄",
  "🐙",
  "🦖",
  "🐝",
  "🐢",
  "🦋",
  "🐳",
  "🦥",
  "🐨",
  "🐰",
  "🍕",
] as const;

export const defaultStudentAvatar = studentAvatars[0];

export type StudentAvatarKey = (typeof studentAvatars)[number];

export function getSafeStudentAvatar(value: string | null | undefined) {
  return studentAvatars.includes(value as StudentAvatarKey)
    ? (value as StudentAvatarKey)
    : defaultStudentAvatar;
}
