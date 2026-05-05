import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ApprovalFlow, ProjectApprovalConfig } from "@/app/api-service/approvalFlowService";

interface ApprovalFlowState {
  flows: ApprovalFlow[];
  defaultFlow: ApprovalFlow | null;
  selectedFlow: ApprovalFlow | null;
  projectConfig: ProjectApprovalConfig | null;
  loading: boolean;
  error: string | null;
}

const initialState: ApprovalFlowState = {
  flows: [],
  defaultFlow: null,
  selectedFlow: null,
  projectConfig: null,
  loading: false,
  error: null,
};

export const approvalFlowSlice = createSlice({
  name: "approvalFlow",
  initialState,
  reducers: {
    setFlows: (state, action: PayloadAction<ApprovalFlow[]>) => {
      state.flows = action.payload;
      state.error = null;
    },
    addFlow: (state, action: PayloadAction<ApprovalFlow>) => {
      state.flows.push(action.payload);
      state.error = null;
    },
    updateFlowLocal: (state, action: PayloadAction<ApprovalFlow>) => {
      const index = state.flows.findIndex((f) => f.id === action.payload.id);
      if (index !== -1) {
        state.flows[index] = action.payload;
      }
      state.error = null;
    },
    deleteFlowLocal: (state, action: PayloadAction<string>) => {
      state.flows = state.flows.filter((f) => f.id !== action.payload);
      state.error = null;
    },
    setSelectedFlow: (state, action: PayloadAction<ApprovalFlow | null>) => {
      state.selectedFlow = action.payload;
    },
    setDefaultFlow: (state, action: PayloadAction<ApprovalFlow>) => {
      state.defaultFlow = action.payload;
      const index = state.flows.findIndex((f) => f.id === action.payload.id);
      if (index !== -1) {
        state.flows[index] = action.payload;
      }
      state.error = null;
    },
    setProjectApprovalConfig: (state, action: PayloadAction<ProjectApprovalConfig>) => {
      state.projectConfig = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setFlows,
  addFlow,
  updateFlowLocal,
  deleteFlowLocal,
  setSelectedFlow,
  setDefaultFlow,
  setProjectApprovalConfig,
  setLoading,
  setError,
} = approvalFlowSlice.actions;

export default approvalFlowSlice.reducer;
