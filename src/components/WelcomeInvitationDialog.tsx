import { ArrowRight, MessageCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface WelcomeInvitationDialogProps {
  enabled: boolean;
  title: string;
  body: string;
  onChat: () => void;
  onExplore: () => void;
}

export function WelcomeInvitationDialog({ enabled, title, body, onChat, onExplore }: WelcomeInvitationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) dialog.showModal();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  const close = () => {
    dialogRef.current?.close();
  };

  const chooseChat = () => {
    close();
    onChat();
  };

  const chooseExplore = () => {
    close();
    onExplore();
  };

  return (
    <dialog ref={dialogRef} className="invitation-dialog">
      <button className="icon-button invitation-close" type="button" onClick={close} aria-label="关闭邀请">
        <X size={20} />
      </button>
      <div className="invitation-accent" />
      <p className="eyebrow">一封校园合伙邀请</p>
      <h2>{title}</h2>
      <div className="invitation-copy">
        {body.split(/\n{2,}/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <div className="invitation-actions">
        <button className="button primary" type="button" onClick={chooseChat}><MessageCircle size={18} />我想先聊聊</button>
        <button className="button secondary" type="button" onClick={chooseExplore}>查看合作方式<ArrowRight size={17} /></button>
      </div>
      <p className="invitation-signature">浩航科技 · 山东高校校园合作计划</p>
    </dialog>
  );
}
