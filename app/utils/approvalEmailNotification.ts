import axios from "@/app/lib/axios";
import { sendEmail } from "@/app/api-service/emailService";
import { buildApprovalEmailHTML } from "@/app/components/shared/email/ApprovalEmailTemplate";

type Approval = {
  status?: string;
  level?: string | number;
  order?: string | number;
  stepOrder?: string | number;
  sequence?: string | number;
  approver?: { email?: string; name?: string };
  approverEmail?: string;
  approverName?: string;
};

type ProjectDetails = {
  name?: string;
  pin?: string;
  priority?: string;
  startDate?: string;
  expectedEndDate?: string;
};

const dateLabel = (value?: string, includeTime = false) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        ...(includeTime
          ? {
              hour: "numeric",
              minute: "2-digit",
            }
          : {}),
      })
    : "—";

export const getApprovalStepOrder = (approval: Approval) => {
  for (const value of [approval.order, approval.stepOrder, approval.sequence, approval.level]) {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
  }

  // Approval levels are named, not numeric. BU Head is the first step and OP
  // is the next step; using Math.min directly on these strings returns NaN.
  switch (String(approval.level || "").toUpperCase()) {
    case "BU_HEAD":
      return 1;
    case "OP":
      return 2;
    default:
      return Number.MAX_SAFE_INTEGER;
  }
};

export async function notifyFirstApprovalStep(
  projectId: string,
  project: ProjectDetails,
  requestedBy?: string
) {
  const response = await axios.get(`/approvals/${projectId}`);
  const responseData = response.data?.data;
  const approvals: Approval[] = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseData?.approvals)
      ? responseData.approvals
      : Array.isArray(response.data?.approvals)
        ? response.data.approvals
        : [];

  const pending = approvals.filter(
    (approval) => approval.status?.toUpperCase() === "PENDING"
  );
  if (!pending.length) return;

  const firstOrder = Math.min(...pending.map(getApprovalStepOrder));
  const firstStep = pending.filter((approval) => getApprovalStepOrder(approval) === firstOrder);
  const approvalUrl = `${window.location.origin}/myApprovals`;

  const results = await Promise.allSettled(
    firstStep
      .map((approval) => ({
        email: approval.approver?.email || approval.approverEmail,
        name: approval.approver?.name || approval.approverName,
      }))
      .filter((approver) => Boolean(approver.email))
      .map((approver) =>
        sendEmail({
          to: approver.email!,
          subject: `New Approval Request — ${project.name || "Project"}`,
          message: buildApprovalEmailHTML({
            recipientName: approver.name || "Approver",
            projectName: project.name || "—",
            pin: project.pin || "—",
            priorityType: project.priority || "—",
            projectedStart: dateLabel(project.startDate),
            projectedEnd: dateLabel(project.expectedEndDate),
            requestedBy: requestedBy || "—",
            date: dateLabel(new Date().toISOString(), true),
            approvalUrl,
          }),
        })
      )
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("Approval email notification failed:", result.reason);
    }
  });
}
