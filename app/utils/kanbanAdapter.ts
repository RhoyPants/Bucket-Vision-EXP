export function mapTaskToKanban(task: any) {
  const columns = task.statuses.map((s: any) => ({
    id: s.id,
    title: s.name,
  }));

  const subtasks = task.subtasks.map((s: any) => ({
    id: s.id,
    title: s.title,
    description: s.description,

    statusId: s.statusId,
    order: s.order,
    parentTaskId: s.taskId,

    assignee: s.assignees?.[0]?.userId ?? null,

    priority: s.priority,
    progress: s.progress ?? 0,

    startDate: s.startDate,
    endDate: s.dueDate,

    checklists: s.checklists || [],
  }));

  return {
    columns,
    subtasks,
    taskProgress: task.progress ?? 0,
  };
}