import type { AvatarTint } from "@/components/riders/RiderCard";

const AVATAR_TINTS: AvatarTint[] = ["orange", "blue", "green", "purple", "teal"];

export const avatarTintForName = (name: string): AvatarTint => {
  const hash = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
};

const PARTICIPANT_TINTS = [
  { background: "rgba(59,130,246,0.2)", color: "#60A5FA" },
  { background: "rgba(34,197,94,0.2)", color: "#4ADE80" },
  { background: "rgba(168,85,247,0.2)", color: "#C084FC" },
  { background: "rgba(255,102,0,0.2)", color: "#FF9D4D" },
  { background: "rgba(20,184,166,0.2)", color: "#2DD4BF" },
];

export const tintForName = (name: string) => {
  const hash = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PARTICIPANT_TINTS[hash % PARTICIPANT_TINTS.length];
};
