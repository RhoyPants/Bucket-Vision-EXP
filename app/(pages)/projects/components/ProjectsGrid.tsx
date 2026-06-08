"use client";

import { useState } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  Button,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import LayersIcon from "@mui/icons-material/Layers";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SendIcon from "@mui/icons-material/Send";
import PeopleIcon from "@mui/icons-material/People";
import ProjectCard from "./ProjectCard";
import { ProjectCardActions, ViewType } from "./types";
import Guard from "@/app/components/shared/Guard";

interface ProjectsGridProps {
  projects: ProjectGridItem[];
  actions: ProjectCardActions;
  viewType: ViewType;
  onViewTypeChange?: (viewType: ViewType) => void;
  headerAction?: React.ReactNode;
  emptyMessage?: string;
  emptySubtext?: string;
  showCreateButton?: boolean;
}

type ProjectGridItem = {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  expectedEndDate?: string;
  businessUnit?: string;
  businessUnitDetails?: {
    id?: string;
    code?: string;
    name?: string;
  } | null;
  activatedAt?: string;
  location?: {
    street?: string;
    barangayName?: string;
    cityName?: string;
    provinceName?: string;
  } | null;
};

export default function ProjectsGrid({
  projects,
  actions,
  viewType,
  onViewTypeChange,
  headerAction,
  emptyMessage = "No projects found",
  emptySubtext = "",
  showCreateButton = false,
}: ProjectsGridProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuProject, setMenuProject] = useState<ProjectGridItem | null>(null);

  const menuOpen = Boolean(menuAnchor) && Boolean(menuProject);

  const openMenu = (
    event: React.MouseEvent<HTMLElement>,
    project: ProjectGridItem,
  ) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuProject(project);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuProject(null);
  };

  const runMenuAction = (fn: () => void) => {
    closeMenu();
    fn();
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusStyle = (status?: string) => {
    if (status === "ACTIVE" || status === "APPROVED") {
      return { label: "Approved", bg: "#ECFDF5", color: "#047857", border: "#BBF7D0" };
    }
    if (status === "FOR_REVIEW") {
      return { label: "For Review", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" };
    }
    if (status === "FOR_APPROVAL") {
      return { label: "For Approval", bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" };
    }
    if (status === "NEEDS_REVISION") {
      return { label: "Needs Revision", bg: "#FFF7ED", color: "#9A3412", border: "#FDBA74" };
    }
    if (status === "REJECTED") {
      return { label: "Rejected", bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" };
    }
    if (status === "ARCHIVED") {
      return { label: "Archived", bg: "#F3F4F6", color: "#4B5563", border: "#D1D5DB" };
    }
    return { label: "Draft", bg: "#F8FAFC", color: "#475569", border: "#E2E8F0" };
  };

  const businessUnitCode = (project: ProjectGridItem) => {
    return project.businessUnitDetails?.code || "-";
  };

  const priorityLegend = (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 0.75, sm: 2 }}
      alignItems={{ xs: "flex-start", sm: "center" }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: 0.2 }}>
        Priority Legend
      </Typography>
      {[
        { label: "Low", color: "#ECFDF5" },
        { label: "Medium", color: "#FFF7ED" },
        { label: "High", color: "#FFF1F2" },
      ].map((item) => (
        <Stack key={item.label} direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: item.color,
              border: "1px solid #CBD5E1",
            }}
          />
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );

  const legendWithViewToggle = (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", sm: "center" }}
      spacing={1}
      sx={{ mb: 2 }}
    >
      {priorityLegend}
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
        {onViewTypeChange && (
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={(_, value) => value && onViewTypeChange(value)}
            size="small"
            sx={{ "& .MuiToggleButton-root": { border: "1px solid #e5e7eb" } }}
          >
            <Tooltip title="Card view">
              <ToggleButton value="card">
                <GridViewIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="List view">
              <ToggleButton value="list">
                <ViewListIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        )}
        {headerAction}
      </Stack>
    </Stack>
  );

  if (!projects || projects.length === 0) {
    return (
      <Card sx={{ textAlign: "center", p: 5, border: "2px dashed #e5e7eb", boxShadow: "none" }}>
        <AssignmentIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 2 }} />
        <Typography sx={{ fontWeight: 600, color: "#6b7280", mb: 1 }}>
          {emptyMessage}
        </Typography>
        {emptySubtext && (
          <Typography sx={{ color: "#9ca3af", fontSize: 14, mb: 3 }}>
            {emptySubtext}
          </Typography>
        )}
        {showCreateButton && (
          <Guard module="PROJECTS" action="CREATE">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#4B2E83", "&:hover": { backgroundColor: "#3d2363" } }}
              onClick={actions.onCreateProject}
            >
              + New Project
            </Button>
          </Guard>
        )}
      </Card>
    );
  }

  if (viewType === "list") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {legendWithViewToggle}
        <TableContainer
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            overflow: "auto",
            backgroundColor: "#ffffff",
          }}
        >
          <Table sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 800, color: "#334155", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>
                  Project Name
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>
                  Start Date
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>
                  End Date
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>
                  Business Unit
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>
                  Priority
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#334155", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => {
                const status = statusStyle(project.status);
                return (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 400, color: "#0F172A" }}>
                        {project.name || "Untitled Project"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={status.label}
                        sx={{
                          fontSize: 10,
                          fontWeight: 500,
                          bgcolor: status.bg,
                          color: status.color,
                          border: `1px solid ${status.border}`,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 400 }}>
                        {formatDate(project.startDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 400 }}>
                        {formatDate(project.expectedEndDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 400 }}>
                        {businessUnitCode(project)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 400 }}>
                        {project.priority || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          onClick={(event) => openMenu(event, project)}
                          sx={{ color: "#64748B" }}
                        >
                          <MoreVertIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Menu
          anchorEl={menuAnchor}
          open={menuOpen}
          onClose={closeMenu}
        >
          {menuProject && (
            <>
              {(!menuProject.status || menuProject.status === "DRAFT" || menuProject.status === "FOR_REVIEW" || menuProject.status === "NEEDS_REVISION") && (
                <MenuItem onClick={() => runMenuAction(() => actions.onSetup(menuProject.id))}>
                  <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Setup Project</ListItemText>
                </MenuItem>
              )}

              {(menuProject.status === "FOR_APPROVAL" || menuProject.status === "FOR_REVIEW" || menuProject.status === "NEEDS_REVISION" || menuProject.status === "REJECTED" || menuProject.status === "ACTIVE") && (
                <MenuItem onClick={() => runMenuAction(() => actions.onViewApproval(menuProject))}>
                  <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>View Approval</ListItemText>
                </MenuItem>
              )}

              {(menuProject.status === "NEEDS_REVISION" || menuProject.status === "REJECTED") && (
                <MenuItem onClick={() => runMenuAction(() => actions.onSubmitForApproval(menuProject))}>
                  <ListItemIcon><SendIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Revise &amp; Resubmit</ListItemText>
                </MenuItem>
              )}

              {(menuProject.status === "ACTIVE" || menuProject.status === "APPROVED") && (
                <MenuItem onClick={() => runMenuAction(() => actions.onTeamManage(menuProject))}>
                  <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Team Management</ListItemText>
                </MenuItem>
              )}

              {(menuProject.status === "ACTIVE" || menuProject.status === "APPROVED") && (
                <MenuItem onClick={() => runMenuAction(() => actions.onVersion(menuProject))}>
                  <ListItemIcon><LayersIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Project Versions</ListItemText>
                </MenuItem>
              )}

              <MenuItem onClick={() => runMenuAction(() => actions.onSprint(menuProject.id))}>
                <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Sprint Management</ListItemText>
              </MenuItem>

              {menuProject.status !== "ARCHIVED" && (
                <MenuItem onClick={() => runMenuAction(() => actions.onEdit(menuProject))}>
                  <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Edit Project</ListItemText>
                </MenuItem>
              )}

              <Divider />

              <MenuItem
                onClick={() => runMenuAction(() => actions.onDelete(menuProject.id))}
                sx={{ color: "#B91C1C" }}
              >
                <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </>
          )}
        </Menu>
      </Box>
    );
  }

  return (
    <Box>
      {legendWithViewToggle}
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
            <ProjectCard project={project} actions={actions} viewType="card" />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
