import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useClubs } from "@/context/ClubsContext";
import { useRidersDirectory } from "@/context/RidersDirectoryContext";
import RiderCard from "@/components/riders/RiderCard";

const ClubMembersPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clubs } = useClubs();
  const { riders, toggleConnect } = useRidersDirectory();

  const club = useMemo(() => clubs.find((c) => c.id === id), [clubs, id]);
  const members = useMemo(
    () => (club ? club.memberIds.map((mid) => riders.find((r) => r.id === mid)).filter((r) => r) : []),
    [club, riders]
  );

  if (!club) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#111111] text-[#F0F0F0]">
        <p className="text-sm text-[#888888]">This club could not be found.</p>
        <button
          onClick={() => navigate("/clubs")}
          className="rounded-full bg-[#FF6600] px-4 py-2 text-sm font-bold text-white"
        >
          Back to Clubs
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      className="flex h-screen flex-col bg-[#111111] text-[#F0F0F0]"
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[#333333] px-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#F0F0F0] transition-colors active:bg-[#222222]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#F0F0F0]">{club.name}</span>
            <span className="text-[11px] text-[#888888]">{members.length} members</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 px-4 py-4">
            {members.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#888888]">No members yet.</p>
            ) : (
              members.map(
                (member) =>
                  member && (
                    <RiderCard
                      key={member.id}
                      rider={member}
                      onToggleConnect={() => toggleConnect(member.id)}
                      onOpen={() => navigate(`/rider/${member.id}`)}
                    />
                  )
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClubMembersPage;
