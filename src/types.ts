export type ApplicationStatus = "pending" | "approved" | "not_suitable";
export type ApplicantGrade = "大一" | "大二" | "大三" | "大四" | "大五" | "研究生" | "其他";

export interface ServiceItem {
  id: string;
  title: string;
  shortTitle: string;
  summary: string;
  details: string[];
  icon: "recycle" | "presentation" | "learning" | "planning" | "sparkles";
}

export interface RuleItem {
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PublicMetric {
  id: string;
  label: string;
  value: string;
  verified: boolean;
}

export interface SiteContent {
  brandName: string;
  brandTagline: string;
  companyName: string;
  slogan: string;
  heroEyebrow: string;
  heroDescription: string;
  recruitmentTitle: string;
  recruitmentDescription: string;
  invitationEnabled: boolean;
  invitationTitle: string;
  invitationBody: string;
  services: ServiceItem[];
  rules: RuleItem[];
  faqs: FaqItem[];
  publicMetrics: PublicMetric[];
  contactQrUrl: string;
  contactLabel: string;
  personalContactQrUrl: string;
  personalContactLabel: string;
  updatedAt: string;
}

export interface ApplicationInput {
  school: string;
  grade: ApplicantGrade;
  wechatId: string;
  phone?: string;
  interests: string[];
  ideas?: string;
  privacyAccepted: boolean;
  source: string;
  website?: string;
}

export interface ApplicationRecord extends Omit<ApplicationInput, "privacyAccepted" | "website"> {
  id: string;
  status: ApplicationStatus;
  agentCode?: string;
  adminNotes: string;
  duplicateSuspected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFilters {
  query?: string;
  school?: string;
  grade?: string;
  status?: ApplicationStatus | "";
  interest?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
}

export interface DashboardStats {
  pageViews: number;
  consultationClicks: number;
  applicationStarts: number;
  applicationSubmits: number;
  conversionRate: number;
  statusCounts: Record<ApplicationStatus, number>;
  sourceBreakdown: Array<{ name: string; count: number }>;
  schoolBreakdown: Array<{ name: string; count: number }>;
  recentApplications: ApplicationRecord[];
}

export interface AnalyticsEventInput {
  name: "page_view" | "consult_click" | "application_start" | "application_submit";
  path: string;
  source: string;
  sessionId: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
