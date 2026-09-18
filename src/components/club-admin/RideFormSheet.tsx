import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import RegistrationField from "@/components/club-registration/RegistrationField";
import { Ride } from "@/components/discover/RideCard";

const inputClass =
  "w-full rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";

export interface RideFormValues {
  title: string;
  date: string;
  time: string;
  distance: string;
  meetingPoint: string;
  spotsTotal: string;
  description: string;
}

const EMPTY_FORM: RideFormValues = {
  title: "",
  date: "",
  time: "",
  distance: "",
  meetingPoint: "",
  spotsTotal: "",
  description: "",
};

interface RideFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride: Ride | null;
  onSubmit: (values: RideFormValues) => void;
}

const RideFormSheet = ({ open, onOpenChange, ride, onSubmit }: RideFormSheetProps) => {
  const [form, setForm] = useState<RideFormValues>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(
      ride
        ? {
            title: ride.title,
            date: ride.date,
            time: ride.time,
            distance: ride.distance,
            meetingPoint: ride.meetingPoint,
            spotsTotal: String(ride.spotsTotal),
            description: ride.description ?? "",
          }
        : EMPTY_FORM
    );
  }, [open, ride]);

  const update = (patch: Partial<RideFormValues>) => setForm((prev) => ({ ...prev, ...patch }));

  const isValid =
    form.title.trim() && form.date.trim() && form.time.trim() && form.distance.trim() && form.meetingPoint.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(form);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-[#2A2A2A] bg-[#1A1A1A] text-[#F0F0F0]">
        <div className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto px-5 pb-6 pt-2">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-bold text-[#F0F0F0]">{ride ? "Edit ride" : "Create a new ride"}</h2>
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
            <RegistrationField label="Ride title" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="e.g. Nandi Hills Sunrise Ride"
                className={inputClass}
              />
            </RegistrationField>

            <div className="grid grid-cols-2 gap-3">
              <RegistrationField label="Date" required>
                <input
                  type="text"
                  value={form.date}
                  onChange={(e) => update({ date: e.target.value })}
                  placeholder="Sat, Sep 20"
                  className={inputClass}
                />
              </RegistrationField>
              <RegistrationField label="Time" required>
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => update({ time: e.target.value })}
                  placeholder="6:30 AM"
                  className={inputClass}
                />
              </RegistrationField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <RegistrationField label="Distance" required>
                <input
                  type="text"
                  value={form.distance}
                  onChange={(e) => update({ distance: e.target.value })}
                  placeholder="120 km"
                  className={inputClass}
                />
              </RegistrationField>
              <RegistrationField label="Total spots">
                <input
                  type="number"
                  min="0"
                  value={form.spotsTotal}
                  onChange={(e) => update({ spotsTotal: e.target.value })}
                  placeholder="12"
                  className={inputClass}
                />
              </RegistrationField>
            </div>

            <RegistrationField label="Meeting point" required>
              <input
                type="text"
                value={form.meetingPoint}
                onChange={(e) => update({ meetingPoint: e.target.value })}
                placeholder="Hebbal Flyover, Bangalore"
                className={inputClass}
              />
            </RegistrationField>

            <RegistrationField label="Description">
              <Textarea
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Share more details about the ride..."
                rows={3}
                className="resize-none border-[#333333] bg-[#222222] text-sm text-[#F0F0F0] placeholder:text-[#666666] focus-visible:ring-[#FF6600]"
              />
            </RegistrationField>
          </div>

          <button
            type="button"
            disabled={!isValid}
            onClick={handleSubmit}
            className="mt-5 w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {ride ? "Save changes" : "Create ride"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RideFormSheet;
