import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Lock, Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import TopBar from "@/components/layout/TopBar";
import { Switch } from "@/components/ui/switch";

type Visibility = "public" | "club" | "private";

type SourcePlatform = "Reddit" | "Facebook" | "Instagram" | "WhatsApp";

const SOURCE_PLATFORMS: SourcePlatform[] = ["Reddit", "Facebook", "Instagram", "WhatsApp"];

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: typeof Globe }[] = [
  { value: "public", label: "Public", icon: Globe },
  { value: "club", label: "Club only", icon: Users },
  { value: "private", label: "Private", icon: Lock },
];

const RIDE_TYPE_BY_VISIBILITY: Record<Visibility, string> = {
  public: "open",
  club: "club",
  private: "private",
};

const fieldClasses =
  "w-full rounded-xl border border-[#333333] bg-[#222222] px-4 py-3 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";

const labelClasses = "text-xs font-semibold uppercase tracking-wide text-[#888888]";

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface MyClub {
  id: number;
  name: string;
}

interface ClubMember {
  userId: number;
  name: string;
}

const PostPage = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [distance, setDistance] = useState("");
  const [maxRiders, setMaxRiders] = useState("5");
  const [bikeType, setBikeType] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [submitting, setSubmitting] = useState(false);

  const [myClubs, setMyClubs] = useState<MyClub[]>([]);
  const [clubId, setClubId] = useState<number | "">("");
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [captainUserId, setCaptainUserId] = useState<number | "">("");

  const [isSeeded, setIsSeeded] = useState(false);
  const [sourcePlatform, setSourcePlatform] = useState<SourcePlatform>("Reddit");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceNote, setSourceNote] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: memberRows, error: memberError } = await window.ezsite.apis.tablePage("club_members", {
          PageNo: 1,
          PageSize: 200,
          Filters: [{ name: "user_id", op: "Equal", value: user.userId }],
        });
        if (memberError) throw new Error(memberError);
        const clubIds = new Set(
          ((memberRows?.List ?? []) as Record<string, unknown>[]).map((row) => Number(row.club_id))
        );
        if (clubIds.size === 0) {
          setMyClubs([]);
          return;
        }
        const { data: clubRows, error: clubError } = await window.ezsite.apis.tablePage("clubs", {
          PageNo: 1,
          PageSize: 200,
        });
        if (clubError) throw new Error(clubError);
        const clubs = ((clubRows?.List ?? []) as Record<string, unknown>[])
          .filter((row) => clubIds.has(Number(row.ID ?? row.id)))
          .map((row) => ({ id: Number(row.ID ?? row.id), name: String(row.name ?? "") }));
        setMyClubs(clubs);
      } catch {
        setMyClubs([]);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (visibility !== "public" && isSeeded) {
      setIsSeeded(false);
      setSourcePlatform("Reddit");
      setSourceUrl("");
      setSourceNote("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    if (!clubId) {
      setClubMembers([]);
      setCaptainUserId("");
      return;
    }
    (async () => {
      try {
        const { data: memberRows, error } = await window.ezsite.apis.tablePage("club_members", {
          PageNo: 1,
          PageSize: 200,
          Filters: [{ name: "club_id", op: "Equal", value: clubId }],
        });
        if (error) throw new Error(error);
        const rows = (memberRows?.List ?? []) as Record<string, unknown>[];
        const withNames = await Promise.all(
          rows.map(async (row) => {
            const userId = Number(row.user_id);
            const { data: pData } = await window.ezsite.apis.tablePage("user_profiles", {
              PageNo: 1,
              PageSize: 1,
              Filters: [{ name: "user_id", op: "Equal", value: userId }],
            });
            const fullName = String(
              (pData?.List?.[0] as Record<string, unknown> | undefined)?.full_name ?? ""
            );
            return { userId, name: fullName || `Rider #${userId}` };
          })
        );
        setClubMembers(withNames);
      } catch {
        setClubMembers([]);
      }
    })();
  }, [clubId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to post a ride.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !date || !time || !meetingPoint.trim() || !distance || !maxRiders) {
      toast({
        title: "Missing details",
        description: "Please fill in all required fields before posting.",
        variant: "destructive",
      });
      return;
    }

    if (visibility === "club" && !clubId) {
      toast({
        title: "Select a club",
        description: "Please choose which club this ride is for.",
        variant: "destructive",
      });
      return;
    }

    if (user.isAdmin && isSeeded && (!sourceUrl.trim() || !sourceNote.trim())) {
      toast({
        title: "Missing source details",
        description: "Please provide the source post URL and a source note for this seeded ride.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { error: createError } = await window.ezsite.apis.tableCreate("rides", {
        title: title.trim(),
        creator_user_id: user.userId,
        ride_type: RIDE_TYPE_BY_VISIBILITY[visibility],
        club_id: visibility === "club" ? Number(clubId) : null,
        captain_user_id: visibility === "club" && captainUserId ? Number(captainUserId) : null,
        ride_date: date,
        ride_time: time,
        meeting_point: meetingPoint.trim(),
        distance_km: Number(distance),
        max_riders: Number(maxRiders),
        bike_type_welcome: bikeType.trim() || null,
        description: description.trim() || null,
        visibility,
        status: "planned",
        created_at: now,
        updated_at: now,
      });
      if (createError) throw new Error(createError);

      const { data: created, error: fetchError } = await window.ezsite.apis.tablePage("rides", {
        PageNo: 1,
        PageSize: 1,
        OrderByField: "ID",
        IsAsc: false,
        Filters: [{ name: "creator_user_id", op: "Equal", value: user.userId }],
      });
      if (fetchError) throw new Error(fetchError);
      const newRideRow = created?.List?.[0] as Record<string, unknown> | undefined;
      const newRideId = Number(newRideRow?.ID ?? newRideRow?.id);
      if (!newRideId) throw new Error("Couldn't find the newly created ride.");

      const isAdminSeeded = user.isAdmin && isSeeded;
      if (!isAdminSeeded) {
        const { error: participantError } = await window.ezsite.apis.tableCreate("ride_participants", {
          ride_id: newRideId,
          user_id: user.userId,
          join_status: "joined",
          attended: "unconfirmed",
          joined_at: now,
        });
        if (participantError) throw new Error(participantError);
      }

      if (isAdminSeeded) {
        const { error: sourceError } = await window.ezsite.apis.tableCreate("ride_sources", {
          ride_id: newRideId,
          source_platform: sourcePlatform,
          source_url: sourceUrl.trim(),
          source_note: sourceNote.trim(),
          is_seeded: "yes",
          claim_status: "unclaimed",
          claimed_by_user_id: null,
          claimed_at: null,
          created_at: now,
        });
        if (sourceError) throw new Error(sourceError);
      }

      toast({ title: "Ride posted!" });
      navigate("/", { state: { ridesTab: "created" } });
    } catch (err) {
      toast({
        title: "Couldn't post ride",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <TopBar />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-5 py-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className={labelClasses}>
            Ride title
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Sunrise Canyon Loop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={fieldClasses}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="date" className={labelClasses}>
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              min={getTodayDateString()}
              onChange={(e) => {
                if (e.target.value && e.target.value < getTodayDateString()) return;
                setDate(e.target.value);
              }}
              className={cn(fieldClasses, "[color-scheme:dark]")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="time" className={labelClasses}>
              Start time
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={cn(fieldClasses, "[color-scheme:dark]")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="meetingPoint" className={labelClasses}>
            Meeting point
          </label>
          <input
            id="meetingPoint"
            type="text"
            placeholder="e.g. Iron Horse Coffee, Route 9"
            value={meetingPoint}
            onChange={(e) => setMeetingPoint(e.target.value)}
            className={fieldClasses}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="distance" className={labelClasses}>
              Distance (km)
            </label>
            <input
              id="distance"
              type="number"
              min={0}
              placeholder="0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className={fieldClasses}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="maxRiders" className={labelClasses}>
              Max riders
            </label>
            <input
              id="maxRiders"
              type="number"
              min={1}
              value={maxRiders}
              onChange={(e) => setMaxRiders(e.target.value)}
              className={fieldClasses}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="bikeType" className={labelClasses}>
            Bike type welcome
          </label>
          <input
            id="bikeType"
            type="text"
            placeholder="e.g. All bikes, RE only"
            value={bikeType}
            onChange={(e) => setBikeType(e.target.value)}
            className={fieldClasses}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className={labelClasses}>
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Tell riders what to expect..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cn(fieldClasses, "resize-none")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelClasses}>Who can see this ride</span>
          <div className="flex rounded-xl border border-[#333333] bg-[#222222] p-1">
            {VISIBILITY_OPTIONS.map(({ value, label, icon: Icon }) => {
              const isActive = visibility === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors",
                    isActive ? "bg-[#FF6600] text-white" : "text-[#888888] hover:text-[#F0F0F0]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          {visibility === "private" && (
            <div className="flex items-start gap-2 rounded-xl border border-[#333333] bg-[#1a1a1a] p-3 text-xs text-[#AAAAAA]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF9D4D]" />
              <span>
                Private rides are invite-only. Only people you add can see and join this ride.
              </span>
            </div>
          )}
        </div>

        {visibility === "club" && (
          <div className="flex flex-col gap-4 rounded-xl border border-[#333333] bg-[#1a1a1a] p-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="club" className={labelClasses}>
                Which club is this ride for
              </label>
              {myClubs.length > 0 ? (
                <select
                  id="club"
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value ? Number(e.target.value) : "")}
                  className={cn(fieldClasses, "[color-scheme:dark]")}
                >
                  <option value="">Select a club</option>
                  {myClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-[#888888]">You're not a member of any club yet.</p>
              )}
            </div>

            {clubId && (
              <div className="flex flex-col gap-2">
                <label htmlFor="captain" className={labelClasses}>
                  Assign a ride captain (optional)
                </label>
                <select
                  id="captain"
                  value={captainUserId}
                  onChange={(e) => setCaptainUserId(e.target.value ? Number(e.target.value) : "")}
                  className={cn(fieldClasses, "[color-scheme:dark]")}
                >
                  <option value="">No captain assigned</option>
                  {clubMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {user?.isAdmin && visibility === "public" && (
          <div className="flex flex-col gap-4 rounded-xl border border-[#333333] bg-[#1a1a1a] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#F0F0F0]">This is a seeded ride</span>
                <span className="text-xs text-[#888888]">
                  Mark this ride as sourced from an external post so it can be claimed later.
                </span>
              </div>
              <Switch checked={isSeeded} onCheckedChange={setIsSeeded} className="shrink-0 self-center" />
            </div>

            {isSeeded && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="sourcePlatform" className={labelClasses}>
                    Source platform
                  </label>
                  <select
                    id="sourcePlatform"
                    value={sourcePlatform}
                    onChange={(e) => setSourcePlatform(e.target.value as SourcePlatform)}
                    className={cn(fieldClasses, "[color-scheme:dark]")}
                  >
                    {SOURCE_PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="sourceUrl" className={labelClasses}>
                    Source post URL
                  </label>
                  <input
                    id="sourceUrl"
                    type="text"
                    placeholder="https://..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className={fieldClasses}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="sourceNote" className={labelClasses}>
                    Source note
                  </label>
                  <input
                    id="sourceNote"
                    type="text"
                    placeholder="e.g. Spotted on Reddit — rider heading to Coorg this Saturday"
                    value={sourceNote}
                    onChange={(e) => setSourceNote(e.target.value)}
                    className={fieldClasses}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(255,102,0,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post ride"}
        </button>
      </form>
    </div>
  );
};

export default PostPage;
