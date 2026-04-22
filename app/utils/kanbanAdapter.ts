export function mapTaskToKanban(task: any) {
  const columns = [
    { id: 0, title: "Pending" },
    { id: 1, title: "Ongoing" },
    { id: 2, title: "Done" },
  ];

  const subtasks = (task.subtasks || []).map((s: any) => ({
    // 🔥 KEEP EVERYTHING FROM BACKEND
    ...s,

    // ✅ normalize ONLY what you need
    parentTaskId: s.taskId,

    // 🔥 FIX DATE MAPPING (VERY IMPORTANT)
    startDate: s.projectedStartDate,
    endDate: s.projectedEndDate,

    // fallback safety
    status: s.status ?? 0,
    progress: s.progress ?? 0,

    assignee: s.assignees?.[0]?.userId ?? null,
    checklists: s.checklists || [],
  }));

  return {
    columns,
    subtasks,
    taskProgress: task.progress ?? 0,
  };
}