import { MessageCircle, Instagram, Facebook, Youtube, Globe } from "lucide-react";

interface ClubSocialRowProps {
  whatsappNumber?: string | null;
  instagramHandle?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  websiteUrl?: string | null;
}

const iconButtonClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#333333] bg-[#1a1a1a] text-[#F0F0F0] transition-transform active:scale-90";

const ClubSocialRow = ({ whatsappNumber, instagramHandle, facebookUrl, youtubeUrl, websiteUrl }: ClubSocialRowProps) => {
  const links = [
    whatsappNumber && {
      key: "whatsapp",
      icon: MessageCircle,
      href: `https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}`,
      label: "WhatsApp",
      color: "#25D366",
    },
    instagramHandle && {
      key: "instagram",
      icon: Instagram,
      href: `https://instagram.com/${instagramHandle.replace(/^@/, "")}`,
      label: "Instagram",
      color: "#E1306C",
    },
    facebookUrl && {
      key: "facebook",
      icon: Facebook,
      href: facebookUrl,
      label: "Facebook",
      color: "#1877F2",
    },
    youtubeUrl && {
      key: "youtube",
      icon: Youtube,
      href: youtubeUrl,
      label: "YouTube",
      color: "#FF0000",
    },
    websiteUrl && {
      key: "website",
      icon: Globe,
      href: websiteUrl,
      label: "Website",
      color: "#FF6600",
    },
  ].filter(Boolean) as { key: string; icon: typeof MessageCircle; href: string; label: string; color: string }[];

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {links.map(({ key, icon: Icon, href, label, color }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={iconButtonClass}
        >
          <Icon className="h-[18px] w-[18px]" style={{ color }} />
        </a>
      ))}
    </div>
  );
};

export default ClubSocialRow;
