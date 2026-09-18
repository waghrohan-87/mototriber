import { ClubRegistrationForm } from "./clubRegistrationTypes";
import RegistrationField from "./RegistrationField";

const inputClass =
  "w-full rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";

interface StepContactProps {
  form: ClubRegistrationForm;
  onUpdate: (patch: Partial<ClubRegistrationForm>) => void;
}

const StepContact = ({ form, onUpdate }: StepContactProps) => (
  <div className="flex flex-col gap-4">
    <RegistrationField label="WhatsApp number" required hint="Club contact number">
      <div className="flex items-center gap-2 rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5 focus-within:border-[#FF6600]">
        <span className="text-sm text-[#666666]">+91</span>
        <input
          type="tel"
          value={form.whatsappNumber}
          onChange={(e) => onUpdate({ whatsappNumber: e.target.value.replace(/[^\d]/g, "") })}
          placeholder="98765 43210"
          className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none"
        />
      </div>
    </RegistrationField>

    <RegistrationField label="Instagram handle">
      <div className="flex items-center gap-2 rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5 focus-within:border-[#FF6600]">
        <span className="text-sm text-[#666666]">@</span>
        <input
          type="text"
          value={form.instagramHandle}
          onChange={(e) => onUpdate({ instagramHandle: e.target.value.replace(/^@/, "") })}
          placeholder="clubhandle"
          className="w-full bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none"
        />
      </div>
    </RegistrationField>

    <RegistrationField label="Facebook page URL">
      <input
        type="url"
        value={form.facebookUrl}
        onChange={(e) => onUpdate({ facebookUrl: e.target.value })}
        placeholder="https://facebook.com/yourclub"
        className={inputClass}
      />
    </RegistrationField>

    <RegistrationField label="YouTube channel">
      <input
        type="url"
        value={form.youtubeUrl}
        onChange={(e) => onUpdate({ youtubeUrl: e.target.value })}
        placeholder="https://youtube.com/@yourclub"
        className={inputClass}
      />
    </RegistrationField>

    <RegistrationField label="Website URL">
      <input
        type="url"
        value={form.websiteUrl}
        onChange={(e) => onUpdate({ websiteUrl: e.target.value })}
        placeholder="https://yourclub.com"
        className={inputClass}
      />
    </RegistrationField>
  </div>
);

export default StepContact;
