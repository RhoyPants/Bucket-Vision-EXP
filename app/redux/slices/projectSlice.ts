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
}

const initialState: ProjectState = {
  projects: [],
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<Project[]>) {
      state.projects = action.payload;
    },
  },
});

export const { setProjects } = projectSlice.actions;
export default projectSlice.reducer;
