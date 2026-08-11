"use client";

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
  Pagination,
} from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LayersIcon from "@mui/icons-material/Layers";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ProjectCard, { getProjectVersionLabel } from "./ProjectCard";
import { ProjectCardActions, ViewType } from "./types";
import { usePermissions } from "@/app/lib/usePermissions";
import { brandColors } from "@/app/lib/theme";

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
  legendItems?: Array<{ label: string; color: string }>;
  showActions?: boolean;
  showRequestTrackingColumns?: boolean;
}

type ProjectGridItem = {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  startDate?: string;
  expectedEndDate?: string;
  businessUnit?: string;
  businessUnitName?: string;
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
  createdAt?: string;
  submittedAt?: string;
  nextApprover?: { name?: string; email?: string } | string | null;
  approvals?: any[];
  projectApprovals?: any[];
  approvalSteps?: any[];
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
  legendItems,
  showActions = true,
  showRequestTrackingColumns = false,
}: ProjectsGridProps) {
  const { canCreate } = usePermissions();
  const canCreateProject = canCreate("projects");
  const approvalOnly = actionMode === "approval";
  const showActionColumn = showActions && (approvalOnly || projects.some((project) => project.status === "NEEDS_REVISION"));

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
      return { label: "Active", bg: "#D1FAE5", color: "#111827", border: "#34D399" };
    }
    if (status === "COMPLETED") {
      return { label: "Completed", bg: "#EEF2FF", color: "#3730A3", border: "#818CF8" };
    }
    if (status === "FOR_REVIEW") {
      return { label: "For Review", bg: "#FEF3C7", color: "#111827", border: "#FBBF24" };
    }
    if (status === "FOR_APPROVAL") {
      return { label: "For Approval", bg: "#DBEAFE", color: "#111827", border: "#60A5FA" };
    }
    if (status === "NEEDS_REVISION") {
      return { label: "Needs Revision", bg: "#FFE4E6", color: "#111827", border: "#FB7185" };
    }
    if (status === "REJECTED") {
      return { label: "Rejected", bg: "#FFE4E6", color: "#111827", border: "#FB7185" };
    }
    if (status === "ARCHIVED") {
      return { label: "Archived", bg: "#F3F4F6", color: "#4B5563", border: "#D1D5DB" };
    }
    if (status === "CANCELLED") return { label: "Cancelled", bg: "#FFE4E6", color: "#111827", border: "#FB7185" };
    return { label: "Draft", bg: "#EDE9FE", color: "#111827", border: "#A78BFA" };
  };

  const businessUnitName = (project: ProjectGridItem) => {
    return project.businessUnitDetails?.name || project.businessUnitName || "-";
  };

  const tableHeadCellSx = {
    py: 1.1,
    fontSize: 11,
    fontWeight: 600,
    color: brandColors.deepTwilightLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottom: `1px solid ${brandColors.lavender}`,
    whiteSpace: "nowrap",
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const nextApproverName = (project: ProjectGridItem) => {
    if (typeof project.nextApprover === "string") return project.nextApprover;
    if (project.nextApprover?.name) return project.nextApprover.name;
    const approvals = project.approvals || project.projectApprovals || project.approvalSteps || [];
    const pending = approvals
      .filter((approval: any) => String(approval.status || "PENDING").toUpperCase() === "PENDING")
      .sort((a: any, b: any) => Number(a.order ?? a.stepOrder ?? a.sequence ?? 999) - Number(b.order ?? b.stepOrder ?? b.sequence ?? 999));
    const next = pending[0];
    if (!next) return ["ACTIVE", "APPROVED", "COMPLETED"].includes(String(project.status).toUpperCase()) ? "Approval complete" : "Not assigned";
    return next.approverName || next.approver?.name || next.reviewerName || next.reviewer?.name || next.user?.name || next.role || next.level || "Assigned approver";
  };

  const tableBodyCellSx = {
    py: 1,
    height: 52,
    fontSize: 12.5,
    color: "#3F3B4D",
    borderBottom: `1px solid ${brandColors.lavenderMist}`,
  };

  const stickyActionCellSx = {
    width: 64,
    minWidth: 64,
    maxWidth: 64,
    position: "sticky",
    right: 0,
    zIndex: 1,
    bgcolor: "#FFFFFF",
    boxShadow: "-8px 0 12px -14px rgba(33, 14, 100, 0.35)",
  };

  const paginationStart = pagination?.total
    ? (pagination.page - 1) * pagination.limit + 1
    : 0;
  const paginationEnd = pagination?.total
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : 0;

  const statusLegend = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        columnGap: { xs: 1.25, sm: 1.75 },
        rowGap: 0.5,
        minWidth: 0,
      }}
    >
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: brandColors.deepTwilightLight, whiteSpace: "nowrap" }}>
        Status
      </Typography>
      {(legendItems || [
        { label: "Draft", color: "#A78BFA" },
        { label: "For Review", color: "#FBBF24" },
        { label: "For Approval", color: "#60A5FA" },
        { label: "Needs Revision", color: "#FB7185" },
        { label: "Active", color: "#34D399" },
        { label: "Completed", color: "#818CF8" },
      ]).map((item) => (
        <Stack key={item.label} direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: item.color,
              border: "1px solid rgba(15, 23, 42, 0.12)",
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontSize: 11.25, lineHeight: 1.2, color: "#6B6880", fontWeight: 400, whiteSpace: "nowrap" }}>
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Box>
  );

  const headerWithViewToggle = (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", sm: "center" }}
      spacing={1}
      sx={{ mb: 1.25 }}
    >
      {statusLegend}
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
        {headerWithViewToggle}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: {
              xs: 480,
              md: "clamp(390px, calc(100vh - 395px), 560px)",
            },
            minHeight: 390,
            border: `1px solid ${brandColors.lavender}`,
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 8px 24px rgba(33, 14, 100, 0.05)",
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
              minWidth: { xs: showRequestTrackingColumns ? 1160 : 860, md: showRequestTrackingColumns ? 1220 : 920 },
              tableLayout: "fixed",
              "& .MuiTableCell-root": {
                px: { xs: 1.25, md: 1.75 },
              },
              "& .MuiTableCell-root:not(:last-child)": {
                borderRight: `1px solid ${brandColors.lavender}`,
              },
              "& .MuiTableRow-root:hover .project-action-cell": {
                bgcolor: "#F8FAFC",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...tableHeadCellSx, width: "28%", bgcolor: brandColors.aliceBlue }}>
                  Project Name
                </TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 118, bgcolor: brandColors.aliceBlue }}>
                  Version
                </TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 112, bgcolor: brandColors.aliceBlue }}>
                  Status
                </TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 112, bgcolor: brandColors.aliceBlue }}>
                  Start Date
                </TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 112, bgcolor: brandColors.aliceBlue }}>
                  End Date
                </TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 180, bgcolor: brandColors.aliceBlue }}>
                  Business Unit
                </TableCell>
                {showRequestTrackingColumns && <TableCell sx={{ ...tableHeadCellSx, width: 170, bgcolor: brandColors.aliceBlue }}>
                  Requested At
                </TableCell>}
                {showRequestTrackingColumns && <TableCell sx={{ ...tableHeadCellSx, width: 170, bgcolor: brandColors.aliceBlue }}>
                  Next Approver
                </TableCell>}
                {showActionColumn && <TableCell
                  align="center"
                  className="project-action-cell"
                  sx={{
                    ...tableHeadCellSx,
                    ...stickyActionCellSx,
                    zIndex: 3,
                    bgcolor: brandColors.aliceBlue,
                  }}
                >
                  Action
                </TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => {
                const status = statusStyle(project.status);
                return (
                  <TableRow
                    key={project.id}
                    hover
                    onClick={() => actions.onOpenDashboard?.(project.id)}
                    sx={{ bgcolor: "#FFFFFF", cursor: "pointer", "&:hover": { bgcolor: `${brandColors.lavenderMist} !important` } }}
                  >
                    <TableCell sx={tableBodyCellSx}>
                      <Typography
                        noWrap
                        title={project.name || "Untitled Project"}
                        sx={{ fontSize: 13, fontWeight: 600, color: brandColors.deepTwilight }}
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
                            bgcolor: brandColors.lavenderMist,
                            color: brandColors.deepTwilightLight,
                            border: `1px solid ${brandColors.lavender}`,
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
                          border: `1px solid ${status.border}55`,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}>
                      <Typography sx={{ fontSize: 12.5, color: "#3F3B4D", fontWeight: 400, whiteSpace: "nowrap" }}>
                        {formatDate(project.startDate)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}>
                      <Typography sx={{ fontSize: 12.5, color: "#3F3B4D", fontWeight: 400, whiteSpace: "nowrap" }}>
                        {formatDate(project.expectedEndDate)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}>
                      <Tooltip title={businessUnitName(project)}>
                        <Typography noWrap sx={{ fontSize: 12.5, color: "#3F3B4D", fontWeight: 400 }}>
                          {businessUnitName(project)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    {showRequestTrackingColumns && <TableCell sx={tableBodyCellSx}>
                      <Typography sx={{ fontSize: 12, color: "#3F3B4D", whiteSpace: "nowrap" }}>
                        {formatDateTime(project.submittedAt || project.createdAt)}
                      </Typography>
                    </TableCell>}
                    {showRequestTrackingColumns && <TableCell sx={tableBodyCellSx}>
                      <Tooltip title={nextApproverName(project)}>
                        <Typography noWrap sx={{ fontSize: 12.5, color: "#3F3B4D", fontWeight: 600 }}>
                          {nextApproverName(project)}
                        </Typography>
                      </Tooltip>
                    </TableCell>}
                    {showActionColumn && <TableCell
                      align="center"
                      className="project-action-cell"
                      sx={{ ...tableBodyCellSx, ...stickyActionCellSx }}
                    >
                      {approvalOnly || project.status === "NEEDS_REVISION" ? (
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              actions.onViewApproval(project);
                            }}
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
                      ) : null}
                    </TableCell>}
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
              borderTop: `1px solid ${brandColors.lavender}`,
              bgcolor: brandColors.aliceBlue,
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

      </Box>
    );
  }

  return (
    <Box>
      {headerWithViewToggle}
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={project.id}>
            <ProjectCard
              project={project}
              actions={actions}
              viewType="card"
              actionMode={actionMode}
              showActions={showActions}
              nextApproverName={showRequestTrackingColumns ? nextApproverName(project) : undefined}
            />
          </Grid>
        ))}
      </Grid>
      {pagination && pagination.total > 0 && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="center"
          justifyContent="space-between"
          spacing={1.5}
          sx={{
            mt: 3,
            px: { xs: 1, sm: 2 },
            py: 1.5,
            borderTop: "1px solid #E0DAE6",
          }}
        >
          <Typography sx={{ fontSize: 12.5, color: "#6B6880", fontWeight: 600 }}>
            Showing {paginationStart}-{paginationEnd} of {pagination.total} projects
          </Typography>
          <Pagination
            page={pagination.page}
            count={pagination.totalPages}
            onChange={(_, nextPage) => onPageChange?.(nextPage)}
            color="primary"
            size="small"
            shape="rounded"
            siblingCount={1}
            boundaryCount={1}
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#210E64",
                borderRadius: "8px",
                fontWeight: 700,
              },
              "& .Mui-selected": {
                bgcolor: "#210E64 !important",
                color: "#FFFFFF",
              },
            }}
          />
        </Stack>
      )}
    </Box>
  );
}
