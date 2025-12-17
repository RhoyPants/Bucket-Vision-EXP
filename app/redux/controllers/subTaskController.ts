import axiosApi from "@/app/lib/axios";
import { aes_int_decrypt, aes_int_encrypt } from "@/app/lib/encryptdecrypt";
import { AppDispatch } from "../store";
import {
  addSubtask,
  KanbanStatus,
  KanbanSubtask,
  setSubtasks,
  updateSubtaskStatus,
} from "@/app/redux/slices/kanbanSlice";

export const getSubtasksByTask = (task_id: number) => {
  return async (dispatch: AppDispatch, getState: any) => {
    try {
      // Auto token handled by axiosApi interceptor
      // Encrypt session token for payload
      const encryptedPayload = aes_int_encrypt(
        JSON.stringify({ task_id: task_id })
      );

      const res = await axiosApi.post(`/subtask/getByTask`, {
        data: encryptedPayload,
      });

      // Backend decrypt → ALWAYS returns JSON string
      const decrypted = aes_int_decrypt(res.data.data);
      const parsed = JSON.parse(decrypted);

      // Pull current projectId from Redux store
      const state = getState();
      const projectId = state.project?.currentProject?.project_id ?? null;

      const convertStatus = (raw: string): KanbanStatus => {
        switch (raw.toLowerCase()) {
          case "to do":
            return "todo";
          case "in progress":
            return "inprogress";
          case "review":
            return "review";
          case "completed":
            return "completed";
          default:
            return "todo";
        }
      };

      // Convert backend → Kanban format
      const mapped = parsed.map((s: any) => ({
        id: s.subtask_id.toString(),
        parentTaskId: task_id,
        projectId: 0, // or actual projectId if added later
        title: s.task_name,
        description: s.description,
        status: convertStatus(s.status),
        priority: s.priority,
        assignee: s.assigned_to?.[0] ?? null,
        assignedBy: s.assigned_by ?? null,
        startDate: s.start_date ?? null,
        endDate: s.end_date ?? null,
        progress: s.progress ?? 0,
        order: s.order_index ?? 0,
      }));

      dispatch(setSubtasks(mapped));
      return mapped;
    } catch (err) {
      console.error("❌ Error loading subtasks:", err);
      throw err;
    }
  };
};

export const updateSubtask = (subtask: KanbanSubtask) => {
  return async (dispatch: AppDispatch) => {
    try {
      const payload = {
        subtask_id: Number(subtask.id),
        task_name: subtask.title,
        description: subtask.description,
        start_date: subtask.startDate,
        end_date: subtask.endDate,
        assigned_to: subtask.assignee ? [subtask.assignee] : [],
        assigned_by: subtask.assignedBy,
        priority: subtask.priority,
        progress: subtask.progress ?? 0,
        subTaskIndex: subtask.order ?? 0,
        status: mapStatusToBackend(subtask.status),
      };

      // encrypt payload
      const encrypted = aes_int_encrypt(JSON.stringify(payload));

      await axiosApi.put("/subtask/update", {
        data: encrypted,
      });

      // local update
      dispatch(
        updateSubtaskStatus({
          id: subtask.id,
          status: subtask.status,
        })
      );
    } catch (err) {
      console.error("❌ Error updating subtask:", err);
      throw err;
    }
  };
};

// convert kanban → backend wording
const mapStatusToBackend = (status: string) => {
  switch (status) {
    case "todo":
      return "To Do";
    case "inprogress":
      return "In Progress";
    case "review":
      return "Review";
    case "completed":
      return "Completed";
    default:
      return "To Do";
  }
};

export const createSubtask = (task: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      // Build payload EXACTLY matching backend requirement
      const subTaskIndex = task.subtasks ? task.subtasks.length + 1 : 1;

      const payload = {
        task_id: task.task_id,
        task_name: task.task_name,
        description: task.description,
        start_date: task.start_date,
        end_date: task.end_date,
        assigned_to: task.assigned_to,
        assigned_by: task.assigned_by,
        priority: task.priority,
        progress: task.progress ?? 0,
        subTaskIndex: subTaskIndex,
      };

      // Encrypt payload
      const encrypted = aes_int_encrypt(JSON.stringify(payload));

      // API request
      const res = await axiosApi.post("/subtask/create", {
        data: encrypted,
      });

      // Decrypt backend response
      const decrypted = aes_int_decrypt(res.data.data);
      const created = JSON.parse(decrypted); // backend returns created subtask

      // Convert backend → KanbanSubtask format
      const newSubtask: KanbanSubtask = {
        id: created.subtask_id.toString(),
        parentTaskId: task.task_id,
        projectId: null,
        title: created.task_name,
        description: created.description,
        status: "todo", // backend default is TODO
        priority: created.priority,
        assignee: created.assigned_to?.[0] ?? null,
        assignedBy: created.assigned_by,
        startDate: created.start_date,
        endDate: created.end_date,
        progress: created.progress ?? 0,
        order: created.order_index ?? subTaskIndex,
      };

      // Insert into Redux Kanban subtasks
      dispatch(addSubtask(newSubtask));

      return newSubtask;
    } catch (error) {
      console.error("❌ Error creating subtask:", error);
      throw error;
    }
  };
};

