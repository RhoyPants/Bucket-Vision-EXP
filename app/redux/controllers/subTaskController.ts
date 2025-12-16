import axiosApi from "@/app/lib/axios"; // use your interceptor
import { AppDispatch } from "../store";
import { aes_int_decrypt, aes_int_encrypt } from "@/app/lib/encryptdecrypt";
import { setSubtasks } from "../slices/subTaskSlice";

export const getSubtasksByTask = (taskId: number) => {
  return async (dispatch: AppDispatch) => {
    try {
      const encryptedPayload = aes_int_encrypt(
        JSON.stringify({ task_id: taskId })
      );

      const res = await axiosApi.post("/subtask/getByTask", {
        data: encryptedPayload,
      });

      const decrypted = aes_int_decrypt(res.data.data);
      const parsed = JSON.parse(decrypted);

      dispatch(setSubtasks(parsed));
      return parsed;
    } catch (err) {
      console.error("❌ Error fetching subtasks:", err);
      throw err;
    }
  };
};
