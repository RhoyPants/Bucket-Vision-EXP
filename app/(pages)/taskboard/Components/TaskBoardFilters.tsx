"use client";

import {
  Box,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";

interface FilterOptions {
  searchQuery: string;
  projectId: string | null;
  scopeId: string | null;
  taskId: string | null;
}

interface FilterItem {
  id: string;
  name: string;
}

interface TaskBoardFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  projects: FilterItem[];
  scopes: FilterItem[];
  tasks: FilterItem[];
  isLoading?: boolean;
}

export default function TaskBoardFilters({
  filters,
  onFilterChange,
  projects,
  scopes,
  tasks,
  isLoading = false,
}: TaskBoardFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery ||
    filters.projectId ||
    filters.scopeId ||
    filters.taskId;

  const handleClearFilters = () => {
    onFilterChange({
      searchQuery: "",
      projectId: null,
      scopeId: null,
      taskId: null,
    });
  };

  return (
    <Paper
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: "16px",
        border: "1px solid #E0DAE6",
        background: "#FFFFFF",
        mb: 2,
        boxShadow: "0 4px 16px rgba(17, 9, 71, 0.04)",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search assigned tasks"
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
          disabled={isLoading}
          sx={{ flex: { md: 1.5 }, "& .MuiOutlinedInput-root": { borderRadius: "10px", background: "#F8F7FC" } }}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "#77718A", fontSize: 20 }} /> }}
        />
        {/* Project Filter */}
        <FormControl size="small" sx={{ flex: 1, minWidth: { md: 180 } }} disabled={isLoading}>
          <InputLabel id="project-label">Project</InputLabel>
          <Select
            labelId="project-label"
            id="project-select"
            value={filters.projectId || ""}
            label="Project"
            onChange={(e) =>
              onFilterChange({
                ...filters,
                projectId: e.target.value || null,
              })
            }
            sx={{
              background: "#F8F7FC", borderRadius: "10px",

              "&.Mui-focused": {
                background: "#FFFFFF",
              },
            }}
          >
            <MenuItem value="">All Projects</MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Scope Filter */}
        <FormControl size="small" sx={{ flex: 1, minWidth: { md: 160 } }} disabled={isLoading || !filters.projectId}>
          <InputLabel id="Scope-label">Scope</InputLabel>
          <Select
            labelId="Scope-label"
            id="Scope-select"
            value={filters.scopeId || ""}
            label="Scope"
            onChange={(e) =>
              onFilterChange({
                ...filters,
                scopeId: e.target.value || null,
              })
            }
            sx={{
              background: "#F8F7FC", borderRadius: "10px",

              "&.Mui-focused": {
                background: "#FFFFFF",
              },
            }}
          >
            <MenuItem value="">All scopes</MenuItem>
            {scopes.map((Scope) => (
              <MenuItem key={Scope.id} value={Scope.id}>
                {Scope.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Task Filter */}
        <FormControl size="small" sx={{ flex: 1, minWidth: { md: 160 } }} disabled={isLoading || !filters.scopeId}>
          <InputLabel id="task-label">Task</InputLabel>
          <Select
            labelId="task-label"
            id="task-select"
            value={filters.taskId || ""}
            label="Task"
            onChange={(e) =>
              onFilterChange({
                ...filters,
                taskId: e.target.value || null,
              })
            }
            sx={{
              background: "#F8F7FC", borderRadius: "10px",

              "&.Mui-focused": {
                background: "#FFFFFF",
              },
            }}
          >
            <MenuItem value="">All Tasks</MenuItem>
            {tasks.map((task) => (
              <MenuItem key={task.id} value={task.id}>
                {task.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {hasActiveFilters && (
          <Button size="small" startIcon={<ClearIcon />} onClick={handleClearFilters}
            sx={{ whiteSpace: "nowrap", textTransform: "none", color: "#686A73", fontWeight: 700, minWidth: 94 }}>
            Clear
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
