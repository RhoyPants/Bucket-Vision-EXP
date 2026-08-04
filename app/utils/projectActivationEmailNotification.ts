import axiosApi from "@/app/lib/axios";
import { sendEmail } from "@/app/api-service/emailService";
import {
  ActivationAssignmentGroup,
  buildProjectActivationEmailHTML,
} from "@/app/components/shared/email/ProjectActivationEmailTemplate";

type Person = {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  projectRole?: string;
  role?: string;
  user?: { id?: string; name?: string; email?: string };
};

type Assignee = Person & {
  approver?: { id?: string; name?: string; email?: string };
};

type WorkItem = {
  id?: string;
  title?: string;
  name?: string;
  status?: string;
  priority?: string;
  projectedEndDate?: string;
  expectedEndDate?: string;
  assignees?: Assignee[];
  assignedUsers?: Assignee[];
  users?: Assignee[];
  userIds?: string[];
};

type ProjectStructure = {
  id?: string;
  name?: string;
  pin?: string;
  priority?: string;
  status?: string;
  startDate?: string;
  expectedEndDate?: string;
  activatedAt?: string;
  updatedAt?: string;
  scopes?: Array<{
    tasks?: Array<WorkItem & { subtasks?: WorkItem[] }>;
  }>;
};

type GroupedMembers = {
  owner?: Person[];
  subOwners?: Person[];
  members?: Person[];
};

const unwrap = <T,>(value: T | { data?: T }): T =>
  (value && typeof value === "object" && "data" in value
    ? (value as { data?: T }).data
    : value) as T;

const normalizePerson = (person: Person, fallbackRole: string) => ({
  id: String(person.user?.id || person.userId || person.id || ""),
  name: person.user?.name || person.name || "Project team member",
  email: (person.user?.email || person.email || "").trim().toLowerCase(),
  role: person.projectRole || person.role || fallbackRole,
});

const assigneeIds = (item: WorkItem) => {
  const ids = new Set((item.userIds || []).map(String));
  for (const assignee of [
    ...(item.assignees || []),
    ...(item.assignedUsers || []),
    ...(item.users || []),
  ]) {
    const id =
      assignee.user?.id ||
      assignee.approver?.id ||
      assignee.userId ||
      assignee.id;
    if (id) ids.add(String(id));
  }
  return ids;
};

const isExcluded = (item: WorkItem) =>
  ["CANCELLED", "DELETED", "INACTIVE"].includes(
    String(item.status || "").toUpperCase(),
  );

const assignmentsFor = (
  project: ProjectStructure,
  userId: string,
): ActivationAssignmentGroup[] => {
  if (!userId) return [];
  const groups = new Map<string, ActivationAssignmentGroup>();

  for (const scope of project.scopes || []) {
    for (const task of scope.tasks || []) {
      if (isExcluded(task)) continue;
      const taskId = String(task.id || task.title || task.name || "task");
      const direct = assigneeIds(task).has(userId);
      const subtasks = (task.subtasks || [])
        .filter(
          (subtask) =>
            !isExcluded(subtask) && assigneeIds(subtask).has(userId),
        )
        .map((subtask) => ({
          id: String(subtask.id || subtask.title || subtask.name || "subtask"),
          title: subtask.title || subtask.name || "Untitled subtask",
          priority: subtask.priority,
          projectedEndDate:
            subtask.projectedEndDate || subtask.expectedEndDate,
        }));

      if (!direct && !subtasks.length) continue;
      groups.set(taskId, {
        taskId,
        taskTitle: task.title || task.name || "Untitled task",
        taskAssignedDirectly: direct,
        subtasks: Array.from(
          new Map(subtasks.map((subtask) => [subtask.id, subtask])).values(),
        ),
      });
    }
  }
  return Array.from(groups.values());
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export async function notifyProjectActivated(projectId: string) {
  const notificationKey = `project-activation-email:${projectId}`;
  if (
    typeof window !== "undefined" &&
    window.localStorage.getItem(notificationKey) === "sent"
  ) {
    return { recipients: 0, sent: 0, failed: 0, skipped: true };
  }

  const [projectResponse, membersResponse] = await Promise.all([
    axiosApi.get(`/projects/${projectId}/full`),
    axiosApi.get(`/projects/${projectId}/members`),
  ]);
  const project = unwrap<ProjectStructure>(projectResponse.data);
  const members = unwrap<GroupedMembers>(membersResponse.data) || {};

  if (String(project?.status || "").toUpperCase() !== "ACTIVE") {
    return { recipients: 0, sent: 0, failed: 0, skipped: true };
  }

  const uniqueRecipients = new Map<
    string,
    ReturnType<typeof normalizePerson>
  >();
  const addPeople = (people: Person[] | undefined, role: string) => {
    for (const person of people || []) {
      const normalized = normalizePerson(person, role);
      if (!normalized.email || uniqueRecipients.has(normalized.email)) continue;
      uniqueRecipients.set(normalized.email, normalized);
    }
  };
  addPeople(members.owner, "OWNER");
  addPeople(members.subOwners, "SUB_OWNER");
  addPeople(members.members, "MEMBER");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const assignmentsUrl = `${origin}/projectDashboard/${projectId}?view=project-structure`;
  const jobs = Array.from(uniqueRecipients.values()).map((recipient) =>
    sendEmail({
      to: recipient.email,
      subject: `New Active Project and Assigned Tasks — ${project.name || "Project"}`,
      message: buildProjectActivationEmailHTML({
        recipientName: recipient.name,
        recipientRole: recipient.role.replaceAll("_", " "),
        projectName: project.name || "Project",
        pin: project.pin || "—",
        priority: project.priority || "—",
        projectedStart: formatDate(project.startDate),
        projectedEnd: formatDate(project.expectedEndDate),
        activatedDate: formatDate(
          project.activatedAt || project.updatedAt || new Date().toISOString(),
        ),
        assignments: assignmentsFor(project, recipient.id),
        assignmentsUrl,
      }),
    }),
  );
  const results = await Promise.allSettled(jobs);
  const failed = results.filter((result) => result.status === "rejected");

  failed.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("Project activation email failed:", result.reason);
    }
  });

  if (typeof window !== "undefined" && failed.length === 0) {
    window.localStorage.setItem(notificationKey, "sent");
  }

  return {
    recipients: uniqueRecipients.size,
    sent: results.length - failed.length,
    failed: failed.length,
    skipped: false,
  };
}
