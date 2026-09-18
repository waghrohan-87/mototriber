import { X } from "lucide-react";

interface BikeTagPillProps {
  label: string;
  onRemove?: () => void;
}

const BikeTagPill = ({ label, onRemove }: BikeTagPillProps) => (
  <span className="flex w-fit items-center gap-1 rounded-full bg-[#FF6600]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#FF6600]">
    {label}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors active:bg-[#FF6600]/25"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    )}
  </span>
);

export default BikeTagPill;
