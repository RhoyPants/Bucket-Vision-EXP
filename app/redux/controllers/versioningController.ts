import { AppDispatch } from "../store";
import {
  createNewVersion,
  getVersionsByPin,
  getVersionHistory,
  compareVersions,
  getActiveVersionByPin,
  deleteDraftVersion,
  getVersionDetail,
  CreateVersionPayload,
} from "@/app/api-service/versioningService";
import {
  setAllVersions,
  addVersion,
  setVersionHistory,
  setActiveVersion,
  setSelectedVersion,
  setComparisonVersions,
  setVersionComparison,
  deleteVersion,
  setCreateDraftInProgress,
  setLoading,
  setError,
} from "../slices/versioningSlice";
import { setFullProject } from "../slices/projectSlice";

/**
 * Create a new version of a project
 */
export const createVersion = (projectId: string, payload: CreateVersionPayload) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setCreateDraftInProgress(true));

      const response = await createNewVersion(projectId, payload);

      if (response.success) {
        dispatch(addVersion(response.data.newProject));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to create version");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error creating version";
      dispatch(setError(errorMsg));
      console.error("❌ Error creating version:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
      dispatch(setCreateDraftInProgress(false));
    }
  };
};

/**
 * Fetch all versions by PIN
 */
export const fetchVersionsByPin = (pin: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getVersionsByPin(pin);

      if (response.success) {
        dispatch(setAllVersions(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch versions");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching versions";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching versions:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

/**
 * Fetch version history for a project
 */
export const fetchVersionHistory = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getVersionHistory(projectId);

      if (response.success) {
        dispatch(setVersionHistory(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch version history");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching history";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching history:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

/**
 * Fetch active version by PIN with full data
 */
export const fetchActiveVersionByPin = (pin: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getActiveVersionByPin(pin);

      if (response.success) {
        dispatch(setActiveVersion(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch active version");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching active version";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching active version:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

/**
 * Compare two versions
 */
export const fetchVersionComparison = (v1: string, v2: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await compareVersions(v1, v2);

      if (response.success) {
        dispatch(setVersionComparison(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to compare versions");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error comparing versions";
      dispatch(setError(errorMsg));
      console.error("❌ Error comparing versions:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

/**
 * Delete a draft version
 */
export const removeDraftVersion = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await deleteDraftVersion(projectId);

      if (response.success) {
        dispatch(deleteVersion(projectId));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to delete draft");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error deleting draft";
      dispatch(setError(errorMsg));
      console.error("❌ Error deleting draft:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

/**
 * Set a version as selected for viewing
 */
export const selectVersion = (version: any) => {
  return (dispatch: AppDispatch) => {
    dispatch(setSelectedVersion(version));
  };
};

/**
 * Set versions for comparison
 */
export const selectVersionsForComparison = (v1: any, v2: any) => {
  return (dispatch: AppDispatch) => {
    dispatch(setComparisonVersions({ v1, v2 }));
  };
};

/**
 * Fetch full version detail with all nested relations
 */
export const fetchVersionDetail = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getVersionDetail(projectId);

      if (response.success) {
        // Store full project data in Redux
        dispatch(setFullProject(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch version details");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching version details";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching version details:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
