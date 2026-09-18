const RiderCardSkeleton = () => (
  <div className="flex animate-pulse items-center gap-3 rounded-[14px] border border-[#333333] bg-[#222222] px-3.5 py-3">
    <div className="h-11 w-11 shrink-0 rounded-full bg-[#2A2A2A]" />
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="h-3.5 w-24 rounded bg-[#2A2A2A]" />
      <div className="h-3 w-32 rounded bg-[#2A2A2A]" />
      <div className="h-4 w-20 rounded-full bg-[#2A2A2A]" />
    </div>
    <div className="h-7 w-20 shrink-0 rounded-full bg-[#2A2A2A]" />
  </div>
);

export default RiderCardSkeleton;
