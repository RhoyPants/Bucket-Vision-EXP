import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import {
  setProjects,
  addProject,
  updateProjectLocal,
  deleteProjectLocal,
  setLoading,
} from "../slices/projectSlice";

// ✅ GET ALL (with full details including members)
export const getProjects = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      console.log("📤 Fetching projects from:", axiosApi.defaults.baseURL + "/projects?full=true");

      // 🔥 FETCH FULL PROJECT DATA WITH MEMBERS
      const res = await axiosApi.get("/projects?full=true");
      
      console.log("📥 Response status:", res.status);
      console.log("📥 Response headers:", res.headers);
      console.log("📥 Response data:", res.data);
      
      // Handle both direct array and nested data structure
      const projectsData = res.data.data || res.data;
      
      console.log("✅ Projects loaded:", projectsData?.length || 0, "projects");
      
      dispatch(setProjects(projectsData));

      return projectsData;
    } catch (err) {
      console.error("❌ Error fetching projects:", err);
      console.error("Error details:", {
        message: (err as any)?.message,
        code: (err as any)?.code,
        status: (err as any)?.response?.status,
        response: (err as any)?.response?.data,
      });
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