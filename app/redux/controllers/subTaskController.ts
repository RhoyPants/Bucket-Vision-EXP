import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import {
  setSubtasks,
  updateSubtaskStatus,
  reorderSubtasksForParent,
  toggleChecklistLocal,
} from "../slices/kanbanSlice";

import { mapTaskToKanban } from "@/app/utils/kanbanAdapter"; // USE THIS
import { updateTaskProgress } from "../slices/taskSlice";

//  LOAD FULL TASK (KANBAN READY)
export const loadKanbanByTask = (taskId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      // IMPORTANT: use GET TASK (not subtasks endpoint)
      const res = await axiosApi.get(`/tasks/${taskId}`);

      const { columns, subtasks } = mapTaskToKanban(res.data);

      //set subtasks
      dispatch(setSubtasks(subtasks));

      // columns will be handled in component (next file)

      return { columns, subtasks };
    } catch (err) {
      console.error("❌ Error loading kanban:", err);
      throw err;
    }
  };
};

//CREATE SUBTASK
export const createSubtask = (data: {
  title: string;
  taskId: string;
  statusId: string;
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.post("/subtasks", data);

      // reload kanban after create
      await dispatch(loadKanbanByTask(data.taskId));

      return res.data;
    } catch (err) {
      console.error("Error creating subtask:", err);
      throw err;
    }
  };
};

// UPDATE SUBTASK
export const updateSubtask = (id: string, data: any) => {
  return async () => {
    try {
      const res = await axiosApi.put(`/subtasks/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("Error updating subtask:", err);
      throw err;
    }
  };
};

// DELETE SUBTASK
export const deleteSubtask = (id: string) => {
  return async () => {
    try {
      await axiosApi.delete(`/subtasks/${id}`);
    } catch (err) {
      console.error("Error deleting subtask:", err);
      throw err;
    }
  };
};

// DRAG MOVE
export const moveSubtask = (params: {
  id: string;
  statusId: string;
  order: number;
  parentTaskId: string;
  orderedIds: string[];
}) => {
  return async (dispatch: AppDispatch) => {
    const { id, statusId, order, parentTaskId, orderedIds } = params;

    try {
      //  FIXED (statusId, not status)
      dispatch(updateSubtaskStatus({ id, statusId }));
      dispatch(reorderSubtasksForParent({ parentTaskId, orderedIds }));

      await axiosApi.patch(`/subtasks/${id}/move`, {
        statusId,
        order,
      });
    } catch (err) {
      console.error("Error moving subtask:", err);
      throw err;
    }
  };
};

export const toggleChecklist = (checklistId: string, taskId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.patch(
        `/subtasks/checklists/${checklistId}/toggle`,
      );

      // update checklist locally
      dispatch(toggleChecklistLocal({ checklistId }));

      // OPTIONAL: update status if changed
      const updated = res.data;
      await dispatch(loadKanbanByTask(taskId));
      dispatch(
        updateTaskProgress({
          taskId,
          progress: res.data.taskProgress,
        }),
      );

      dispatch(
        updateSubtaskStatus({
          id: updated.id,
          statusId: updated.statusId,
        }),
      );

      return updated;
    } catch (err) {
      console.error(" Error toggling checklist:", err);
      throw err;
    }
  };
};

export const addChecklist = (data: { subtaskId: string; title: string }) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.post("/subtasks/checklists", data);

      // 🔥 easiest (for now): reload task
      return res.data;
    } catch (err) {
      console.error("❌ Error adding checklist:", err);
      throw err;
    }
  };
};
export const deleteChecklist = (checklistId: string) => {
  return async () => {
    try {
      await axiosApi.delete(`/subtasks/checklists/${checklistId}`);
    } catch (err) {
      console.error("❌ Error deleting checklist:", err);
      throw err;
    }
  };
};
