"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";

import KanbanBoard from "@/app/components/shared/kanban/KanbanBoard";

import { getTaskById } from "@/app/redux/controllers/taskController";
import { mapTaskToKanban } from "@/app/utils/kanbanAdapter";

import { setSubtasks } from "@/app/redux/slices/kanbanSlice";
import Layout from "@/app/components/shared/Layout";

export default function TaskBoardPage() {
  const dispatch = useAppDispatch();

  const subtasks = useAppSelector((state) => state.kanban.subtasks);

  const [columns, setColumns] = useState<any[]>([]);

  const taskId = "d7f19adc-1a13-48e0-888e-3c3d3f6e959e";

  useEffect(() => {
    const load = async () => {
      const task = await getTaskById(taskId);

      const mapped = mapTaskToKanban(task);

      // ✅ Save to Redux
      dispatch(setSubtasks(mapped.subtasks));

      // ✅ Columns local state
      setColumns(mapped.columns);
    };

    load();
  }, [taskId]);

  return (
    <Layout>
      <KanbanBoard
        parentTaskId={taskId}
        columns={columns}
        subtasks={subtasks}
        onViewDetails={(subtask) => {
          console.log("VIEW:", subtask);
        }}
      />
    </Layout>
  );
}
