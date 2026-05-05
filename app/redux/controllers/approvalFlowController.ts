import { AppDispatch } from "../store";
import {
  createApprovalFlow,
  getAllApprovalFlows,
  getApprovalFlow,
  updateApprovalFlow,
  deleteApprovalFlow,
  setDefaultFlow as setDefaultFlowAPI,
  getDefaultFlow as getDefaultFlowAPI,
  configureProjectApproval,
  getProjectApprovalConfig,
  ApprovalFlow,
  ApprovalStep,
} from "@/app/api-service/approvalFlowService";
import {
  setFlows,
  addFlow,
  updateFlowLocal,
  deleteFlowLocal,
  setSelectedFlow,
  setDefaultFlow,
  setProjectApprovalConfig,
  setLoading,
  setError,
} from "../slices/approvalFlowSlice";

export const getApprovalFlows = (onlyActive?: boolean) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getAllApprovalFlows(onlyActive);

      if (response.success) {
        dispatch(setFlows(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch flows");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching approval flows";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching flows:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const getFlowById = (flowId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getApprovalFlow(flowId);

      if (response.success) {
        dispatch(setSelectedFlow(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch flow");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching flow";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching flow:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const createFlow = (data: {
  name: string;
  description?: string;
  isDefault?: boolean;
  steps: ApprovalStep[];
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await createApprovalFlow(data);

      if (response.success) {
        dispatch(addFlow(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to create flow");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error creating approval flow";
      dispatch(setError(errorMsg));
      console.error("❌ Error creating flow:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateFlow = (
  flowId: string,
  data: Partial<{
    name: string;
    description: string;
    isDefault: boolean;
    isActive: boolean;
    steps: ApprovalStep[];
  }>
) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await updateApprovalFlow(flowId, data);

      if (response.success) {
        dispatch(updateFlowLocal(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to update flow");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error updating approval flow";
      dispatch(setError(errorMsg));
      console.error("❌ Error updating flow:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const deleteFlow = (flowId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await deleteApprovalFlow(flowId);

      if (response.success) {
        dispatch(deleteFlowLocal(flowId));
        return true;
      } else {
        throw new Error(response.error?.message || "Failed to delete flow");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error deleting approval flow";
      dispatch(setError(errorMsg));
      console.error("❌ Error deleting flow:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const setFlowAsDefault = (flowId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await setDefaultFlowAPI(flowId);

      if (response.success) {
        dispatch(setDefaultFlow(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to set default flow");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error setting default flow";
      dispatch(setError(errorMsg));
      console.error("❌ Error setting default flow:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const getDefaultApprovalFlow = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getDefaultFlowAPI();

      if (response.success) {
        dispatch(setDefaultFlow(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch default flow");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching default flow";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching default flow:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const setProjectApprovalFlow = (
  projectId: string,
  data: { approvalFlowId?: string | null; approvalEnabled: boolean }
) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await configureProjectApproval(projectId, data);

      if (response.success) {
        dispatch(setProjectApprovalConfig(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to configure project approval");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error configuring project approval";
      dispatch(setError(errorMsg));
      console.error("❌ Error configuring project approval:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchProjectApprovalConfig = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getProjectApprovalConfig(projectId);

      if (response.success) {
        dispatch(setProjectApprovalConfig(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch project approval config");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching project approval config";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching project approval config:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
