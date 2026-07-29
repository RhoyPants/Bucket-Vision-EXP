import axiosApi from "@/app/lib/axios";
import { sendEmail } from "@/app/api-service/emailService";
import { buildProjectCompletionEmailHTML } from "@/app/components/shared/email/ProjectCompletionEmailTemplate";

type Recipient = {
  id?: string;
  name?: string;
  email?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
  approver?: {
    id?: string;
    name?: string;
    email?: string;
  };
  approverName?: string;
  approverEmail?: string;
};

type CompletionProject = {
  name?: string;
  pin?: string;
  owner?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
  projectOwner?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
};

type CompletionNotificationOptions = {
  projectId: string;
  project: CompletionProject;
  members: {
    owner?: Recipient[];
    subOwners?: Recipient[];
    members?: Recipient[];
  };
  actualEndDate: string;
  remarks?: string;
  completedBy?: string;
};

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeRecipient = (recipient: Recipient) => ({
  id: recipient.user?.id || recipient.approver?.id || recipient.id,
  name:
    recipient.user?.name ||
    recipient.approver?.name ||
    recipient.approverName ||
    recipient.name ||
    "Project stakeholder",
  email:
    recipient.user?.email ||
    recipient.approver?.email ||
    recipient.approverEmail ||
    recipient.email,
});

export async function notifyProjectCompletion({
  projectId,
  project,
  members,
  actualEndDate,
  remarks,
  completedBy,
}: CompletionNotificationOptions) {
  const approvalResponse = await axiosApi.get(`/approvals/${projectId}`);
  const approvalData = approvalResponse.data?.data;
  const approvals: Recipient[] = Array.isArray(approvalData)
    ? approvalData
    : Array.isArray(approvalData?.approvals)
      ? approvalData.approvals
      : Array.isArray(approvalResponse.data?.approvals)
        ? approvalResponse.data.approvals
        : [];

  const owner = project.owner || project.projectOwner;
  const recipients: Recipient[] = [
    ...(members.owner || []),
    ...(members.subOwners || []),
    ...(members.members || []),
    ...approvals,
    ...(owner ? [owner] : []),
  ];

  // Email is the final delivery address, so it is also the safest deduplication
  // key when the same user appears as an owner, member, and approver.
  const uniqueRecipients = new Map<
    string,
    { id?: string; name: string; email: string }
  >();
  recipients.map(normalizeRecipient).forEach((recipient) => {
    const email = recipient.email?.trim().toLowerCase();
    if (!email || uniqueRecipients.has(email)) return;
    uniqueRecipients.set(email, {
      ...recipient,
      email,
    });
  });

  const projectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/projectDashboard/${projectId}?view=project-info`
      : "";
  const completionDate = formatDate(actualEndDate);
  const results = await Promise.allSettled(
    Array.from(uniqueRecipients.values()).map((recipient) =>
      sendEmail({
        to: recipient.email,
        subject: `Project Completed — ${project.name || "Project"}`,
        message: buildProjectCompletionEmailHTML({
          recipientName: recipient.name,
          projectName: project.name || "Project",
          pin: project.pin || "—",
          completionDate,
          remarks: remarks || "No remarks provided",
          completedBy: completedBy || "Project owner",
          projectUrl,
        }),
      }),
    ),
  );

  const failed = results.filter((result) => result.status === "rejected");
  failed.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("Project completion email failed:", result.reason);
    }
  });

  return {
    recipients: uniqueRecipients.size,
    sent: results.length - failed.length,
    failed: failed.length,
  };
}
