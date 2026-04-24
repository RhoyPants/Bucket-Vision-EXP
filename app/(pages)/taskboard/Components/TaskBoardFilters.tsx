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
  Chip,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";

interface FilterOptions {
  searchQuery: string;
  projectId: string | null;
  categoryId: string | null;
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
  categories: FilterItem[];
  tasks: FilterItem[];
  isLoading?: boolean;
}

export default function TaskBoardFilters({
  filters,
  onFilterChange,
  projects,
  categories,
  tasks,
  isLoading = false,
}: TaskBoardFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery ||
    filters.projectId ||
    filters.categoryId ||
    filters.taskId;

  const handleClearFilters = () => {
    onFilterChange({
      searchQuery: "",
      projectId: null,
      categoryId: null,
      taskId: null,
    });
  };

  const getProjectName = (id: string | null) => {
    return projects.find((p) => p.id === id)?.name || "";
  };

  const getCategoryName = (id: string | null) => {
    return categories.find((c) => c.id === id)?.name || "";
  };

  const getTaskName = (id: string | null) => {
    return tasks.find((t) => t.id === id)?.name || "";
  };

  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: "12px",
        border: "1px solid #E0E4EA",
        background: "#FFFFFF",
        mb: 3,
      }}
    >
      {/* Filter Title */}
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SearchIcon sx={{ color: "#0C66E4", fontSize: 24 }} />
            <Box>
              <Box
                component="h3"
                sx={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1D1F26",
                  m: 0,
                }}
              >
                Search & Filter
              </Box>
              <Box
                sx={{
                  fontSize: "12px",
                  color: "#7D8693",
                  fontWeight: 500,
                }}
              >
                Find your assigned subtasks
              </Box>
            </Box>
          </Box>

          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{
                textTransform: "none",
                color: "#E5494D",
                fontWeight: 600,

                "&:hover": {
                  background: "#FFE0E0",
                },
              }}
            >
              Clear All
            </Button>
          )}
        </Box>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search subtasks by title..."
        value={filters.searchQuery}
        onChange={(e) =>
          onFilterChange({ ...filters, searchQuery: e.target.value })
        }
        disabled={isLoading}
        sx={{
          mb: 2,

          "& .MuiOutlinedInput-root": {
            background: "#F7F8FA",
            borderRadius: "8px",

            "&.Mui-focused": {
              background: "#FFFFFF",
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <SearchIcon sx={{ mr: 1, color: "#7D8693", fontSize: 20 }} />
          ),
        }}
      />

      {/* Dropdowns */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {/* Project Filter */}
        <FormControl size="small" sx={{ flex: 1 }} disabled={isLoading}>
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
              background: "#F7F8FA",

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

        {/* Category Filter */}
        <FormControl size="small" sx={{ flex: 1 }} disabled={isLoading}>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            id="category-select"
            value={filters.categoryId || ""}
            label="Category"
            onChange={(e) =>
              onFilterChange({
                ...filters,
                categoryId: e.target.value || null,
              })
            }
            sx={{
              background: "#F7F8FA",

              "&.Mui-focused": {
                background: "#FFFFFF",
              },
            }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Task Filter */}
        <FormControl size="small" sx={{ flex: 1 }} disabled={isLoading}>
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
              background: "#F7F8FA",

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
      </Stack>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {filters.searchQuery && (
            <Chip
              label={`Search: "${filters.searchQuery}"`}
              onDelete={() =>
                onFilterChange({ ...filters, searchQuery: "" })
              }
              size="small"
              variant="outlined"
              sx={{
                borderColor: "#0C66E4",
                color: "#0C66E4",
                fontWeight: 600,
              }}
            />
          )}

          {filters.projectId && (
            <Chip
              label={`Project: ${getProjectName(filters.projectId)}`}
              onDelete={() =>
                onFilterChange({ ...filters, projectId: null })
              }
              size="small"
              variant="outlined"
              sx={{
                borderColor: "#0C66E4",
                color: "#0C66E4",
                fontWeight: 600,
              }}
            />
          )}

          {filters.categoryId && (
            <Chip
              label={`Category: ${getCategoryName(filters.categoryId)}`}
              onDelete={() =>
                onFilterChange({ ...filters, categoryId: null })
              }
              size="small"
              variant="outlined"
              sx={{
                borderColor: "#0C66E4",
                color: "#0C66E4",
                fontWeight: 600,
              }}
            />
          )}

          {filters.taskId && (
            <Chip
              label={`Task: ${getTaskName(filters.taskId)}`}
              onDelete={() => onFilterChange({ ...filters, taskId: null })}
              size="small"
              variant="outlined"
              sx={{
                borderColor: "#0C66E4",
                color: "#0C66E4",
                fontWeight: 600,
              }}
            />
          )}
        </Box>
      )}
    </Paper>
  );
}
