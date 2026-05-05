import axios from "@/app/lib/axios";
import { AppDispatch } from "@/app/redux/store";
import {
  fetchPendingApprovalsStart,
  fetchPendingApprovalsSuccess,
  fetchPendingApprovalsFailure,
  fetchProjectApprovalsStart,
  fetchProjectApprovalsSuccess,
  fetchProjectApprovalsFailure,
  fetchAuditTrailStart,
  fetchAuditTrailSuccess,
  fetchAuditTrailFailure,
  submitProjectStart,
  submitProjectSuccess,
  submitProjectFailure,
  approveProjectStart,
  approveProjectSuccess,
  approveProjectFailure,
  rejectProjectStart,
  rejectProjectSuccess,
  rejectProjectFailure,
} from "@/app/redux/slices/approvalSlice";
import { ProjectApproval, ApprovalAuditLog } from "@/app/redux/slices/approvalSlice";

/**
 * Fetch pending approvals for current user
 */
export const getPendingApprovals = () => async (dispatch: AppDispatch) => {
  dispatch(fetchPendingApprovalsStart());
  try {
    const response = await axios.get("/approvals/pending");
    
    // Map nested approver data to flattened fields for frontend
    const mappedApprovals = (response.data.data || []).map((approval: any) => ({
      ...approval,
      approverName: approval.approver?.name || null,
      approverEmail: approval.approver?.email || null,
    }));
    
    dispatch(fetchPendingApprovalsSuccess(mappedApprovals));
    return mappedApprovals;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch pending approvals";
    dispatch(fetchPendingApprovalsFailure(message));
    throw error;
  }
};

/**
 * Fetch pending projects for current user's approval (with full project data)
 * NEW: This replaces the need to fetch separate projects
 */
export const getPendingProjectsForApproval = () => async (dispatch: AppDispatch) => {
  dispatch(fetchPendingApprovalsStart());
  try {
    const response = await axios.get("/approvals/pending-projects");
    console.log("✅ [getPendingProjectsForApproval] Response:", response.status, response.data);
    
    // Map nested approver data to flattened fields for frontend
    const mappedApprovals = (response.data.data || []).map((approval: any) => ({
      ...approval,
      approverName: approval.approver?.name || null,
      approverEmail: approval.approver?.email || null,
    }));
    
    dispatch(fetchPendingApprovalsSuccess(mappedApprovals));
    return mappedApprovals;
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error || "Failed to fetch pending projects";
    
    // Common cause: route not registered yet or route ordering issue
    if (status === 404) {
      console.error("❌ [getPendingProjectsForApproval] 404 - Route /api/approvals/pending-projects not found!");
      console.error("   FIX: Make sure /pending-projects route is registered BEFORE /:projectId in approval.routes.ts");
    } else if (status === 400) {
      console.error("❌ [getPendingProjectsForApproval] 400 - Backend error:", error.response?.data);
      console.error("   This might mean /:projectId is catching 'pending-projects' as a project ID");
    } else {
      console.error(`❌ [getPendingProjectsForApproval] ${status} error:`, message);
    }

    dispatch(fetchPendingApprovalsFailure(message));
    // Don't rethrow - let the page load without crashing
    return [];
  }
};

/**
 * Fetch all approvals for a specific project
 */
export const getProjectApprovals = (projectId: string) => async (dispatch: AppDispatch) => {
  dispatch(fetchProjectApprovalsStart());
  try {
    const response = await axios.get(`/approvals/${projectId}`);
    
    // Map nested approver data to flattened fields for frontend
    const mappedApprovals = (response.data.data || []).map((approval: any) => ({
      ...approval,
      approverName: approval.approver?.name || null,
      approverEmail: approval.approver?.email || null,
    }));
    
    dispatch(
      fetchProjectApprovalsSuccess({
        projectId,
        approvals: mappedApprovals,
      })
    );
    return mappedApprovals;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch project approvals";
    dispatch(fetchProjectApprovalsFailure(message));
    throw error;
  }
};

/**
 * Fetch approval audit trail for a project
 */
export const getApprovalAuditTrail = (projectId: string) => async (dispatch: AppDispatch) => {
  dispatch(fetchAuditTrailStart());
  try {
    const response = await axios.get(`/approvals/${projectId}/audit`);
    
    // Map nested approver data to flattened fields for frontend
    const mappedAuditLogs = (response.data.data || []).map((log: any) => ({
      ...log,
      approverName: log.approver?.name || null,
      approverEmail: log.approver?.email || null,
      // level is already at top level in backend response
    }));
    
    dispatch(
      fetchAuditTrailSuccess({
        projectId,
        auditLog: mappedAuditLogs,
      })
    );
    return mappedAuditLogs;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch audit trail";
    dispatch(fetchAuditTrailFailure(message));
    throw error;
  }
};

/**
 * Submit project for approval
 */
export const submitProjectForApproval = (projectId: string) => async (dispatch: AppDispatch) => {
  dispatch(submitProjectStart());
  try {
    const response = await axios.post("/approvals/submit", {
      projectId,
    });

    const approvals = response.data.data?.approvals || [];
    dispatch(
      submitProjectSuccess({
        projectId,
        approvals,
      })
    );
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to submit project for approval";
    dispatch(submitProjectFailure(message));
    throw error;
  }
};

/**
 * Approve project at current approval level
 */
export const approveProject = (projectId: string) => async (dispatch: AppDispatch) => {
  dispatch(approveProjectStart());
  try {
    const response = await axios.post(`/approvals/${projectId}/approve`);

    const updatedApproval = response.data.data?.approval || {};
    dispatch(
      approveProjectSuccess({
        projectId,
        updatedApproval,
      })
    );
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to approve project";
    dispatch(approveProjectFailure(message));
    throw error;
  }
};

/**
 * Reject project with remarks
 */
export const rejectProject =
  (projectId: string, remarks: string) => async (dispatch: AppDispatch) => {
    dispatch(rejectProjectStart());
    try {
      const response = await axios.post(`/approvals/${projectId}/reject`, {
        remarks,
      });

      const updatedApproval = response.data.data?.approval || {};
      dispatch(
        rejectProjectSuccess({
          projectId,
          updatedApproval,
        })
      );
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to reject project";
      dispatch(rejectProjectFailure(message));
      throw error;
    }
  };
