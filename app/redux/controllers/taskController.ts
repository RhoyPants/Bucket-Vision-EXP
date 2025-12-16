import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import { aes_int_decrypt, aes_int_encrypt } from "@/app/lib/encryptdecrypt";
import { setTasks } from "../slices/taskSlice";

export const getTasksByProject = (projectRefNo: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      // Encrypt payload BEFORE sending
      const encryptedPayload = aes_int_encrypt(
        JSON.stringify({ project_refno: projectRefNo })
      );

      // Send request
      const res = await axiosApi.post("/task/getByProject", {
        data: encryptedPayload,
      });

      // Decrypt backend response
      const decryptedText = aes_int_decrypt(res.data.data);
      const parsedTasks = JSON.parse(decryptedText);
      // Save to Redux
      dispatch(setTasks(parsedTasks));

      return parsedTasks;
    } catch (err) {
      console.error("❌ Error loading tasks by project:", err);
      throw err;
    }
  };
};
