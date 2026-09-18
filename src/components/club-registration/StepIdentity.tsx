import { ChangeEvent } from "react";
import { Camera, Check, Loader2, X } from "lucide-react";
import { ClubRegistrationForm, BIKE_FOCUS_OPTIONS, getInitials } from "./clubRegistrationTypes";
import RegistrationField from "./RegistrationField";

const inputClass =
  "w-full rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";

export type ClubNameStatus = "idle" | "checking" | "available" | "taken";

interface StepIdentityProps {
  form: ClubRegistrationForm;
  onUpdate: (patch: Partial<ClubRegistrationForm>) => void;
  nameStatus: ClubNameStatus;
}

const StepIdentity = ({ form, onUpdate, nameStatus }: StepIdentityProps) => {
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpdate({ logoFile: file, logoPreviewUrl: URL.createObjectURL(file) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2">
        <label className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#333333] bg-[#2A1608] text-lg font-bold text-[#FF9D4D]">
          {form.logoPreviewUrl ? (
            <img src={form.logoPreviewUrl} alt="Club logo" className="h-full w-full object-cover" />
          ) : (
            form.clubName ? getInitials(form.clubName) : <Camera className="h-6 w-6 text-[#888888]" />
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </label>
        <span className="text-[11px] text-[#666666]">Club logo (optional)</span>
      </div>

      <RegistrationField label="Club name" required>
        <div className="relative">
          <input
            type="text"
            value={form.clubName}
            onChange={(e) => onUpdate({ clubName: e.target.value })}
            placeholder="e.g. Deccan Riders MC"
            className={`${inputClass} pr-9`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {nameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-[#666666]" />}
            {nameStatus === "available" && <Check className="h-4 w-4 text-[#16A34A]" />}
            {nameStatus === "taken" && <X className="h-4 w-4 text-[#EF4444]" />}
          </span>
        </div>
        {nameStatus === "taken" && (
          <p className="text-[11px] font-semibold text-[#EF4444]">This club name is already taken.</p>
        )}
        {nameStatus === "available" && (
          <p className="text-[11px] font-semibold text-[#16A34A]">Club name is available.</p>
        )}
      </RegistrationField>

      <RegistrationField label="City" required>
        <input
          type="text"
          value={form.city}
          onChange={(e) => onUpdate({ city: e.target.value })}
          placeholder="e.g. Bangalore"
          className={inputClass}
        />
      </RegistrationField>

      <RegistrationField label="Year founded">
        <input
          type="number"
          value={form.yearFounded}
          onChange={(e) => onUpdate({ yearFounded: e.target.value })}
          placeholder="e.g. 2018"
          className={inputClass}
        />
      </RegistrationField>

      <RegistrationField label="Bike type focus" required>
        <div className="flex flex-wrap gap-2">
          {BIKE_FOCUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onUpdate({ bikeFocus: option })}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                form.bikeFocus === option
                  ? "border-[#FF6600] bg-[#FF6600]/15 text-[#FF6600]"
                  : "border-[#333333] text-[#AAAAAA]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </RegistrationField>

      <RegistrationField label="Short description" required hint={`${form.description.length}/200`}>
        <textarea
          value={form.description}
          maxLength={200}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Tell riders what your club is about"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </RegistrationField>
    </div>
  );
};

export default StepIdentity;
