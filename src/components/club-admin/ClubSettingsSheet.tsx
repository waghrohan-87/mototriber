import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import RegistrationField from "@/components/club-registration/RegistrationField";
import { getInitials } from "@/components/club-registration/clubRegistrationTypes";
import { Club } from "@/components/clubs/ClubCard";

const inputClass =
  "w-full rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";

interface SettingsForm {
  name: string;
  description: string;
  avatarUrl: string;
  whatsappNumber: string;
  instagramHandle: string;
  facebookUrl: string;
  websiteUrl: string;
}

const toForm = (club: Club): SettingsForm => ({
  name: club.name,
  description: club.description,
  avatarUrl: club.avatarUrl,
  whatsappNumber: club.whatsappNumber ?? "",
  instagramHandle: club.instagramHandle ?? "",
  facebookUrl: club.facebookUrl ?? "",
  websiteUrl: club.websiteUrl ?? "",
});

interface ClubSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club: Club;
  onSave: (patch: Partial<Club>) => void;
}

const ClubSettingsSheet = ({ open, onOpenChange, club, onSave }: ClubSettingsSheetProps) => {
  const [form, setForm] = useState<SettingsForm>(() => toForm(club));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setForm(toForm(club));
  }, [open, club]);

  const update = (patch: Partial<SettingsForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleLogoPick = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => update({ avatarUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast({ title: "Missing details", description: "Club name and description are required.", variant: "destructive" });
      return;
    }
    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      avatarUrl: form.avatarUrl,
      whatsappNumber: form.whatsappNumber.trim() || undefined,
      instagramHandle: form.instagramHandle.trim() || undefined,
      facebookUrl: form.facebookUrl.trim() || undefined,
      websiteUrl: form.websiteUrl.trim() || undefined,
    });
    onOpenChange(false);
    toast({ title: "Club details updated" });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-[#2A2A2A] bg-[#1A1A1A] text-[#F0F0F0]">
        <div className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto px-5 pb-6 pt-2">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-bold text-[#F0F0F0]">Edit club details</h2>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#AAAAAA] transition-colors active:bg-[#222222]"
              >
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt={form.name} className="h-14 w-14 rounded-2xl border border-[#333333] object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#333333] bg-[#2A1608] text-sm font-bold text-[#FF9D4D]">
                  {getInitials(form.name || "Club")}
                </span>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-[#555555] px-3.5 py-2 text-xs font-bold text-[#F0F0F0] transition-colors active:bg-[#222222]"
              >
                Change logo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoPick(file);
                }}
              />
            </div>

            <RegistrationField label="Club name" required>
              <input type="text" value={form.name} onChange={(e) => update({ name: e.target.value })} className={inputClass} />
            </RegistrationField>

            <RegistrationField label="Description" required hint={`${form.description.length}/200 characters`}>
              <Textarea
                value={form.description}
                onChange={(e) => update({ description: e.target.value.slice(0, 200) })}
                rows={3}
                className="resize-none border-[#333333] bg-[#222222] text-sm text-[#F0F0F0] placeholder:text-[#666666] focus-visible:ring-[#FF6600]"
              />
            </RegistrationField>

            <RegistrationField label="WhatsApp number">
              <input
                type="tel"
                value={form.whatsappNumber}
                onChange={(e) => update({ whatsappNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </RegistrationField>

            <RegistrationField label="Instagram handle">
              <input
                type="text"
                value={form.instagramHandle}
                onChange={(e) => update({ instagramHandle: e.target.value })}
                placeholder="clubname"
                className={inputClass}
              />
            </RegistrationField>

            <RegistrationField label="Facebook URL">
              <input
                type="url"
                value={form.facebookUrl}
                onChange={(e) => update({ facebookUrl: e.target.value })}
                placeholder="https://facebook.com/..."
                className={inputClass}
              />
            </RegistrationField>

            <RegistrationField label="Website URL">
              <input
                type="url"
                value={form.websiteUrl}
                onChange={(e) => update({ websiteUrl: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
            </RegistrationField>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="mt-5 w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
          >
            Save changes
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ClubSettingsSheet;
