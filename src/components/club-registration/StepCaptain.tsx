import { useState } from "react";
import { ClubRegistrationForm } from "./clubRegistrationTypes";
import RegistrationField from "./RegistrationField";
import CaptainSearchField, { CaptainMatch } from "./CaptainSearchField";

interface StepCaptainProps {
  form: ClubRegistrationForm;
  onUpdate: (patch: Partial<ClubRegistrationForm>) => void;
}

const StepCaptain = ({ form, onUpdate }: StepCaptainProps) => {
  const [query, setQuery] = useState(form.captainDisplayName);

  const handleSelect = (match: CaptainMatch) => {
    setQuery(match.fullName ? `${match.fullName} (@${match.username})` : `@${match.username}`);
    onUpdate({ captainUserId: match.userId, captainDisplayName: match.fullName || match.username });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-bold text-[#F0F0F0]">Do you have a designated ride captain?</h2>

      <div className="flex gap-2">
        {[
          { label: "Yes, I have a captain", value: true },
          { label: "Not yet", value: false },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => {
              onUpdate({
                hasCaptain: option.value,
                captainUserId: option.value ? form.captainUserId : null,
                captainDisplayName: option.value ? form.captainDisplayName : "",
              });
              if (!option.value) setQuery("");
            }}
            className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-colors ${
              form.hasCaptain === option.value
                ? "border-[#FF6600] bg-[#FF6600]/15 text-[#FF6600]"
                : "border-[#333333] text-[#AAAAAA]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {form.hasCaptain ? (
        <RegistrationField label="Search for your ride captain" hint="Search by username or name">
          <CaptainSearchField
            query={query}
            onQueryChange={(value) => {
              setQuery(value);
              if (form.captainUserId) onUpdate({ captainUserId: null, captainDisplayName: "" });
            }}
            selectedUserId={form.captainUserId}
            onSelect={handleSelect}
          />
        </RegistrationField>
      ) : (
        <p className="text-xs text-[#888888]">No problem — you can add a ride captain later from the club settings.</p>
      )}
    </div>
  );
};

export default StepCaptain;
