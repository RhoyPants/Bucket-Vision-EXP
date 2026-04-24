import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ProjectMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
  projectRole?: "OWNER" | "SUB_OWNER" | "MEMBER";
}

export interface ProjectMembersGrouped {
  owner?: ProjectMember[];
  subOwners?: ProjectMember[];
  members?: ProjectMember[];
  total?: number;
}

interface ProjectMemberState {
  projectMembers: ProjectMembersGrouped;
  engagedUsers: ProjectMember[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectMemberState = {
  projectMembers: {},
  engagedUsers: [],
  loading: false,
  error: null,
};

const projectMemberSlice = createSlice({
  name: "projectMembers",
  initialState,
  reducers: {
    // ✅ SET PROJECT MEMBERS (grouped by role)
    setProjectMembers(state, action: PayloadAction<ProjectMembersGrouped>) {
      state.projectMembers = action.payload;
    },

    // ✅ SET ENGAGED USERS (for dropdown)
    setEngagedUsers(state, action: PayloadAction<ProjectMember[]>) {
      state.engagedUsers = action.payload;
    },

    // ✅ ADD SINGLE MEMBER
    addProjectMember(state, action: PayloadAction<ProjectMember>) {
      const newMember = action.payload;
      const role = newMember.projectRole?.toUpperCase();

      if (role === "OWNER") {
        state.projectMembers.owner = [
          ...(state.projectMembers.owner || []),
          newMember,
        ];
      } else if (role === "SUB_OWNER") {
        state.projectMembers.subOwners = [
          ...(state.projectMembers.subOwners || []),
          newMember,
        ];
      } else if (role === "MEMBER") {
        state.projectMembers.members = [
          ...(state.projectMembers.members || []),
          newMember,
        ];
      }
    },

    // ✅ REMOVE MEMBER
    removeProjectMember(
      state,
      action: PayloadAction<string>
    ) {
      const userId = action.payload;

      state.projectMembers.owner = state.projectMembers.owner?.filter(
        (m) => m.id !== userId
      );
      state.projectMembers.subOwners = state.projectMembers.subOwners?.filter(
        (m) => m.id !== userId
      );
      state.projectMembers.members = state.projectMembers.members?.filter(
        (m) => m.id !== userId
      );

      state.engagedUsers = state.engagedUsers.filter((u) => u.id !== userId);
    },

    // ✅ SET LOADING
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    // ✅ SET ERROR
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    // ✅ CLEAR ERROR
    clearError(state) {
      state.error = null;
    },

    // ✅ RESET STATE
    resetProjectMembers(state) {
      state.projectMembers = {};
      state.engagedUsers = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setProjectMembers,
  setEngagedUsers,
  addProjectMember,
  removeProjectMember,
  setLoading,
  setError,
  clearError,
  resetProjectMembers,
} = projectMemberSlice.actions;

export default projectMemberSlice.reducer;
