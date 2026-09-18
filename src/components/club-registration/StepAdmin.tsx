import { ClubRegistrationForm } from "./clubRegistrationTypes";
import RegistrationField from "./RegistrationField";

const inputClass =
  "w-full rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";
const readOnlyClass =
  "w-full rounded-[14px] border border-[#2A2A2A] bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-[#888888]";

interface StepAdminProps {
  form: ClubRegistrationForm;
  onUpdate: (patch: Partial<ClubRegistrationForm>) => void;
}

const StepAdmin = ({ form, onUpdate }: StepAdminProps) => (
  <div className="flex flex-col gap-4">
    <RegistrationField label="Admin full name" required>
      <input
        type="text"
        value={form.adminName}
        onChange={(e) => onUpdate({ adminName: e.target.value })}
        placeholder="Your full name"
        className={inputClass}
      />
    </RegistrationField>

    <RegistrationField label="Admin phone number" required>
      <input
        type="tel"
        value={form.adminPhone}
        onChange={(e) => onUpdate({ adminPhone: e.target.value })}
        placeholder="e.g. +91 98765 43210"
        className={inputClass}
      />
    </RegistrationField>

    <RegistrationField label="Admin email address" required>
      <input
        type="email"
        value={form.adminEmail}
        onChange={(e) => onUpdate({ adminEmail: e.target.value })}
        placeholder="you@example.com"
        className={inputClass}
      />
    </RegistrationField>

    <RegistrationField label="Admin MotoTriber username" hint="From your MotoTriber profile">
      <input
        type="text"
        value={form.adminUsername ? `@${form.adminUsername}` : "Not set up yet"}
        readOnly
        disabled
        className={readOnlyClass}
      />
    </RegistrationField>
  </div>
);

export default StepAdmin;
