import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { setPendingRideInvite, clearPendingRideInvite } from "@/lib/rideInvite";

const RideInvitePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading || !id) return;
    if (user) {
      clearPendingRideInvite();
      navigate(`/ride/${id}`, { replace: true });
    } else {
      setPendingRideInvite(id);
      navigate("/login", { replace: true });
    }
  }, [loading, user, id, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-[#F0F0F0]">
      <p className="text-xs text-[#666666]">Loading ride invite...</p>
    </div>
  );
};

export default RideInvitePage;
