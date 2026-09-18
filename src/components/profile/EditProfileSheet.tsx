import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, Plus, X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/components/discover/RideCard";
import BikeTagPill from "@/components/shared/BikeTagPill";
import InterestSelectGrid from "@/components/shared/InterestSelectGrid";
import { RidingInterest } from "@/components/shared/ridingInterests";

const BIO_MAX_LENGTH = 150;

export interface ProfileEditData {
  name: string;
  username: string;
  city: string;
  avatarUrl: string;
  bikes: string[];
  bio: string;
}

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileEditData;
  interests: RidingInterest[];
  onSave: (profile: ProfileEditData, interests: RidingInterest[]) => void;
}

const fieldClass =
  "w-full rounded-xl border border-[#333333] bg-[#222222] px-4 py-3 text-sm text-[#F0F0F0] placeholder:text-[#666666] outline-none transition-colors focus:border-[#FF6600]";

const EditProfileSheet = ({ open, onOpenChange, profile, interests, onSave }: EditProfileSheetProps) => {
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [city, setCity] = useState(profile.city);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [bikes, setBikes] = useState<string[]>(profile.bikes);
  const [bio, setBio] = useState(profile.bio);
  const [selectedInterests, setSelectedInterests] = useState<RidingInterest[]>(interests);
  const [addingBike, setAddingBike] = useState(false);
  const [newBike, setNewBike] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(profile.name);
      setUsername(profile.username);
      setCity(profile.city);
      setAvatarUrl(profile.avatarUrl);
      setBikes(profile.bikes);
      setBio(profile.bio);
      setSelectedInterests(interests);
      setAddingBike(false);
      setNewBike("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleToggleInterest = (interest: RidingInterest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest]
    );
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddBike = () => {
    const trimmed = newBike.trim();
    if (trimmed) setBikes((prev) => [...prev, trimmed]);
    setNewBike("");
    setAddingBike(false);
  };

  const handleRemoveBike = (bike: string) => {
    setBikes((prev) => prev.filter((b) => b !== bike));
  };

  const handleSave = () => {
    onSave(
      { name: name.trim(), username: username.trim(), city: city.trim(), avatarUrl, bikes, bio: bio.trim() },
      selectedInterests
    );
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-[#2A2A2A] bg-[#1A1A1A] text-[#F0F0F0]">
        <div className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto px-5 pb-6 pt-2">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-bold text-[#F0F0F0]">Edit profile</h2>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#AAAAAA] transition-colors active:bg-[#222222]"
              >
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>

          <div className="flex flex-col items-center gap-2.5 pb-5">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-20 w-20 rounded-full border-2 border-[#FF6600] object-cover" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#FF6600] bg-[#2A2A2A] text-lg font-bold text-[#F0F0F0]">
                {getInitials(name || "?")}
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full border border-[#FF6600] px-3.5 py-1.5 text-xs font-bold text-[#FF6600] transition-transform active:scale-[0.98]"
            >
              <Camera className="h-3.5 w-3.5" />
              Change photo
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#F0F0F0]">Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#F0F0F0]">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={fieldClass} />
              <p className="text-[11px] text-[#888888]">Changing username may affect your invite links</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#F0F0F0]">Location / City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#F0F0F0]">Bike(s) owned</label>
              {bikes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {bikes.map((bike) => (
                    <BikeTagPill key={bike} label={bike} onRemove={() => handleRemoveBike(bike)} />
                  ))}
                </div>
              )}
              {addingBike ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newBike}
                    onChange={(e) => setNewBike(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBike()}
                    placeholder="e.g. Triumph Tiger 900"
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    onClick={handleAddBike}
                    className="shrink-0 rounded-xl bg-[#FF6600] px-3.5 py-3 text-xs font-bold text-white transition-transform active:scale-[0.98]"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingBike(true)}
                  className="flex w-fit items-center gap-1 text-xs font-bold text-[#FF6600] transition-colors active:text-[#FF6600]/80"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add a bike
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-[#F0F0F0]">What kind of riding do you enjoy?</p>
              <InterestSelectGrid selected={selectedInterests} onToggle={handleToggleInterest} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#F0F0F0]">Short bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
                maxLength={BIO_MAX_LENGTH}
                placeholder="Tell the tribe about your riding style..."
                rows={3}
                className="min-h-[80px] resize-none rounded-xl border-[#333333] bg-[#222222] text-sm text-[#F0F0F0] placeholder:text-[#666666] focus-visible:ring-[#FF6600]"
              />
              <span className="self-end text-[11px] text-[#666666]">
                {bio.length}/{BIO_MAX_LENGTH}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="mt-5 w-full rounded-xl bg-[#FF6600] py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
          >
            Save changes
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditProfileSheet;
