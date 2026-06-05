import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// 🔥 LOCATION TYPE
export interface ProjectLocation {
  city?: string;
  province?: string;
  barangay?: string;
  street?: string;
}

export interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BusinessUnitDetails {
  id: string;
  code: string;
  name: string;
}

export interface Projects {
  id: string;
  name: string;
  description?: string;
  status: "DRAFT" | "FOR_REVIEW" | "FOR_APPROVAL" | "NEEDS_REVISION" | "REJECTED" | "ACTIVE";
  ownerId: string;
  businessUnit?: string;
  businessUnitDetails?: BusinessUnitDetails;
  projectMembers?: ProjectMember[];
  createdAt?: string;
  updatedAt?: string;

  // 🔥 FIXED (JSON)
  location?: ProjectLocation | null;

  startDate?: string;
  expectedEndDate?: string;

  totalBudget?: number;
  priority?: string;
  pin?: string;

  // 🔥 APPROVAL METADATA (for my-approvals)
  pendingApprovalId?: string;
  pendingApprovalLevel?: string;
  pendingApprovalOrder?: number;
  pendingApprovalIsFinal?: boolean;

  entity?: string;
}

interface ProjectState {
  projects: Projects[];
  currentProjectId: string | null;
  loading: boolean;
  fullProject: any | null;
}

const initialState: ProjectState = {
  projects: [],
  currentProjectId: null,
  loading: false,
  fullProject: null,
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<Projects[]>) {
      state.projects = action.payload;

      if (!state.currentProjectId && action.payload.length > 0) {
        state.currentProjectId = action.payload[0].id;
      }
    },

    setFullProject(state, action: PayloadAction<any>) {
      state.fullProject = action.payload;
    },

    setCurrentProject(state, action: PayloadAction<string>) {
      state.currentProjectId = action.payload;
    },

    // 🔥 OPTIMISTIC ADD
    addProject(state, action: PayloadAction<Projects>) {
      state.projects.unshift(action.payload);
    },

    // 🔥 OPTIMISTIC UPDATE
    updateProjectLocal(state, action: PayloadAction<Projects>) {
      const index = state.projects.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = {
          ...state.projects[index],
          ...action.payload,
        };
      }
    },

    // 🔥 OPTIMISTIC DELETE
    deleteProjectLocal(state, action: PayloadAction<string>) {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const {
  setProjects,
  setCurrentProject,
  addProject,
  updateProjectLocal,
  deleteProjectLocal,
  setLoading,
  setFullProject,
} = projectSlice.actions;

export default projectSlice.reducer;