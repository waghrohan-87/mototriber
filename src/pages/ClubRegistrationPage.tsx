import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { EMPTY_CLUB_REGISTRATION_FORM, ClubRegistrationForm } from "@/components/club-registration/clubRegistrationTypes";
import RegistrationProgress from "@/components/club-registration/RegistrationProgress";
import StepIdentity, { ClubNameStatus } from "@/components/club-registration/StepIdentity";
import StepContact from "@/components/club-registration/StepContact";
import StepAdmin from "@/components/club-registration/StepAdmin";
import StepCaptain from "@/components/club-registration/StepCaptain";

const TOTAL_STEPS = 4;

const ClubRegistrationPage = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ClubRegistrationForm>(EMPTY_CLUB_REGISTRATION_FORM);
  const [nameStatus, setNameStatus] = useState<ClubNameStatus>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateForm = (patch: Partial<ClubRegistrationForm>) => setForm((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      adminName: prev.adminName || user.fullName,
      adminEmail: prev.adminEmail || user.authEmail,
      adminUsername: user.username,
    }));
  }, [user]);

  useEffect(() => {
    const trimmed = form.clubName.trim();
    if (!trimmed) {
      setNameStatus("idle");
      return;
    }
    setNameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await window.ezsite.apis.tablePage("clubs", {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: "name", op: "Equal", value: trimmed }],
        });
        if (error) throw new Error(error);
        setNameStatus((data?.List?.length ?? 0) > 0 ? "taken" : "available");
      } catch {
        setNameStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.clubName]);

  const validateStep = (target: number): string | null => {
    if (target === 1) {
      if (!form.clubName.trim()) return "Club name is required.";
      if (nameStatus === "taken") return "This club name is already taken.";
      if (!form.city.trim()) return "City is required.";
      if (!form.bikeFocus) return "Please select a bike type focus.";
      if (!form.description.trim()) return "Please add a short description.";
      if (form.description.length > 200) return "Description must be 200 characters or fewer.";
    }
    if (target === 2) {
      if (!form.whatsappNumber.trim()) return "WhatsApp number is required.";
    }
    if (target === 3) {
      if (!form.adminName.trim()) return "Admin full name is required.";
      if (!form.adminPhone.trim()) return "Admin phone number is required.";
      if (!form.adminEmail.trim()) return "Admin email address is required.";
    }
    if (target === 4 && form.hasCaptain && !form.captainUserId) {
      return 'Please select a ride captain, or switch to "Not yet".';
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be signed in to register a club.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let logoUrl: string | null = null;
      if (form.logoFile) {
        const { data: fileId, error: uploadError } = await window.ezsite.apis.upload({
          filename: form.logoFile.name,
          file: form.logoFile,
        });
        if (uploadError) throw new Error(uploadError);
        const { data: url, error: urlError } = await window.ezsite.apis.getUploadUrl(fileId);
        if (urlError) throw new Error(urlError);
        logoUrl = url;
      }

      const now = new Date().toISOString();
      const { error: createError } = await window.ezsite.apis.tableCreate("clubs", {
        name: form.clubName.trim(),
        city: form.city.trim(),
        bike_type_focus: form.bikeFocus,
        description: form.description.trim(),
        logo_url: logoUrl,
        founding_year: form.yearFounded ? Number(form.yearFounded) : null,
        whatsapp_number: form.whatsappNumber ? `+91${form.whatsappNumber}` : "",
        instagram_handle: form.instagramHandle,
        facebook_url: form.facebookUrl,
        youtube_url: form.youtubeUrl,
        website_url: form.websiteUrl,
        admin_user_id: user.userId,
        captain_user_id: form.hasCaptain ? form.captainUserId : null,
        status: "pending",
        created_at: now,
        updated_at: now,
      });
      if (createError) throw new Error(createError);

      const { data: created, error: fetchError } = await window.ezsite.apis.tablePage("clubs", {
        PageNo: 1,
        PageSize: 1,
        OrderByField: "ID",
        IsAsc: false,
        Filters: [{ name: "admin_user_id", op: "Equal", value: user.userId }],
      });
      if (fetchError) throw new Error(fetchError);
      const newClubRow = created?.List?.[0];
      const newClubId = Number(newClubRow?.ID ?? newClubRow?.id);
      if (!newClubId) throw new Error("Couldn't find the newly created club.");

      const { error: memberError } = await window.ezsite.apis.tableCreate("club_members", {
        club_id: newClubId,
        user_id: user.userId,
        role: "co-admin",
        joined_at: now,
      });
      if (memberError) throw new Error(memberError);

      const { error: adminContactError } = await window.ezsite.apis.tableCreate("club_admin_contacts", {
        club_id: newClubId,
        admin_full_name: form.adminName.trim(),
        admin_phone: form.adminPhone.trim(),
        admin_email: form.adminEmail.trim(),
        created_at: now,
      });
      if (adminContactError) throw new Error(adminContactError);

      try {
        const { data: adminUsers } = await window.ezsite.apis.tablePage("easysite_auth_users", {
          PageNo: 1,
          PageSize: 100,
          Filters: [{ name: "role_id", op: "Equal", value: 6770 }],
        });
        const admins = (adminUsers?.List ?? []) as Record<string, unknown>[];
        await Promise.all(
          admins.map((admin) =>
            window.ezsite.apis.tableCreate("notifications", {
              user_id: Number(admin.ID ?? admin.id),
              type: "club_pending_review",
              message: `New club '${form.clubName.trim()}' is awaiting review`,
              related_club_id: newClubId,
              is_read: "no",
              created_at: now,
            })
          )
        );
      } catch {
        // Admin alert is best-effort; the submission itself already succeeded.
      }

      setSubmitted(true);
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      toast({ title: "Almost there", description: error, variant: "destructive" });
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    handleSubmit();
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
      return;
    }
    setStep((s) => s - 1);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
        className="flex h-screen flex-col items-center justify-center gap-4 bg-[#111111] px-8 text-center text-[#F0F0F0]"
      >
        <CheckCircle2 className="h-14 w-14 text-[#16A34A]" />
        <h1 className="text-xl font-bold">Application submitted</h1>
        <p className="text-sm leading-relaxed text-[#AAAAAA]">
          We review all clubs manually. You'll hear back within 48 hours on your WhatsApp number.
        </p>
        <button
          type="button"
          onClick={() => navigate("/clubs")}
          className="mt-4 w-full max-w-xs rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
        >
          Back to Clubs
        </button>
      </motion.div>
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
            onClick={handleBack}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#F0F0F0] transition-colors active:bg-[#222222]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-bold">Register your club</h1>
        </div>

        <RegistrationProgress step={step} totalSteps={TOTAL_STEPS} />

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {step === 1 && <StepIdentity form={form} onUpdate={updateForm} nameStatus={nameStatus} />}
          {step === 2 && <StepContact form={form} onUpdate={updateForm} />}
          {step === 3 && <StepAdmin form={form} onUpdate={updateForm} />}
          {step === 4 && <StepCaptain form={form} onUpdate={updateForm} />}
        </div>

        <div className="shrink-0 border-t border-[#333333] px-5 py-4">
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {step < TOTAL_STEPS ? "Next" : submitting ? "Submitting..." : "Submit for approval"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ClubRegistrationPage;
