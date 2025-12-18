import axiosApi from "@/app/lib/axios";
import { aes_int_decrypt, aes_int_encrypt } from "@/app/lib/encryptdecrypt";
import { AppDispatch, RootState } from "../store";
import {
  addSubtask,
  KanbanStatus,
  KanbanSubtask,
  setLoading,
  setSubtasks,
  updateSubtaskStatus,
  updateSubtask as reduxUpdateSubtask,
} from "@/app/redux/slices/kanbanSlice";

// 🔥 GLOBAL CACHE (persists between fetches)
const userNameCache: Record<string, string> = {};

export const getSubtasksByTask = (task_id: number) => {
  return async (dispatch: AppDispatch, getState: any) => {
    try {
      dispatch(setLoading(true));

      // 🚫 DO NOT clear subtasks → causes flicker
      // dispatch(setSubtasks([]));

      const encryptedPayload = aes_int_encrypt(
        JSON.stringify({ task_id: task_id })
      );

      const res = await axiosApi.post(`/subtask/getByTask`, {
        data: encryptedPayload,
      });

      const decrypted = aes_int_decrypt(res.data.data);
      const parsed = JSON.parse(decrypted);

      const convertStatus = (raw: string): KanbanStatus => {
        switch (raw.toLowerCase()) {
          case "to do":
            return "todo";
          case "inprogress":
            return "inprogress";
          case "review":
            return "review";
          case "completed":
            return "completed";
          default:
            return "todo";
        }
      };

      // ---------------------------------------------------------
      // STEP 1 — Identify all unique assignee IDs
      // ---------------------------------------------------------
      const uniqueAssignees = [
        ...new Set(parsed.map((s: any) => s.assigned_to?.[0]).filter(Boolean)),
      ];

      // ---------------------------------------------------------
      // STEP 2 — Fetch user names (cached)
      // ---------------------------------------------------------
      for (const uid of uniqueAssignees) {
        const userId = String(uid);
        if (userNameCache[userId]) continue;

        try {
          const encryptedUser = aes_int_encrypt(
            JSON.stringify({ user_id: userId })
          );

          const userRes = await axiosApi.post(`/user/getUserById`, {
            data: encryptedUser,
          });

          const decryptedUser = aes_int_decrypt(userRes.data.data);
          const userParsed = JSON.parse(decryptedUser);

          userNameCache[userId] =
            userParsed.full_name || userParsed.name || "Unknown User";
        } catch (e) {
          console.warn("⚠ Failed to fetch user:", uid);
          userNameCache[userId] = "Unknown User";
        }
      }

      // ---------------------------------------------------------
      // STEP 3 — Map backend → Kanban format
      // ---------------------------------------------------------
      const mapped = parsed.map((s: any) => {
        const assigneeId = s.assigned_to?.[0] ?? null;

        return {
          id: String(s.subtask_id),
          parentTaskId: task_id,
          projectId: 0,
          title: s.task_name,
          description: s.description,
          status: convertStatus(s.status),
          priority: s.priority,
          assignee: assigneeId,
          assigneeName: userNameCache[assigneeId] || "",
          assignedBy: s.assigned_by ?? null,
          startDate: s.start_date ?? null,
          endDate: s.end_date ?? null,
          progress: s.progress ?? 0,
          order: s.order_index ?? 0,
        };
      });

      dispatch(setSubtasks(mapped));
      return mapped;
    } catch (err) {
      console.error("❌ Error loading subtasks:", err);
      throw err;
    }
  };
};

export const updateSubtask = (payload: any) => {
  return async (dispatch: AppDispatch,  getState: () => RootState) => {
    try {
      console.log("📤 Sending UPDATE payload:", payload);

      const encrypted = aes_int_encrypt(JSON.stringify(payload));

      await axiosApi.put("/subtask/update", {
        data: encrypted,
      });

      // If status changed (drag event)
      if (payload.status) {
        dispatch(
          updateSubtaskStatus({
            id: payload.subtask_id.toString(),
            status: payload.status.toLowerCase(),
          })
        );
      }

      // 🔥 FULL Redux sync (for modal update)
      const current = getState().kanban.subtasks.find(
        (s: KanbanSubtask) => s.id === String(payload.subtask_id)
      );

      if (current) {
        dispatch(
          reduxUpdateSubtask({
            ...current,
            title: payload.task_name ?? current.title,
            description: payload.description ?? current.description,
            priority: payload.priority ?? current.priority,
            startDate: payload.start_date ?? current.startDate,
            endDate: payload.end_date ?? current.endDate,
            assignee: payload.assigned_to?.[0] ?? current.assignee,
            status: payload.status?.toLowerCase() ?? current.status,
            progress: payload.progress ?? current.progress,
          })
        );
      }

      return true;
    } catch (err) {
      console.error("❌ Update Subtask Error:", err);
      throw err;
    }
  };
};

export const createSubtask = (data: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const payload = {
        task_id: data.task_id,
        task_name: data.task_name,
        description: data.description,
        start_date: data.start_date,
        end_date: data.end_date,
        assigned_to: data.assigned_to,
        assigned_by: data.assigned_by,
        status: data.status ?? "To Do",
        priority: data.priority,
        progress: data.progress ?? 0,
      };

      const encrypted = aes_int_encrypt(JSON.stringify(payload));

      const res = await axiosApi.post("/subtask/create", {
        data: encrypted,
      });

      const decrypted = aes_int_decrypt(res.data.data);
      const result = JSON.parse(decrypted);

      return result.new_subtask_id;
    } catch (error) {
      console.error("❌ Error creating subtask:", error);
      throw error;
    }
  };
};
