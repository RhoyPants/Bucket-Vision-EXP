import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Project {
  project_id: number;
  project_name: string;
  status: string;
  ref_no: string;
  entity: string;
  date_from: string;
  date_to: string;
  bu_code: string;
  attachment_url: string | null;
  created_at: string;
}

interface ProjectState {
  projects: Project[];
  loading: boolean;
  currentProject: Project | null;
}

const initialState: ProjectState = {
  projects: [],
  loading: false,
  currentProject: null,
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    // 🌟 Set project list
    setProjects(state, action: PayloadAction<Project[]>) {
      state.projects = action.payload;
      state.loading = false;
    },

    // 🌟 Set loading state
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    // 🌟 Select project for dropdown
    setCurrentProject(state, action: PayloadAction<Project | null>) {
      state.currentProject = action.payload;
    },
  },
});

export const { setProjects, setLoading, setCurrentProject } =
  projectSlice.actions;

export default projectSlice.reducer;
