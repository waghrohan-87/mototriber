const STEP_LABELS = ["Club identity", "Contact & social", "Admin details", "Ride captain"];

interface RegistrationProgressProps {
  step: number;
  totalSteps: number;
}

const RegistrationProgress = ({ step, totalSteps }: RegistrationProgressProps) => (
  <div className="flex flex-col gap-2 px-5 pb-4 pt-2">
    <div className="flex items-center justify-between text-xs">
      <span className="font-semibold text-[#F0F0F0]">{STEP_LABELS[step - 1]}</span>
      <span className="text-[#666666]">
        Step {step} of {totalSteps}
      </span>
    </div>
    <div className="flex gap-1.5">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-1 flex-1 rounded-full transition-colors ${
            index < step ? "bg-[#FF6600]" : "bg-[#2A2A2A]"
          }`}
        />
      ))}
    </div>
  </div>
);

export default RegistrationProgress;
