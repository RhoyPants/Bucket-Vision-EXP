import { AppDispatch } from "../store";
import { setProjects } from "../slices/projectSlice";
import { aes_int_decrypt } from "@/app/lib/encryptdecrypt";
import axiosApi from "@/app/lib/axios";

export const getAllProjects = () => {
  return async (dispatch: AppDispatch) => {
    try {
      // Call backend using axiosApi (auto adds Authorization header)
      const res = await axiosApi.get("/project/getAllProjects");

      // Decrypt backend response
      const decryptedText = aes_int_decrypt(res.data.data);
      const parsedProjects = JSON.parse(decryptedText);

      // Save to Redux
      dispatch(setProjects(parsedProjects));

      return parsedProjects;
    } catch (err) {
      console.error("❌ Error loading projects:", err);
      throw err;
    }
  };
};
