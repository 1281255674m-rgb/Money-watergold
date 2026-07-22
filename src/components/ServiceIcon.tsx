import { BookOpenCheck, GraduationCap, Presentation, Recycle, Sparkles } from "lucide-react";
import type { ServiceItem } from "../types";

const icons = {
  recycle: Recycle,
  presentation: Presentation,
  learning: BookOpenCheck,
  planning: GraduationCap,
  sparkles: Sparkles,
};

export function ServiceIcon({ icon, size = 24 }: { icon: ServiceItem["icon"]; size?: number }) {
  const Icon = icons[icon];
  return <Icon size={size} strokeWidth={1.7} />;
}
