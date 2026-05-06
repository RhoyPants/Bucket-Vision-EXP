import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProjectVersion, VersionHistoryItem } from "@/app/api-service/versioningService";

interface VersioningState {
  allVersions: ProjectVersion[];
  versionHistory: VersionHistoryItem[];
  activeVersion: ProjectVersion | null;
  selectedVersion: ProjectVersion | null;
  comparisonVersions: {
    v1: ProjectVersion | null;
    v2: ProjectVersion | null;
    comparison: any | null;
  };
  createDraftInProgress: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: VersioningState = {
  allVersions: [],
  versionHistory: [],
  activeVersion: null,
  selectedVersion: null,
  comparisonVersions: {
    v1: null,
    v2: null,
    comparison: null,
  },
  createDraftInProgress: false,
  loading: false,
  error: null,
};

export const versioningSlice = createSlice({
  name: "versioning",
  initialState,
  reducers: {
    // Set all versions
    setAllVersions: (state, action: PayloadAction<ProjectVersion[]>) => {
      state.allVersions = action.payload;
      state.error = null;
    },

    // Add a new version
    addVersion: (state, action: PayloadAction<ProjectVersion>) => {
      state.allVersions.push(action.payload);
      state.error = null;
    },

    // Update a version locally
    updateVersion: (state, action: PayloadAction<ProjectVersion>) => {
      const index = state.allVersions.findIndex((v) => v.id === action.payload.id);
      if (index !== -1) {
        state.allVersions[index] = action.payload;
      }
      state.error = null;
    },

    // Delete a version
    deleteVersion: (state, action: PayloadAction<string>) => {
      state.allVersions = state.allVersions.filter((v) => v.id !== action.payload);
      state.error = null;
    },

    // Set version history
    setVersionHistory: (state, action: PayloadAction<VersionHistoryItem[]>) => {
      state.versionHistory = action.payload;
      state.error = null;
    },

    // Set active version
    setActiveVersion: (state, action: PayloadAction<ProjectVersion | null>) => {
      state.activeVersion = action.payload;
      state.error = null;
    },

    // Set selected version for viewing details
    setSelectedVersion: (state, action: PayloadAction<ProjectVersion | null>) => {
      state.selectedVersion = action.payload;
      state.error = null;
    },

    // Set comparison versions
    setComparisonVersions: (
      state,
      action: PayloadAction<{
        v1: ProjectVersion | null;
        v2: ProjectVersion | null;
        comparison?: any;
      }>
    ) => {
      state.comparisonVersions = {
        v1: action.payload.v1,
        v2: action.payload.v2,
        comparison: action.payload.comparison || null,
      };
      state.error = null;
    },

    // Update comparison data
    setVersionComparison: (state, action: PayloadAction<any>) => {
      state.comparisonVersions.comparison = action.payload;
      state.error = null;
    },

    // Set draft creation progress
    setCreateDraftInProgress: (state, action: PayloadAction<boolean>) => {
      state.createDraftInProgress = action.payload;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear versions
    clearVersions: (state) => {
      state.allVersions = [];
      state.versionHistory = [];
      state.activeVersion = null;
      state.selectedVersion = null;
      state.comparisonVersions = {
        v1: null,
        v2: null,
        comparison: null,
      };
      state.error = null;
    },
  },
});

export const {
  setAllVersions,
  addVersion,
  updateVersion,
  deleteVersion,
  setVersionHistory,
  setActiveVersion,
  setSelectedVersion,
  setComparisonVersions,
  setVersionComparison,
  setCreateDraftInProgress,
  setLoading,
  setError,
  clearVersions,
} = versioningSlice.actions;

export default versioningSlice.reducer;
