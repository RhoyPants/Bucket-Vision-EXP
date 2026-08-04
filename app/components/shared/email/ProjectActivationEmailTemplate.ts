export type ActivationAssignmentGroup = {
  taskId: string;
  taskTitle: string;
  taskAssignedDirectly: boolean;
  subtasks: Array<{
    id: string;
    title: string;
    priority?: string;
    projectedEndDate?: string;
  }>;
};

export interface ProjectActivationEmailData {
  recipientName: string;
  recipientRole: string;
  projectName: string;
  pin: string;
  priority: string;
  projectedStart: string;
  projectedEnd: string;
  activatedDate: string;
  assignments: ActivationAssignmentGroup[];
  assignmentsUrl: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const safeDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function buildProjectActivationEmailHTML(
  data: ProjectActivationEmailData,
): string {
  const safe = {
    ...data,
    recipientName: escapeHtml(data.recipientName),
    recipientRole: escapeHtml(data.recipientRole),
    projectName: escapeHtml(data.projectName),
    pin: escapeHtml(data.pin),
    priority: escapeHtml(data.priority),
    projectedStart: escapeHtml(data.projectedStart),
    projectedEnd: escapeHtml(data.projectedEnd),
    activatedDate: escapeHtml(data.activatedDate),
    assignmentsUrl: escapeHtml(data.assignmentsUrl),
  };

  const assignmentContent = data.assignments.length
    ? data.assignments
        .map((group) => {
          const subtaskRows = group.subtasks
            .map((subtask) => {
              const details = [
                subtask.priority ? `Priority: ${escapeHtml(subtask.priority)}` : "",
                subtask.projectedEndDate
                  ? `Due: ${escapeHtml(safeDate(subtask.projectedEndDate))}`
                  : "",
              ].filter(Boolean);
              return `<li style="margin:8px 0;color:#374151">
                <strong>${escapeHtml(subtask.title)}</strong>
                ${details.length ? `<div style="color:#6b7280;font-size:12px;margin-top:2px">${details.join(" &middot; ")}</div>` : ""}
              </li>`;
            })
            .join("");

          return `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0;background:#fafafa">
            <div style="font-weight:700;color:#4B2E83;font-size:15px">${escapeHtml(group.taskTitle)}</div>
            ${group.taskAssignedDirectly ? '<div style="color:#047857;font-size:12px;font-weight:700;margin-top:4px">Task assigned to you</div>' : ""}
            ${subtaskRows ? `<ul style="padding-left:20px;margin:10px 0 0">${subtaskRows}</ul>` : ""}
          </div>`;
        })
        .join("")
    : `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 16px;color:#78350f;margin:20px 0">
        You are part of this active project, but no task has been assigned to you yet.
      </div>`;

  const detailRows = [
    ["Project Name", safe.projectName],
    ["PIN", safe.pin],
    ["Your Role", safe.recipientRole],
    ["Priority", safe.priority],
    ["Projected Start", safe.projectedStart],
    ["Projected End", safe.projectedEnd],
    ["Activated", safe.activatedDate],
  ]
    .map(
      ([label, value], index) => `<tr style="background:${index % 2 ? "#ffffff" : "#f9f6ff"}">
        <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:700;color:#4B2E83;width:38%">${label}</td>
        <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#1f2937">${value}</td>
      </tr>`,
    )
    .join("");

  return `<div style="font-family:Arial,sans-serif;background:#f3f4f6;padding:24px">
    <div style="max-width:640px;margin:0 auto">
      <div style="background:#4B2E83;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px">V.I.S.I.O.N</h1>
        <p style="color:rgba(255,255,255,.75);margin:5px 0 0;font-size:13px">Project Management System</p>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px">
        <h2 style="color:#111827;margin:0 0 12px;font-size:20px">Hi ${safe.recipientName},</h2>
        <p style="color:#4b5563;line-height:1.6;margin:0 0 20px">
          You have a new active project. <strong style="color:#4B2E83">${safe.projectName}</strong>
          has received final approval and is now active. Below are the tasks and subtasks assigned to you.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">${detailRows}</table>
        <h3 style="color:#111827;font-size:17px;margin:0 0 8px">Your Assigned Work</h3>
        ${assignmentContent}
        <div style="text-align:center;margin:28px 0 8px">
          <a href="${safe.assignmentsUrl}" style="display:inline-block;background:#4B2E83;color:#fff;padding:13px 30px;border-radius:6px;text-decoration:none;font-weight:700">
            View My Assigned Tasks &rarr;
          </a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:22px">
          If the button does not work, copy this link:<br>
          <a href="${safe.assignmentsUrl}" style="color:#4B2E83">${safe.assignmentsUrl}</a>
        </p>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:14px">
        &copy; ${new Date().getFullYear()} V.I.S.I.O.N &middot; Global Visions Holdings Inc.
      </p>
    </div>
  </div>`.trim();
}
