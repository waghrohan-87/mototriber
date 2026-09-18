import { BikeFocus } from "./clubRegistrationTypes";
import { ClubCategory } from "@/components/clubs/ClubCard";

export type ClubApplicationStatus = "pending" | "approved" | "rejected";

export interface ClubApplication {
  id: number;
  club_name: string;
  city: string;
  year_founded: number | null;
  bike_focus: BikeFocus | "";
  description: string;
  logo_file_id: number | null;
  whatsapp_number: string;
  instagram_handle: string;
  facebook_url: string;
  youtube_url: string;
  website_url: string;
  admin_name: string;
  admin_phone: string;
  admin_email: string;
  admin_username: string;
  has_ride_captain: boolean;
  ride_captain_username: string;
  status: ClubApplicationStatus;
  submitted_at: string;
}

export const SUPPORT_HANDLE = "@mototriber_support";

export const bikeFocusLabel = (bikeFocus: ClubApplication["bike_focus"]) => bikeFocus || "All bikes";

const CATEGORY_BY_BIKE_FOCUS: Record<string, ClubCategory> = {
  "Royal Enfield only": "RE clubs",
  Adventure: "Adventure",
  Sports: "Sports",
  "Women riders": "Women",
  Cruiser: "Touring",
  "All bikes": "Touring",
};

export const bikeFocusToCategory = (bikeFocus: ClubApplication["bike_focus"]): ClubCategory =>
  CATEGORY_BY_BIKE_FOCUS[bikeFocus] ?? "Touring";
