import { cn } from "@/lib/utils";

interface BadgePillProps {
  label: string;
  color: string;
  background: string;
  border: string;
  className?: string;
}

const BadgePill = ({ label, color, background, border, className }: BadgePillProps) => (
  <span
    className={cn(
      "inline-flex w-fit items-center rounded-[20px] px-[10px] py-[3px] text-[11px] font-semibold leading-none",
      className
    )}
    style={{ color, backgroundColor: background, border: `1px solid ${border}` }}
  >
    {label}
  </span>
);

export default BadgePill;
