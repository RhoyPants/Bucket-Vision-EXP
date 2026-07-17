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
  Pagination,
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
import ProjectCard, { getProjectVersionLabel } from "./ProjectCard";
import { ProjectCardActions, ViewType } from "./types";
import { usePermissions } from "@/app/lib/usePermissions";

interface ProjectsGridProps {
  projects: ProjectGridItem[];
  actions: ProjectCardActions;
  viewType: ViewType;
  onViewTypeChange?: (viewType: ViewType) => void;
  headerAction?: React.ReactNode;
  emptyMessage?: string;
  emptySubtext?: string;
  showCreateButton?: boolean;
  createButtonLabel?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  onPageChange?: (page: number) => void;
  actionMode?: "default" | "approval";
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
  version?: string | number;
  versionNumber?: string | number;
  versionLabel?: string;
  versionName?: string;
  versionNo?: string | number;
  currentVersion?: ProjectVersionSource | null;
  activeVersion?: ProjectVersionSource | null;
  selectedVersion?: ProjectVersionSource | null;
  location?: {
    street?: string;
    barangayName?: string;
    cityName?: string;
    provinceName?: string;
  } | null;
};

type ProjectVersionSource = {
  version?: string | number;
  versionNumber?: string | number;
  versionLabel?: string;
  versionName?: string;
  versionNo?: string | number;
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
  createButtonLabel = "+ New Project",
  pagination,
  onPageChange,
  actionMode = "default",
}: ProjectsGridProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuProject, setMenuProject] = useState<ProjectGridItem | null>(null);
  const { canView, canCreate, canUpdate, canDelete, role } = usePermissions();
  const canCreateProject = canCreate("projects");
  const canUpdateProject = canUpdate("projects");
  const normalizedRole = String(role || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const canDeleteProject = canDelete("projects") && normalizedRole === "SUPERADMIN";

  const menuOpen = Boolean(menuAnchor) && Boolean(menuProject);
  const approvalOnly = actionMode === "approval";

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

  const tableHeadCellSx = {
    py: 1.25,
    fontSize: 11,
    fontWeight: 800,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom: "1px solid #E2E8F0",
    whiteSpace: "nowrap",
  };

  const tableBodyCellSx = {
    py: 1.35,
    borderBottom: "1px solid #EEF2F7",
  };

  const stickyActionCellSx = {
    width: 64,
    minWidth: 64,
    maxWidth: 64,
    position: "sticky",
    right: 0,
    zIndex: 1,
    bgcolor: "#FFFFFF",
    boxShadow: "-10px 0 16px -16px rgba(15, 23, 42, 0.45)",
  };

  const paginationStart = pagination?.total
    ? (pagination.page - 1) * pagination.limit + 1
    : 0;
  const paginationEnd = pagination?.total
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : 0;

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
        { label: "Low", color: "#73FED5" },
        { label: "Medium", color: "#9DC9FE" },
        { label: "High", color: "#FDD6AD" },
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
        {showCreateButton && canCreateProject && (
            <Button
              variant="contained"
              sx={{ backgroundColor: "#4B2E83", "&:hover": { backgroundColor: "#3d2363" } }}
              onClick={actions.onCreateProject}
            >
              {createButtonLabel}
            </Button>
        )}
      </Card>
    );
  }

  if (viewType === "list") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {legendWithViewToggle}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: {
              xs: 520,
              md: "clamp(420px, calc(100vh - 430px), 620px)",
            },
            minHeight: 420,
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
          }}
        >
        <TableContainer
          sx={{
            flex: 1,
            overflow: "auto",
            backgroundColor: "#ffffff",
          }}
        >
          <Table
            stickyHeader
            sx={{
              minWidth: { xs: 860, md: 920 },
              tableLayout: "fixed",
              "& .MuiTableCell-root": {
                px: { xs: 1.25, md: 1.75 },
              },
              "& .MuiTableRow-root:hover .project-action-cell": {
                bgcolor: "#F8FAFC",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...tableHeadCellSx, width: "28%", bgcolor: "#F8FAFC" }}>
                  Project Name
                </TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 132, bgcolor: "#F8FAFC" }}>
                  Version
                </TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 132, bgcolor: "#F8FAFC" }}>
                  Status
                </TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 122, bgcolor: "#F8FAFC" }}>
                  Start Date
                </TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 122, bgcolor: "#F8FAFC" }}>
                  End Date
                </TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 130, bgcolor: "#F8FAFC" }}>
                  Business Unit
                </TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 104, bgcolor: "#F8FAFC" }}>
                  Priority
                </TableCell>
                <TableCell
                  align="center"
                  className="project-action-cell"
                  sx={{
                    ...tableHeadCellSx,
                    ...stickyActionCellSx,
                    zIndex: 3,
                    bgcolor: "#F8FAFC",
                  }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => {
                const status = statusStyle(project.status);
                return (
                  <TableRow key={project.id} hover sx={{ bgcolor: "#FFFFFF" }}>
                    <TableCell sx={tableBodyCellSx}>
                      <Typography
                        noWrap
                        title={project.name || "Untitled Project"}
                        sx={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}
                      >
                        {project.name || "Untitled Project"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}>
                      <Tooltip title={getProjectVersionLabel(project)}>
                        <Chip
                          size="small"
                          icon={<LayersIcon sx={{ fontSize: 13 }} />}
                          label={getProjectVersionLabel(project)}
                          sx={{
                            maxWidth: 118,
                            height: 23,
                            fontSize: 10,
                            fontWeight: 800,
                            bgcolor: "#F8FAFC",
                            color: "#334155",
                            border: "1px solid #CBD5E1",
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}>
                      <Chip
                        size="small"
                        label={status.label}
                        sx={{
                          height: 22,
                          fontSize: 10,
                          fontWeight: 700,
                          bgcolor: status.bg,
                          color: status.color,
                          border: `1px solid ${status.border}`,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}>
                      <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 400 }}>
                        {formatDate(project.startDate)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}>
                      <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 400 }}>
                        {formatDate(project.expectedEndDate)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}>
                      <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 400 }}>
                        {businessUnitCode(project)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}>
                      <Typography noWrap sx={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>
                        {project.priority || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      className="project-action-cell"
                      sx={{ ...tableBodyCellSx, ...stickyActionCellSx }}
                    >
                      {approvalOnly || project.status === "NEEDS_REVISION" ? (
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => actions.onViewApproval(project)}
                            sx={{
                              color: "#1D4ED8",
                              border: "1px solid #BFDBFE",
                              bgcolor: "#EFF6FF",
                              width: 30,
                              height: 30,
                              "&:hover": {
                                bgcolor: "#DBEAFE",
                                borderColor: "#93C5FD",
                              },
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Actions">
                          <IconButton
                            size="small"
                            onClick={(event) => openMenu(event, project)}
                            sx={{
                              color: "#334155",
                              border: "1px solid #E2E8F0",
                              bgcolor: "#FFFFFF",
                              "&:hover": {
                                bgcolor: "#F1F5F9",
                                borderColor: "#CBD5E1",
                              },
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination && pagination.total > 0 && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{
              flexShrink: 0,
              px: { xs: 1.5, sm: 2 },
              py: 1.25,
              borderTop: "1px solid #E2E8F0",
              bgcolor: "#F8FAFC",
            }}
          >
            <Typography sx={{ fontSize: 12.5, color: "#64748B", fontWeight: 600 }}>
              Showing {paginationStart}-{paginationEnd} of {pagination.total}
            </Typography>
            <Pagination
              page={pagination.page}
              count={pagination.totalPages}
              onChange={(_, page) => onPageChange?.(page)}
              color="primary"
              size="small"
              shape="rounded"
              siblingCount={1}
              boundaryCount={1}
              sx={{
                alignSelf: { xs: "center", sm: "auto" },
                "& .MuiPaginationItem-root": {
                  borderRadius: "6px",
                  fontWeight: 700,
                },
                "& .Mui-selected": {
                  bgcolor: "#210e64 !important",
                  color: "#FFFFFF",
                },
              }}
            />
          </Stack>
        )}
        </Box>

        {!approvalOnly && (
          <Menu
            anchorEl={menuAnchor}
            open={menuOpen}
            onClose={closeMenu}
          >
            {menuProject
            ? menuProject.status === "NEEDS_REVISION"
              ? [
                <MenuItem key="view-only" onClick={() => runMenuAction(() => actions.onViewApproval(menuProject))}>
                  <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>View</ListItemText>
                </MenuItem>,
              ]
              : [
                canUpdateProject && (!menuProject.status || menuProject.status === "DRAFT" || menuProject.status === "FOR_REVIEW" || menuProject.status === "NEEDS_REVISION") && (
                  <MenuItem key="setup" onClick={() => runMenuAction(() => actions.onSetup(menuProject.id))}>
                    <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Setup Project</ListItemText>
                  </MenuItem>
                ),
                (menuProject.status === "FOR_APPROVAL" || menuProject.status === "FOR_REVIEW" || menuProject.status === "NEEDS_REVISION" || menuProject.status === "REJECTED" || menuProject.status === "ACTIVE") && (
                  <MenuItem key="view-approval" onClick={() => runMenuAction(() => actions.onViewApproval(menuProject))}>
                    <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>View Approval</ListItemText>
                  </MenuItem>
                ),
                canUpdateProject && (menuProject.status === "NEEDS_REVISION" || menuProject.status === "REJECTED") && (
                  <MenuItem key="resubmit" onClick={() => runMenuAction(() => actions.onSubmitForApproval(menuProject))}>
                    <ListItemIcon><SendIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Revise &amp; Resubmit</ListItemText>
                  </MenuItem>
                ),
                (menuProject.status === "ACTIVE" || menuProject.status === "APPROVED") && canView("team_management") && (
                  <MenuItem key="team-management" onClick={() => runMenuAction(() => actions.onTeamManage(menuProject))}>
                    <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Team Management</ListItemText>
                  </MenuItem>
                ),
                (menuProject.status === "ACTIVE" || menuProject.status === "APPROVED") && canView("versioning") && (
                  <MenuItem key="project-versions" onClick={() => runMenuAction(() => actions.onVersion(menuProject))}>
                    <ListItemIcon><LayersIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Project Versions</ListItemText>
                  </MenuItem>
                ),
                <MenuItem key="sprint" onClick={() => runMenuAction(() => actions.onSprint(menuProject.id))}>
                  <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Sprint Management</ListItemText>
                </MenuItem>,
                menuProject.status !== "ARCHIVED" && canUpdateProject && (
                  <MenuItem key="edit" onClick={() => runMenuAction(() => actions.onEdit(menuProject))}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Edit Project</ListItemText>
                  </MenuItem>
                ),
                <Divider key="divider" />,
                canDeleteProject && (
                <MenuItem
                  key="delete"
                  onClick={() => runMenuAction(() => actions.onDelete(menuProject.id))}
                  sx={{ color: "#B91C1C" }}
                >
                  <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
                ),
              ]
              : null}
          </Menu>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {legendWithViewToggle}
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={project.id}>
            <ProjectCard
              project={project}
              actions={actions}
              viewType="card"
              actionMode={actionMode}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
