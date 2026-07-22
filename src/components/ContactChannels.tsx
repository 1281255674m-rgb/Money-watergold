import { Building2, MessageCircle } from "lucide-react";

interface ContactChannelsProps {
  enterpriseQrUrl?: string;
  enterpriseLabel: string;
  personalQrUrl?: string;
  personalLabel: string;
  variant?: "hero" | "dialog" | "success";
}

export function ContactChannels({
  enterpriseQrUrl,
  enterpriseLabel,
  personalQrUrl,
  personalLabel,
  variant = "dialog",
}: ContactChannelsProps) {
  return (
    <div className={`contact-channels contact-channels-${variant}`}>
      {personalQrUrl && (
        <article className="contact-channel contact-channel-personal">
          <div className="contact-channel-title">
            <MessageCircle size={18} />
            <div><span>推荐先添加</span><h3>{personalLabel}</h3></div>
          </div>
          <img src={personalQrUrl} alt={`${personalLabel}二维码`} />
          <p>先沟通学校、资源和合作想法</p>
        </article>
      )}
      {enterpriseQrUrl && (
        <article className="contact-channel contact-channel-enterprise">
          <div className="contact-channel-title">
            <Building2 size={18} />
            <div><span>确认意向后</span><h3>{enterpriseLabel}</h3></div>
          </div>
          <img src={enterpriseQrUrl} alt={`${enterpriseLabel}二维码`} />
          <p>由负责人邀请进入企业微信</p>
        </article>
      )}
    </div>
  );
}
