import { sendEmail } from "@/app/api-service/emailService";
import type { ProgressUpdateRequest } from "@/app/api-service/progressUpdateRequestService";
import { buildProgressUpdateEmailHTML, progressEmailConfig, type ProgressEmailEvent } from "@/app/components/shared/email/ProgressUpdateEmailTemplate";

export async function notifyProgressUpdate(event: ProgressEmailEvent, request: ProgressUpdateRequest) {
  const recipient = event === "APPROVED" || event === "REJECTED" ? request.requestedBy : request.assignedApprover || request.assignedBuHead;
  if (!recipient?.email) return { sent: false, reason: "Recipient email is unavailable" };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${baseUrl}${event === "SUBMITTED" || event === "CANCELLED" ? "/myApprovals?tab=progress" : "/myRequests?tab=progress"}`;
  const project = request.project?.name || request.context?.projectName || "Project";
  const style = progressEmailConfig[event];
  await sendEmail({ to: recipient.email, subject: `${style.title} - ${project}`, message: buildProgressUpdateEmailHTML(event, request, recipient.name || "there", url) });
  return { sent: true };
}
