import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import {
  setProjects,
  addProject,
  updateProjectLocal,
  deleteProjectLocal,
  setLoading,
} from "../slices/projectSlice";
import {
  getMyApprovals as fetchMyApprovals,
  getMyRequests as fetchMyRequests,
  getMyDrafts as fetchMyDrafts,
} from "@/app/api-service/projectService";

// ✅ GET ALL (with full details including members)
export const getProjects = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));


      // 🔥 FETCH FULL PROJECT DATA WITH MEMBERS
      const res = await axiosApi.get("/projects?full=true");
      
      
      // Handle both direct array and nested data structure
      const projectsData = res.data.data || res.data;
      
      
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
      let res;
      try {
        // Project update can be heavy (scopes/tasks sync), allow longer timeout.
        res = await axiosApi.put(`/projects/${projectId}`, data, {
          timeout: 45000,
        });
      } catch (err: any) {
        // Retry once on timeout to handle transient backend slowdowns.
        if (err?.code === "ECONNABORTED" || String(err?.message || "").toLowerCase().includes("timeout")) {
          res = await axiosApi.put(`/projects/${projectId}`, data, {
            timeout: 45000,
          });
        } else {
          throw err;
        }
      }

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

// ===== FILTERED PROJECT ENDPOINTS =====

// ✅ GET MY APPROVALS (projects waiting for current user approval)
export const getMyApprovalsProjects = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const projectsData = await fetchMyApprovals();

      dispatch(setProjects(projectsData));

      return projectsData;
    } catch (err) {
      console.error("❌ Error fetching my approvals:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ GET MY REQUESTS (projects owned by user with non-DRAFT status)
export const getMyRequestsProjects = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const projectsData = await fetchMyRequests();

      dispatch(setProjects(projectsData));

      return projectsData;
    } catch (err) {
      console.error("❌ Error fetching my requests:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ GET MY DRAFTS (projects owned by user with DRAFT status)
export const getMyDraftsProjects = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const projectsData = await fetchMyDrafts();

      dispatch(setProjects(projectsData));

      return projectsData;
    } catch (err) {
      console.error("❌ Error fetching my drafts:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};