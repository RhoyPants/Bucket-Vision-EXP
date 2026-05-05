import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ApprovalLevel = "BU_HEAD" | "OP";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ProjectStatus = "DRAFT" | "FOR_REVIEW" | "FOR_APPROVAL" | "ACTIVE" | "INACTIVE" | "NEEDS_REVISION" | "REJECTED";

export interface ApprovalAuditLog {
  id: string;
  projectId: string;
  approverId: string;
  approverName?: string;
  approverEmail?: string;
  level: ApprovalLevel;
  action: string;
  previousStatus: ProjectStatus;
  newStatus: ProjectStatus;
  remarks?: string;
  createdAt: string;
}

export interface ProjectApproval {
  id: string;
  projectId: string;
  approverId: string;
  approverName?: string;
  approverEmail?: string;
  approverRole?: string;
  level: ApprovalLevel;
  status: ApprovalStatus;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApprovalState {
  pendingApprovals: ProjectApproval[];
  allApprovals: Record<string, ProjectApproval[]>; // projectId => approvals[]
  auditTrail: Record<string, ApprovalAuditLog[]>; // projectId => audit logs[]
  loading: boolean;
  submitting: boolean;
  error: string | null;
  selectedApprovalId: string | null;
  approvalToggleEnabled: boolean;
}

const initialState: ApprovalState = {
  pendingApprovals: [],
  allApprovals: {},
  auditTrail: {},
  loading: false,
  submitting: false,
  error: null,
  selectedApprovalId: null,
  approvalToggleEnabled: true,
};

const approvalSlice = createSlice({
  name: "approval",
  initialState,
  reducers: {
    // ========== FETCH PENDING APPROVALS ==========
    fetchPendingApprovalsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPendingApprovalsSuccess: (state, action: PayloadAction<ProjectApproval[]>) => {
      state.loading = false;
      state.pendingApprovals = action.payload;
    },
    fetchPendingApprovalsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // ========== FETCH PROJECT APPROVALS ==========
    fetchProjectApprovalsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProjectApprovalsSuccess: (
      state,
      action: PayloadAction<{ projectId: string; approvals: ProjectApproval[] }>
    ) => {
      state.loading = false;
      state.allApprovals[action.payload.projectId] = action.payload.approvals;
    },
    fetchProjectApprovalsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // ========== FETCH AUDIT TRAIL ==========
    fetchAuditTrailStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchAuditTrailSuccess: (
      state,
      action: PayloadAction<{ projectId: string; auditLog: ApprovalAuditLog[] }>
    ) => {
      state.loading = false;
      state.auditTrail[action.payload.projectId] = action.payload.auditLog;
    },
    fetchAuditTrailFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // ========== SUBMIT FOR APPROVAL ==========
    submitProjectStart: (state) => {
      state.submitting = true;
      state.error = null;
    },
    submitProjectSuccess: (state, action: PayloadAction<{ projectId: string; approvals: ProjectApproval[] }>) => {
      state.submitting = false;
      state.allApprovals[action.payload.projectId] = action.payload.approvals;
    },
    submitProjectFailure: (state, action: PayloadAction<string>) => {
      state.submitting = false;
      state.error = action.payload;
    },

    // ========== APPROVE PROJECT ==========
    approveProjectStart: (state) => {
      state.submitting = true;
      state.error = null;
    },
    approveProjectSuccess: (
      state,
      action: PayloadAction<{ projectId: string; updatedApproval: ProjectApproval }>
    ) => {
      state.submitting = false;
      const projectId = action.payload.projectId;
      if (state.allApprovals[projectId]) {
        const index = state.allApprovals[projectId].findIndex(
          (a) => a.id === action.payload.updatedApproval.id
        );
        if (index !== -1) {
          state.allApprovals[projectId][index] = action.payload.updatedApproval;
        }
      }
      // Remove from pending
      state.pendingApprovals = state.pendingApprovals.filter(
        (a) => a.projectId !== projectId || a.id !== action.payload.updatedApproval.id
      );
    },
    approveProjectFailure: (state, action: PayloadAction<string>) => {
      state.submitting = false;
      state.error = action.payload;
    },

    // ========== REJECT PROJECT ==========
    rejectProjectStart: (state) => {
      state.submitting = true;
      state.error = null;
    },
    rejectProjectSuccess: (
      state,
      action: PayloadAction<{ projectId: string; updatedApproval: ProjectApproval }>
    ) => {
      state.submitting = false;
      const projectId = action.payload.projectId;
      if (state.allApprovals[projectId]) {
        const index = state.allApprovals[projectId].findIndex(
          (a) => a.id === action.payload.updatedApproval.id
        );
        if (index !== -1) {
          state.allApprovals[projectId][index] = action.payload.updatedApproval;
        }
      }
      // Remove from pending
      state.pendingApprovals = state.pendingApprovals.filter(
        (a) => a.projectId !== projectId || a.id !== action.payload.updatedApproval.id
      );
    },
    rejectProjectFailure: (state, action: PayloadAction<string>) => {
      state.submitting = false;
      state.error = action.payload;
    },

    // ========== CLEAR ERROR ==========
    clearError: (state) => {
      state.error = null;
    },

    // ========== SET SELECTED APPROVAL ==========
    setSelectedApproval: (state, action: PayloadAction<string | null>) => {
      state.selectedApprovalId = action.payload;
    },

    // ========== RESET STATE ==========
    resetApprovalState: (state) => {
      state.pendingApprovals = [];
      state.allApprovals = {};
      state.auditTrail = {};
      state.loading = false;
      state.submitting = false;
      state.error = null;
      state.selectedApprovalId = null;
    },
  },
});

export const {
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
  clearError,
  setSelectedApproval,
  resetApprovalState,
} = approvalSlice.actions;

export default approvalSlice.reducer;
