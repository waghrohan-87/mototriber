import { Rider } from "@/components/riders/RiderCard";

export const normalizeHandle = (value: string) => value.trim().toLowerCase().replace(/^@/, "");

export const isRegisteredHandle = (riders: Rider[], value: string) =>
  riders.some((r) => normalizeHandle(r.handle) === normalizeHandle(value));
