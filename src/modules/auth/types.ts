export const staffRoles = [
  "system_administrator",
  "school_leadership",
  "admissions_family_liaison",
  "office_attendance",
  "content_publisher_translator",
  "marketing_outreach",
] as const;

export type StaffRole = (typeof staffRoles)[number];

export const staffPermissions = [
  "dashboard.view",
  "dashboard.view_content_metrics",
  "dashboard.view_campaign_metrics",
  "leads.view",
  "leads.create",
  "leads.update",
  "leads.export",
  "leads.attribution.update",
  "duplicates.review",
  "students.view",
  "students.create",
  "students.update",
  "students.export",
  "students.view_applicant_projection",
  "enrollment.view",
  "enrollment.update",
  "attendance.view",
  "attendance.mark",
  "attendance.export",
  "messages.view",
  "messages.send",
  "messages.translate_assigned",
  "announcements.view",
  "announcements.draft",
  "announcements.publish",
  "announcements.share_assigned",
  "reports.view",
  "reports.export",
  "reports.outreach.export_deidentified",
  "profile_requests.review",
  "roles.administer",
  "audit.view",
  "audit.export",
  "audit.view_module",
  "documents.share",
] as const;

export type Permission = (typeof staffPermissions)[number];
export type PortalAudience = "staff" | "guardian";
export type PortalLocale = "en" | "ar" | "so";

export type PortalSession = {
  user: {
    id: string;
    displayName: string;
    email: string | null;
    locale: PortalLocale;
  };
  audience: PortalAudience;
  role: StaffRole | null;
  permissions: readonly Permission[];
};
