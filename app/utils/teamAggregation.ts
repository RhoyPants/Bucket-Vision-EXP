/**
 * Team Overview Data Aggregation Utility
 * Calculates team stats and member workload from full project tree
 */

export interface TeamStats {
  totalMembers: number;
  totalAssignedSubtasks: number;
  completedSubtasks: number;
  inProgressSubtasks: number;
  pendingSubtasks: number;
  overdueSubtasks: number;
  averageProgress: number;
}

export interface MemberWorkload {
  userId: string;
  memberName: string;
  userEmail?: string;
  role?: string;
  assigned: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  progressPercent: number;
  subtasks: Array<{
    id: string;
    title: string;
    progress: number;
    status: "pending" | "in-progress" | "completed" | "overdue";
    projectedEndDate?: string;
  }>;
}

/**
 * Gets status from progress percentage
 */
export const getSubtaskStatus = (
  progress: number,
  projectedEndDate?: string
): "pending" | "in-progress" | "completed" | "overdue" => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (progress === 100) return "completed";

  if (projectedEndDate) {
    const dueDate = new Date(projectedEndDate);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate < today && progress < 100) {
      return "overdue";
    }
  }

  return progress > 0 ? "in-progress" : "pending";
};

/**
 * Aggregates team stats from full project tree or multiple projects
 */
export const aggregateTeamStats = (
  fullProject: any | null,
  multipleProjects?: any[]
): TeamStats => {
  const projectsToAggregate = multipleProjects && multipleProjects.length > 0 
    ? multipleProjects 
    : fullProject 
      ? [fullProject]
      : [];

  if (projectsToAggregate.length === 0) {
    return {
      totalMembers: 0,
      totalAssignedSubtasks: 0,
      completedSubtasks: 0,
      inProgressSubtasks: 0,
      pendingSubtasks: 0,
      overdueSubtasks: 0,
      averageProgress: 0,
    };
  }

  const memberIds = new Set<string>();
  let totalAssignedSubtasks = 0;
  let completedSubtasks = 0;
  let inProgressSubtasks = 0;
  let pendingSubtasks = 0;
  let overdueSubtasks = 0;
  let totalProgress = 0;
  let progressCount = 0;

  // Iterate through all projects
  projectsToAggregate.forEach((project: any) => {
    if (!project?.categories) return;

    project.categories.forEach((category: any) => {
      if (category.tasks) {
        category.tasks.forEach((task: any) => {
          if (task.subtasks) {
            task.subtasks.forEach((subtask: any) => {
              totalAssignedSubtasks++;
              totalProgress += subtask.progress || 0;
              progressCount++;

              const status = getSubtaskStatus(
                subtask.progress,
                subtask.projectedEndDate
              );

              if (status === "completed") {
                completedSubtasks++;
              } else if (status === "in-progress") {
                inProgressSubtasks++;
              } else if (status === "overdue") {
                overdueSubtasks++;
              } else if (status === "pending") {
                pendingSubtasks++;
              }

              // Track unique members
              if (subtask.assignees && Array.isArray(subtask.assignees)) {
                subtask.assignees.forEach((assignee: any) => {
                  if (assignee.userId) {
                    memberIds.add(assignee.userId);
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  return {
    totalMembers: memberIds.size,
    totalAssignedSubtasks,
    completedSubtasks,
    inProgressSubtasks,
    pendingSubtasks,
    overdueSubtasks,
    averageProgress:
      progressCount > 0 ? Math.round(totalProgress / progressCount) : 0,
  };
};

/**
 * Aggregates member workload from full project tree or multiple projects
 */
export const aggregateMemberWorkload = (
  fullProject: any | null,
  multipleProjects?: any[]
): Record<string, MemberWorkload> => {
  const memberWorkload: Record<string, MemberWorkload> = {};

  const projectsToAggregate =
    multipleProjects && multipleProjects.length > 0
      ? multipleProjects
      : fullProject
        ? [fullProject]
        : [];

  if (projectsToAggregate.length === 0) {
    return memberWorkload;
  }

  // Iterate through all projects
  projectsToAggregate.forEach((project: any) => {
    if (!project?.categories) return;

    project.categories.forEach((category: any) => {
      if (category.tasks) {
        category.tasks.forEach((task: any) => {
          if (task.subtasks) {
            task.subtasks.forEach((subtask: any) => {
              if (subtask.assignees && Array.isArray(subtask.assignees)) {
                subtask.assignees.forEach((assignee: any) => {
                  const userId = assignee.userId;
                  if (!userId) return;

                  // Initialize member entry if not exists
                  if (!memberWorkload[userId]) {
                    memberWorkload[userId] = {
                      userId,
                      memberName: assignee.user?.name || "Unknown",
                      userEmail: assignee.user?.email || "",
                      assigned: 0,
                      completed: 0,
                      inProgress: 0,
                      pending: 0,
                      overdue: 0,
                      progressPercent: 0,
                      subtasks: [],
                    };
                  }

                  const member = memberWorkload[userId];
                  const status = getSubtaskStatus(
                    subtask.progress,
                    subtask.projectedEndDate
                  );

                  const subtaskRecord = {
                    id: subtask.id,
                    title: subtask.title,
                    progress: subtask.progress || 0,
                    status,
                    projectedEndDate: subtask.projectedEndDate,
                  };

                  member.subtasks.push(subtaskRecord);
                  member.assigned++;

                  if (status === "completed") {
                    member.completed++;
                  } else if (status === "in-progress") {
                    member.inProgress++;
                  } else if (status === "overdue") {
                    member.overdue++;
                  } else if (status === "pending") {
                    member.pending++;
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  // Calculate progress percent for each member
  Object.values(memberWorkload).forEach((member) => {
    if (member.assigned > 0) {
      const totalProgress = member.subtasks.reduce(
        (sum, s) => sum + s.progress,
        0
      );
      member.progressPercent = Math.round(
        totalProgress / member.assigned
      );
    }
  });

  return memberWorkload;
};

/**
 * Gets sorted member workload (by progress descending by default)
 */
export const getSortedMembers = (
  memberWorkload: Record<string, MemberWorkload>,
  sortBy: "progress" | "assigned" | "name" = "progress"
): MemberWorkload[] => {
  const members = Object.values(memberWorkload);

  switch (sortBy) {
    case "progress":
      return members.sort((a, b) => b.progressPercent - a.progressPercent);
    case "assigned":
      return members.sort((a, b) => b.assigned - a.assigned);
    case "name":
      return members.sort((a, b) =>
        a.memberName.localeCompare(b.memberName)
      );
    default:
      return members;
  }
};

/**
 * Gets status color for UI
 */
export const getStatusColor = (
  status: "pending" | "in-progress" | "completed" | "overdue"
): string => {
  switch (status) {
    case "pending":
      return "#9CA3AF"; // gray
    case "in-progress":
      return "#3B82F6"; // blue
    case "completed":
      return "#10B981"; // green
    case "overdue":
      return "#EF4444"; // red
    default:
      return "#6B7280"; // gray
  }
};
