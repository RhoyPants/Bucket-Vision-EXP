"use client";

import {
  Box,
  Typography,
  TextField,
  MenuItem,
} from "@mui/material";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { setCurrentProject } from "@/app/redux/slices/projectSlice";

export default function ProjectSelector() {
  const dispatch = useAppDispatch();

  const { projects, currentProjectId } = useAppSelector(
    (state) => state.project
  );

  // Filter to show only ACTIVE projects
  const activeProjects = projects.filter(
    (p) => (p as any).status === "ACTIVE" && (p as any).isActive === true
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const projectId = e.target.value;
    dispatch(setCurrentProject(projectId));
  };

  return (
    <Box>
      {/* LABEL */}
      <Typography
        variant="subtitle2"
        fontWeight={600}
        mb={1}
      >
        Select Project
      </Typography>

      {/* SELECT */}
      <TextField
        select
        fullWidth
        size="small"
        value={currentProjectId ?? ""}
        onChange={handleChange}
        sx={{
          backgroundColor: "#fff",
          borderRadius: 2,
        }}
      >
        {activeProjects.length > 0 ? (
          activeProjects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No active projects available</MenuItem>
        )}
      </TextField>
    </Box>
  );
}