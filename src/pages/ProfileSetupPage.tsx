import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { clearPendingRideInvite, getPendingRideInviteId } from "@/lib/rideInvite";
import { cn } from "@/lib/utils";
import BikeTagPill from "@/components/shared/BikeTagPill";
import InterestSelectGrid from "@/components/shared/InterestSelectGrid";
import { RidingInterest } from "@/components/shared/ridingInterests";

const fieldClass =
  "w-full rounded-xl border border-[#333333] bg-[#222222] px-4 py-3 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const DEBOUNCE_MS = 500;

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [city, setCity] = useState("");
  const [newBike, setNewBike] = useState("");
  const [bikes, setBikes] = useState<string[]>([]);
  const [interests, setInterests] = useState<RidingInterest[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error: userError } = await window.ezsite.apis.getUserInfo();
        if (userError || !data) {
          navigate("/login");
          return;
        }
        setUserId(data.ID);
      } catch {
        navigate("/login");
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus("idle");
      return;
    }
    if (!USERNAME_PATTERN.test(trimmed)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await window.ezsite.apis.tablePage("user_profiles", {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: "username", op: "Equal", value: trimmed }],
        });
        if (error) throw new Error(error);
        setUsernameStatus(data?.List?.length > 0 ? "taken" : "available");
      } catch {
        setUsernameStatus("idle");
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [username]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleAddBike = () => {
    const trimmed = newBike.trim();
    if (!trimmed) return;
    setBikes((prev) => [...prev, trimmed]);
    setNewBike("");
  };

  const handleRemoveBike = (bike: string) => {
    setBikes((prev) => prev.filter((b) => b !== bike));
  };

  const handleToggleInterest = (interest: RidingInterest) => {
    setInterests((prev) => (prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest]));
  };

  const canContinue = usernameStatus === "available" && city.trim().length > 0 && bikes.length > 0;

  const finishSetup = async (finalInterests: RidingInterest[]) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      let profilePhotoUrl: string | null = null;
      if (photoFile) {
        const { data: fileId, error: uploadError } = await window.ezsite.apis.upload({
          filename: photoFile.name,
          file: photoFile,
        });
        if (uploadError) throw new Error(uploadError);
        const { data: url, error: urlError } = await window.ezsite.apis.getUploadUrl(fileId);
        if (urlError) throw new Error(urlError);
        profilePhotoUrl = url;
      }

      const trimmedUsername = username.trim();
      const { error: createError } = await window.ezsite.apis.tableCreate("user_profiles", {
        user_id: userId,
        full_name: sessionStorage.getItem("pending_full_name") || null,
        username: trimmedUsername,
        city: city.trim(),
        profile_photo_url: profilePhotoUrl,
        bikes_owned: bikes,
        riding_interests: finalInterests,
        account_status: "active",
        last_login: new Date().toISOString(),
      });
      if (createError) throw new Error(createError);
      sessionStorage.removeItem("pending_full_name");

      toast({ title: `Welcome to MotoTriber, @${trimmedUsername}! 🏍` });

      const pendingRideId = getPendingRideInviteId();
      if (pendingRideId) {
        navigate(`/ride/${pendingRideId}`, { replace: true });
        clearPendingRideInvite();
      } else {
        navigate("/");
      }
    } catch (err) {
      toast({
        title: "Couldn't complete setup",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = (e: FormEvent) => {
    e.preventDefault();
    if (canContinue) setStep(2);
  };

  if (checkingAuth) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#111111] px-6 py-10 text-[#F0F0F0]">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", "bg-[#FF6600]")} />
          <span className={cn("h-2 w-2 rounded-full", step === 2 ? "bg-[#FF6600]" : "bg-[#333333]")} />
        </div>

        {step === 1 ? (
          <>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-xl font-bold text-[#F0F0F0]">Set up your profile</h1>
              <p className="text-sm text-[#888888]">Help other riders find you.</p>
            </div>

            <form onSubmit={handleContinue} className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Add photo"
                  className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[#333333] bg-[#222222] text-[#888888] transition-colors active:border-[#FF6600]"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                <span className="text-xs font-semibold text-[#888888]">Add photo</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#F0F0F0]">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. rohan_rides"
                    className={cn(fieldClass, "pr-9")}
                  />
                  {usernameStatus === "available" && (
                    <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#22C55E]" />
                  )}
                  {usernameStatus === "taken" && (
                    <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#EF4444]" />
                  )}
                </div>
                {usernameStatus === "available" && <p className="text-[11px] font-semibold text-[#22C55E]">Username available</p>}
                {usernameStatus === "taken" && <p className="text-[11px] font-semibold text-[#EF4444]">Username taken</p>}
                <p className="text-[11px] text-[#888888]">Only letters, numbers, and underscores. No spaces.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#F0F0F0]">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bangalore"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#F0F0F0]">Bike(s) owned</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newBike}
                    onChange={(e) => setNewBike(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBike())}
                    placeholder="e.g. RE Himalayan 450"
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    onClick={handleAddBike}
                    className="flex shrink-0 items-center gap-1 rounded-xl bg-[#FF6600] px-3.5 py-3 text-xs font-bold text-white transition-transform active:scale-[0.98]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
                {bikes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {bikes.map((bike) => (
                      <BikeTagPill key={bike} label={bike} onRemove={() => handleRemoveBike(bike)} />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!canContinue}
                className="w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
              >
                Continue
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-xl font-bold text-[#F0F0F0]">What kind of riding do you enjoy?</h1>
              <p className="text-sm text-[#888888]">Select all that apply. You can change this later.</p>
            </div>

            <InterestSelectGrid selected={interests} onToggle={handleToggleInterest} />

            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                disabled={submitting || interests.length === 0}
                onClick={() => finishSetup(interests)}
                className="w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
              >
                {submitting ? "Saving..." : "Enter MotoTriber"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => finishSetup([])}
                className="text-xs font-semibold text-[#888888] transition-colors active:text-[#F0F0F0] disabled:opacity-60"
              >
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileSetupPage;
