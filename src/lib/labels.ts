import type { ApplicationStatus } from "../types";
import { defaultContent } from "../data/defaultContent";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "待联系",
  approved: "已通过",
  not_suitable: "暂不合适",
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as Array<[ApplicationStatus, string]>;

const SERVICE_LABELS = Object.fromEntries(defaultContent.services.map((service) => [service.id, service.shortTitle]));

export function labelInterests(ids: string[]): string {
  return ids.map((id) => SERVICE_LABELS[id] || id).join("、");
}
