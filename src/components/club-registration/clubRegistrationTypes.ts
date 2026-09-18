export const BIKE_FOCUS_OPTIONS = [
  "All bikes",
  "Royal Enfield only",
  "Adventure",
  "Sports",
  "Cruiser",
  "Women riders",
] as const;

export type BikeFocus = (typeof BIKE_FOCUS_OPTIONS)[number];

export interface ClubRegistrationForm {
  clubName: string;
  city: string;
  yearFounded: string;
  bikeFocus: BikeFocus | "";
  description: string;
  logoFile: File | null;
  logoPreviewUrl: string | null;

  whatsappNumber: string;
  instagramHandle: string;
  facebookUrl: string;
  youtubeUrl: string;
  websiteUrl: string;

  adminName: string;
  adminPhone: string;
  adminEmail: string;
  adminUsername: string;

  hasCaptain: boolean;
  captainUserId: number | null;
  captainDisplayName: string;
}

export const EMPTY_CLUB_REGISTRATION_FORM: ClubRegistrationForm = {
  clubName: "",
  city: "",
  yearFounded: "",
  bikeFocus: "",
  description: "",
  logoFile: null,
  logoPreviewUrl: null,

  whatsappNumber: "",
  instagramHandle: "",
  facebookUrl: "",
  youtubeUrl: "",
  websiteUrl: "",

  adminName: "",
  adminPhone: "",
  adminEmail: "",
  adminUsername: "",

  hasCaptain: false,
  captainUserId: null,
  captainDisplayName: "",
};

export const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
