import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { api } from "../lib/api";
import { getSessionId, getSource } from "../lib/analytics";
import { ContactChannels } from "./ContactChannels";

interface ContactDialogProps {
  open: boolean;
  onClose: () => void;
  enterpriseQrUrl?: string;
  enterpriseLabel: string;
  personalQrUrl?: string;
  personalLabel: string;
}

export function ContactDialog({ open, onClose, enterpriseQrUrl, enterpriseLabel, personalQrUrl, personalLabel }: ContactDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      void api.trackEvent({
        name: "consult_click",
        path: window.location.pathname,
        source: getSource(),
        sessionId: getSessionId(),
      }).catch(() => undefined);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog ref={dialogRef} className="contact-dialog" onClose={onClose} onClick={(event) => {
      if (event.target === dialogRef.current) onClose();
    }}>
      <button type="button" className="icon-button dialog-close" onClick={onClose} aria-label="关闭">
        <X size={20} />
      </button>
      <p className="eyebrow">联系负责人</p>
      <h2>先认识，再确认合作</h2>
      <p>建议先添加私人微信沟通，确认合作意向后再邀请进入企业微信。</p>
      <ContactChannels
        enterpriseQrUrl={enterpriseQrUrl}
        enterpriseLabel={enterpriseLabel}
        personalQrUrl={personalQrUrl}
        personalLabel={personalLabel}
      />
    </dialog>
  );
}
