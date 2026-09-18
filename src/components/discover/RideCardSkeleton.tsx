const RideCardSkeleton = () => (
  <div className="flex animate-pulse flex-col gap-3 rounded-2xl border border-[#333333] bg-[#1a1a1a] p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="h-4 w-2/3 rounded bg-[#2A2A2A]" />
      <div className="h-5 w-16 shrink-0 rounded-full bg-[#2A2A2A]" />
    </div>
    <div className="h-3 w-4/5 rounded bg-[#2A2A2A]" />
    <div className="h-3 w-1/2 rounded bg-[#2A2A2A]" />
    <div className="mt-1 flex items-center justify-between gap-2 border-t border-[#2A2A2A] pt-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 shrink-0 rounded-full bg-[#2A2A2A]" />
        <div className="h-3 w-20 rounded bg-[#2A2A2A]" />
      </div>
      <div className="h-6 w-16 shrink-0 rounded-full bg-[#2A2A2A]" />
    </div>
  </div>
);

export default RideCardSkeleton;
