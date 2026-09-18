import { RidingInterest } from "./ridingInterests";

interface RidingInterestPillsProps {
  interests: RidingInterest[];
  max?: number;
}

const RidingInterestPills = ({ interests, max }: RidingInterestPillsProps) => {
  const visible = max ? interests.slice(0, max) : interests;
  const extraCount = max && interests.length > max ? interests.length - max : 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((interest) => (
        <span
          key={interest}
          className="rounded-full bg-[#2A2A2A] px-2.5 py-0.5 text-[10px] font-semibold text-[#AAAAAA]"
        >
          {interest}
        </span>
      ))}
      {extraCount > 0 && (
        <span className="text-[10px] font-semibold text-[#666666]">+{extraCount} more</span>
      )}
    </div>
  );
};

export default RidingInterestPills;
