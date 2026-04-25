/**
 * GridTableView - Table display for categories, tasks and subtasks
 * Uses fullProject data from API which contains complete hierarchy
 */

import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Stack,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAppSelector } from "@/app/redux/hook";

interface GridTableViewProps {
  projectId?: string | null;
}

export default function GridTableView({ projectId }: GridTableViewProps) {
  const fullProject = useAppSelector((state) => state.project.fullProject);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Build hierarchical data from fullProject
  // ⚠️ Data structure is NESTED: categories.tasks.subtasks (not flat)
  const hierarchicalData = useMemo(() => {
    if (!fullProject || !fullProject.categories) {
      return [];
    }

    const categories = fullProject.categories || [];
    
    // Calculate total budget from all tasks across all categories
    const totalBudget = categories.reduce((catSum: number, category: any) => {
      const categoryTaskBudget = (category.tasks || []).reduce(
        (taskSum: number, task: any) => taskSum + (task.budgetAllocated || 0),
        0
      );
      return catSum + categoryTaskBudget;
    }, 0);

    return categories.map((category: any) => {
      const categoryBudget = (category.tasks || []).reduce(
        (sum: number, task: any) => sum + (task.budgetAllocated || 0),
        0
      );

      return {
        type: "category",
        id: category.id,
        name: category.name,
        totalBudget: categoryBudget,
        // Tasks are nested directly in category
        tasks: (category.tasks || []).map((task: any) => ({
          type: "task",
          id: task.id,
          name: task.title || task.name, // API uses "title" not "name" for tasks
          budget: task.budgetAllocated || 0,
          weight: totalBudget > 0 ? ((task.budgetAllocated || 0) / totalBudget) * 100 : 0,
          expectedStartDate: task.projectedStartDate || task.expectedStartDate || task.startDate,
          expectedEndDate: task.projectedEndDate || task.expectedEndDate || task.endDate,
          actualStartDate: task.actualStartDate,
          actualEndDate: task.actualEndDate,
          progress: task.progress || 0,
          // Subtasks are nested directly in task
          subtasks: (task.subtasks || []).map((subtask: any) => {
            // Extract ALL assignee names from assignees array
            let assigneeNames: string[] = [];
            
            if (subtask.assignees && Array.isArray(subtask.assignees) && subtask.assignees.length > 0) {
              assigneeNames = subtask.assignees
                .map((assignee: any) => {
                  // assignees[i].user.name structure
                  if (assignee && assignee.user) {
                    return assignee.user.name || assignee.user.fullName || assignee.user.username || "Unknown";
                  }
                  return null;
                })
                .filter((name: string | null) => name !== null);
            } else if (subtask.user) {
              const userName = typeof subtask.user === 'object'
                ? (subtask.user.name || subtask.user.fullName || subtask.user.username || "Unknown")
                : subtask.user;
              assigneeNames = [userName];
            } else if (subtask.assignee) {
              const assigneeName = typeof subtask.assignee === 'object'
                ? (subtask.assignee.name || subtask.assignee.fullName || subtask.assignee.username || "Unknown")
                : subtask.assignee;
              assigneeNames = [assigneeName];
            }
            
            return {
              type: "subtask",
              id: subtask.id,
              title: subtask.title || "-",
              budget: subtask.budgetAllocated || 0,
              weight: totalBudget > 0 ? ((subtask.budgetAllocated || 0) / totalBudget) * 100 : 0,
              assignees: assigneeNames,
              expectedStartDate: subtask.projectedStartDate,
              expectedEndDate: subtask.projectedEndDate,
              actualStartDate: subtask.actualStartDate,
              actualEndDate: subtask.actualEndDate,
              progress: subtask.progress || 0,
            };
          }),
        })),
      };
    });
  }, [fullProject]);

  const formatDate = (date?: string | Date) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "-";
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  if (!projectId) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography color="textSecondary">Select a project to view categories</Typography>
      </Paper>
    );
  }

  if (!fullProject) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography color="textSecondary">Loading project data...</Typography>
      </Paper>
    );
  }

  if (hierarchicalData.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography color="textSecondary">No categories available for this project</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#F7F8FA", borderBottom: "2px solid #DDE1E8" }}>
              <TableCell sx={{ fontWeight: 700, color: "#1D1F26", backgroundColor: "#F7F8FA", fontSize: "12px", textTransform: "uppercase", width: "30%" }}>
                Name
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#1D1F26", backgroundColor: "#F7F8FA", fontSize: "12px", textTransform: "uppercase" }}>
                Budget (₱)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#1D1F26", backgroundColor: "#F7F8FA", fontSize: "12px", textTransform: "uppercase" }}>
                Weight %
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: "#1D1F26", backgroundColor: "#F7F8FA", fontSize: "12px", textTransform: "uppercase" }}>
                Expected Start
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: "#1D1F26", backgroundColor: "#F7F8FA", fontSize: "12px", textTransform: "uppercase" }}>
                Expected End
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: "#1D1F26", backgroundColor: "#F7F8FA", fontSize: "12px", textTransform: "uppercase" }}>
                Actual Start
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: "#1D1F26", backgroundColor: "#F7F8FA", fontSize: "12px", textTransform: "uppercase" }}>
                Actual End
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: "#1D1F26", backgroundColor: "#F7F8FA", fontSize: "12px", textTransform: "uppercase" }}>
                Progress
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: "#1D1F26", backgroundColor: "#F7F8FA", fontSize: "12px", textTransform: "uppercase" }}>
                Assignee
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {hierarchicalData.map((category: any) => (
              <React.Fragment key={category.id}>
                <TableRow sx={{ backgroundColor: "#EEF2F6", borderBottom: "2px solid #DDE1E8", "&:hover": { backgroundColor: "#E4EDF5" } }}>
                  <TableCell sx={{ fontWeight: 700, color: "#1D1F26", fontSize: "14px" }}>
                    <Stack direction="row" gap={1} alignItems="center">
                      <IconButton size="small" onClick={() => toggleCategory(category.id)} sx={{ p: 0, color: "#1D1F26" }}>
                        {expandedCategories.has(category.id) ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                      </IconButton>
                      <Box sx={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#FF6B6B" }} />
                      📁 {category.name}
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#1D1F26", fontSize: "13px" }}>
                    ₱{category.totalBudget.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#1D1F26", fontSize: "13px" }}>
                    -
                  </TableCell>
                  <TableCell align="center" />
                  <TableCell align="center" />
                  <TableCell align="center" />
                  <TableCell align="center" />
                  <TableCell align="center" />
                </TableRow>

                {expandedCategories.has(category.id) &&
                  category.tasks.map((task: any) => (
                    <React.Fragment key={task.id}>
                      <TableRow sx={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #DDE1E8", "&:hover": { backgroundColor: "#F7F8FA" } }}>
                        <TableCell sx={{ paddingLeft: 4, fontWeight: 600, color: "#1D1F26", fontSize: "13px" }}>
                          <Stack direction="row" gap={1} alignItems="center">
                            <IconButton size="small" onClick={() => toggleTask(task.id)} sx={{ p: 0, color: "#1D1F26" }}>
                              {expandedTasks.has(task.id) ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                            </IconButton>
                            <Box sx={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#29B6F6" }} />
                            📋 {task.name}
                          </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: "13px", color: "#7D8693" }}>
                          ₱{task.budget.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: "13px", color: "#7D8693" }}>
                          {task.weight.toFixed(2)}%
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: "13px", color: "#7D8693" }}>
                          {formatDate(task.expectedStartDate)}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: "13px", color: "#7D8693" }}>
                          {formatDate(task.expectedEndDate)}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: "13px", color: "#7D8693" }}>
                          {formatDate(task.actualStartDate)}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: "13px", color: "#7D8693" }}>
                          {formatDate(task.actualEndDate)}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: "13px" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ flex: 1, height: "6px", borderRadius: "3px", backgroundColor: "#E0E0E0", overflow: "hidden" }}>
                              <Box sx={{ height: "100%", width: `${task.progress || 0}%`, backgroundColor: task.progress >= 75 ? "#4CAF50" : task.progress >= 50 ? "#FFC107" : "#FF9800", transition: "width 0.3s ease" }} />
                            </Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1D1F26", minWidth: "35px" }}>
                              {task.progress || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: "13px", color: "#7D8693" }}>
                          -
                        </TableCell>
                      </TableRow>

                      {expandedTasks.has(task.id) &&
                        task.subtasks.map((subtask: any) => (
                          <TableRow key={subtask.id} sx={{ backgroundColor: "#FAFBFC", borderBottom: "1px solid #EEF0F4", "&:hover": { backgroundColor: "#EFF4F9" }, "&:hover td": { backgroundColor: "#EFF4F9" } }}>
                            <TableCell sx={{ paddingLeft: 8, fontWeight: 500, color: "#4A5568", fontSize: "12px" }}>
                              <Stack direction="row" gap={1} alignItems="center">
                                <Box sx={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#A5ADB8" }} />
                                ✓ {subtask.title}
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: "12px", color: "#4A5568" }}>
                              ₱{subtask.budget.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: "12px", color: "#4A5568" }}>
                              {subtask.weight.toFixed(2)}%
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: "12px", color: "#4A5568" }}>
                              {formatDate(subtask.expectedStartDate)}
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: "12px", color: "#4A5568" }}>
                              {formatDate(subtask.expectedEndDate)}
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: "12px", color: "#4A5568" }}>
                              {formatDate(subtask.actualStartDate)}
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: "12px", color: "#4A5568" }}>
                              {formatDate(subtask.actualEndDate)}
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: "12px" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{ flex: 1, height: "6px", borderRadius: "3px", backgroundColor: "#E0E0E0", overflow: "hidden" }}>
                                  <Box sx={{ height: "100%", width: `${subtask.progress || 0}%`, backgroundColor: subtask.progress >= 75 ? "#4CAF50" : subtask.progress >= 50 ? "#FFC107" : "#FF9800", transition: "width 0.3s ease" }} />
                                </Box>
                                <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#1D1F26", minWidth: "30px" }}>
                                  {subtask.progress || 0}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: "12px" }}>
                              {subtask.assignees && subtask.assignees.length > 0 ? (
                                <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" gap={0.5}>
                                  {subtask.assignees.map((assignee: string, idx: number) => (
                                    <Chip 
                                      key={idx}
                                      label={assignee} 
                                      size="small" 
                                      variant="outlined" 
                                      sx={{ height: "24px", fontSize: "11px", backgroundColor: "#e3f2fd", borderColor: "#0C66E4", color: "#0C66E4" }} 
                                    />
                                  ))}
                                </Stack>
                              ) : (
                                <Typography sx={{ fontSize: "12px", color: "#A5ADB8" }}>Unassigned</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </React.Fragment>
                  ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper sx={{ p: 2, mt: 2, backgroundColor: "#F7F8FA", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Stack spacing={1}>
          <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#7D8693", textTransform: "uppercase" }}>
            Summary
          </Typography>
          <Typography sx={{ fontSize: "14px", color: "#1D1F26" }}>
            <strong>Total Categories:</strong> {hierarchicalData.length}
          </Typography>
          <Typography sx={{ fontSize: "14px", color: "#1D1F26" }}>
            <strong>Total Tasks:</strong> {hierarchicalData.reduce((sum: number, cat: any) => sum + cat.tasks.length, 0)}
          </Typography>
          <Typography sx={{ fontSize: "14px", color: "#1D1F26" }}>
            <strong>Total Subtasks:</strong> {hierarchicalData.reduce((sum: number, cat: any) => sum + cat.tasks.reduce((taskSum: number, task: any) => taskSum + task.subtasks.length, 0), 0)}
          </Typography>
        </Stack>

        <Stack spacing={1} sx={{ textAlign: "right" }}>
          <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#7D8693", textTransform: "uppercase" }}>
            Total Budget
          </Typography>
          <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#1D1F26" }}>
            ₱{hierarchicalData.reduce((sum: number, cat: any) => sum + cat.totalBudget, 0).toLocaleString()}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
