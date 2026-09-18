import { ReactNode } from "react";

interface RegistrationFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

const RegistrationField = ({ label, required, hint, children }: RegistrationFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-[#AAAAAA]">
      {label}
      {required && <span className="text-[#FF6600]"> *</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-[#666666]">{hint}</p>}
  </div>
);

export default RegistrationField;
