import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import {
  setProjects,
  addProject,
  updateProjectLocal,
  deleteProjectLocal,
  setLoading,
} from "../slices/projectSlice";

// ✅ GET ALL
export const getProjects = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get("/projects");

      dispatch(setProjects(res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error fetching projects:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ GET FULL
import { setFullProject } from "../slices/projectSlice";

export const getProjectFull = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get(`/projects/${projectId}/full`);

      // 🔥 STORE IN REDUX
      dispatch(setFullProject(res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error fetching full project:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ GET ONE
export const getProjectById = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get(`/projects/${projectId}`);

      // 🔥 STORE IN REDUX
      dispatch(setFullProject(res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error fetching project by ID:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ CREATE (🔥 INSTANT UI)
export const createProject = (data: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.post("/projects", data);

      dispatch(addProject(res.data)); // 🔥 no reload

      return res.data;
    } catch (err) {
      console.error("❌ Error creating project:", err);
      throw err;
    }
  };
};

// ✅ UPDATE (🔥 INSTANT UI)
export const updateProject = (projectId: string, data: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.put(`/projects/${projectId}`, data);

      dispatch(updateProjectLocal(res.data)); // 🔥 no reload

      return res.data;
    } catch (err) {
      console.error("❌ Error updating project:", err);
      throw err;
    }
  };
};

// ✅ DELETE (🔥 INSTANT UI)
export const deleteProject = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      await axiosApi.delete(`/projects/${projectId}`);

      dispatch(deleteProjectLocal(projectId)); // 🔥 no reload
    } catch (err) {
      console.error("❌ Error deleting project:", err);
      throw err;
    }
  };
};