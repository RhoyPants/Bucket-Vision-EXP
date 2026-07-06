import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import {
  setProjects,
  addProject,
  updateProjectLocal,
  deleteProjectLocal,
  setLoading,
  setProjectPagination,
} from "../slices/projectSlice";
import {
  getMyApprovals as fetchMyApprovals,
  getMyRequests as fetchMyRequests,
  getMyDrafts as fetchMyDrafts,
  ProjectListQuery,
  getProjectsByStatus as fetchProjectsByStatus,
  getActiveProjectDropdown as fetchActiveProjectDropdown,
} from "@/app/api-service/projectService";

const normalizeProjectRow = (project: any) => ({
  ...project,
  id: project.id ?? project.value,
  name: project.name ?? project.label,
});

const normalizeProjectListResponse = (response: any) => {
  if (Array.isArray(response)) {
    return {
      data: response,
      meta: {
        page: 1,
        limit: response.length || 10,
        total: response.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  const data = Array.isArray(response?.data) ? response.data : [];
  return {
    data,
    meta: response?.meta ?? {
      page: 1,
      limit: data.length || 10,
      total: data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
};

// ✅ GET ALL (with full details including members)
let projectsInFlight: ReturnType<typeof axiosApi.get> | null = null;
let activeProjectsInFlight: ReturnType<typeof fetchActiveProjectDropdown> | null = null;
const fullProjectInFlight = new Map<string, ReturnType<typeof axiosApi.get>>();
const myDraftsInFlight = new Map<string, ReturnType<typeof fetchMyDrafts>>();
const myRequestsInFlight = new Map<string, ReturnType<typeof fetchMyRequests>>();
const myApprovalsInFlight = new Map<string, ReturnType<typeof fetchMyApprovals>>();

const queryKey = (params?: ProjectListQuery) => JSON.stringify(params || {});

export const getProjects = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));


      // 🔥 FETCH FULL PROJECT DATA WITH MEMBERS
      projectsInFlight =
        projectsInFlight ||
        axiosApi.get("/projects?full=true").finally(() => {
          projectsInFlight = null;
        });

      const res = await projectsInFlight;
      
      
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

      const request =
        fullProjectInFlight.get(projectId) ||
        axiosApi.get(`/projects/${projectId}/full`).finally(() => {
          fullProjectInFlight.delete(projectId);
        });
      fullProjectInFlight.set(projectId, request);

      const res = await request;

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
export const getMyApprovalsProjects = (params?: ProjectListQuery) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const key = queryKey(params);
      const request =
        myApprovalsInFlight.get(key) ||
        fetchMyApprovals(params).finally(() => {
          myApprovalsInFlight.delete(key);
        });
      myApprovalsInFlight.set(key, request);

      const response = await request;
      const { data: projectsData, meta } = normalizeProjectListResponse(response);

      dispatch(setProjects(projectsData));
      dispatch(setProjectPagination(meta));

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
export const getMyRequestsProjects = (params?: ProjectListQuery) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const key = queryKey(params);
      const request =
        myRequestsInFlight.get(key) ||
        fetchMyRequests(params).finally(() => {
          myRequestsInFlight.delete(key);
        });
      myRequestsInFlight.set(key, request);

      const response = await request;
      const { data: projectsData, meta } = normalizeProjectListResponse(response);

      dispatch(setProjects(projectsData));
      dispatch(setProjectPagination(meta));

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
export const getMyDraftsProjects = (params?: ProjectListQuery) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const key = queryKey(params);
      const request =
        myDraftsInFlight.get(key) ||
        fetchMyDrafts(params).finally(() => {
          myDraftsInFlight.delete(key);
        });
      myDraftsInFlight.set(key, request);

      const response = await request;
      const { data: projectsData, meta } = normalizeProjectListResponse(response);

      dispatch(setProjects(projectsData));
      dispatch(setProjectPagination(meta));

      return projectsData;
    } catch (err) {
      console.error("❌ Error fetching my drafts:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const getProjectsByStatus = (status: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const projectsData = await fetchProjectsByStatus(status);
      const normalizedProjectsData = Array.isArray(projectsData)
        ? projectsData.map(normalizeProjectRow)
        : [];

      dispatch(setProjects(normalizedProjectsData));

      return normalizedProjectsData;
    } catch (err) {
      console.error(`❌ Error fetching ${status} projects:`, err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const getActiveProjects = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      activeProjectsInFlight =
        activeProjectsInFlight ||
        fetchActiveProjectDropdown().finally(() => {
          activeProjectsInFlight = null;
        });

      const projectsData = await activeProjectsInFlight;
      const normalizedProjectsData = Array.isArray(projectsData)
        ? projectsData.map(normalizeProjectRow)
        : [];

      dispatch(setProjects(normalizedProjectsData));

      return normalizedProjectsData;
    } catch (err) {
      console.error("❌ Error fetching active project dropdown:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
