"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Stack,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleIcon from "@mui/icons-material/People";
import PlaceIcon from "@mui/icons-material/Place";
import LayersIcon from "@mui/icons-material/Layers";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SendIcon from "@mui/icons-material/Send";
import { ProjectCardActions, ViewType } from "./types";
import { usePermissions } from "@/app/lib/usePermissions";

type ProjectCardProject = {
  id: string;
  name?: string;
  description?: string;
  progress?: number;
  overallProgress?: number;
  completionRate?: number;
  completionPercentage?: number;
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

interface ProjectCardProps {
  project: ProjectCardProject;
  actions: ProjectCardActions;
  viewType: ViewType;
  gridTemplate?: string;
  actionMode?: "default" | "approval";
}

export const formatLocation = (location?: ProjectCardProject["location"]): string => {
  if (!location) return "No location";
  const { street, barangayName, cityName, provinceName } = location;
  return (
    [street, barangayName, cityName, provinceName].filter(Boolean).join(", ") ||
    "No location"
  );
};

export const getProjectVersionLabel = (project: ProjectCardProject): string => {
  const raw =
    project.versionLabel ||
    project.versionName ||
    project.versionNumber ||
    project.versionNo ||
    project.version ||
    project.currentVersion?.versionLabel ||
    project.currentVersion?.versionName ||
    project.currentVersion?.versionNumber ||
    project.currentVersion?.versionNo ||
    project.currentVersion?.version ||
    project.activeVersion?.versionLabel ||
    project.activeVersion?.versionName ||
    project.activeVersion?.versionNumber ||
    project.activeVersion?.versionNo ||
    project.activeVersion?.version ||
    project.selectedVersion?.versionLabel ||
    project.selectedVersion?.versionName ||
    project.selectedVersion?.versionNumber ||
    project.selectedVersion?.versionNo ||
    project.selectedVersion?.version;

  if (raw === undefined || raw === null || raw === "") return "Version not set";

  const label = String(raw).trim();
  const normalized = label.toLowerCase();
  if (normalized.startsWith("v") || normalized.includes("version")) return label;
  return `Version ${label}`;
};

const priorityTone = (priority?: string) => {
  const normalized = String(priority || "").toUpperCase();
  if (normalized === "CRITICAL") return { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA", label: "Critical" };
  if (normalized === "HIGH") return { bg: "#FFF1F2", color: "#BE123C", border: "#FDA4AF", label: "High" };
  if (normalized === "MEDIUM") return { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A", label: "Medium" };
  if (normalized === "LOW") return { bg: "#ECFDF5", color: "#047857", border: "#BBF7D0", label: "Low" };
  return { bg: "#F8FAFC", color: "#475569", border: "#E2E8F0" };
};

const priorityCardTone = (priority?: string) => {
  const normalized = String(priority || "").toUpperCase();
  if (normalized === "HIGH") return "#FDD6AD";
  if (normalized === "MEDIUM") return "#9DC9FE";
  if (normalized === "LOW") return "#73FED5";
  if (normalized === "CRITICAL") return "#F4989E";
  return "#8282B1";
};

const getHeaderTone = (priority?: string) => {
  if (!priority) {
    return {
      title: "#FEFEFE",
      subtitle: "#E9EDF5",
      icon: "#FEFEFE",
      border: "#E9EDF5",
    };
  }

  return {
    title: "#555B66",
    subtitle: "#555B66",
    icon: "#555B66",
    border: "#D9DEE8",
  };
};

const statusChipColor = (status?: string) => {
  if (status === "ACTIVE" || status === "APPROVED") return { bg: "#ECFDF5", color: "#047857", border: "#BBF7D0", label: "Approved" };
  if (status === "FOR_REVIEW") return { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "For Review" };
  if (status === "FOR_APPROVAL") return { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE", label: "For Approval" };
  if (status === "NEEDS_REVISION") return { bg: "#FFF7ED", color: "#9A3412", border: "#FDBA74", label: "Needs Revision" };
  if (status === "REJECTED") return { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA", label: "Rejected" };
  if (status === "ARCHIVED") return { bg: "#F3F4F6", color: "#4B5563", border: "#D1D5DB", label: "Archived" };
  return { bg: "#F8FAFC", color: "#475569", border: "#E2E8F0", label: "Draft" };
};

const formatDate = (value?: string) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const normalizeProgress = (raw: unknown): number => {
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;

  if (value >= 0 && value <= 1) {
    return Math.round(value * 100);
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

const getProjectProgress = (project: ProjectCardProject): number => {
  const raw =
    project.overallProgress ??
    project.progress ??
    project.completionPercentage ??
    project.completionRate;

  return normalizeProgress(raw);
};

const getProgressColor = (progress: number): string => {
  if (progress <= 0) return "#6B7280"; // gray
  if (progress < 40) return "#D97706"; // orange
  if (progress < 70) return "#1D4ED8"; // blue
  if (progress < 100) return "#15803D"; // green (dark)
  return "#22C55E"; // green (complete)
};

const getProgressGradientStops = (progress: number): [string, string] => {
  if (progress <= 0) return ["#9CA3AF", "#6B7280"];
  if (progress < 40) return ["#F59E0B", "#D97706"];
  if (progress < 70) return ["#3B82F6", "#1D4ED8"];
  if (progress < 100) return ["#22C55E", "#15803D"];
  return ["#4ADE80", "#16A34A"];
};

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
      <Box sx={{ color: "#94A3B8", display: "grid", placeItems: "center", pt: "2px" }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 10, color: "#94A3B8", fontWeight: 800, textTransform: "uppercase" }}>
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: "#475569",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function DateRangeMeta({
  startDate,
  endDate,
}: {
  startDate?: string;
  endDate?: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
      <Box sx={{ color: "#94A3B8", display: "grid", placeItems: "center", pt: "2px" }}>
        <CalendarMonthIcon sx={{ fontSize: 16 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1.25} sx={{ minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 10, color: "#94A3B8", fontWeight: 800, textTransform: "uppercase" }}>
              Expected Start
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>
              {formatDate(startDate)}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 10, color: "#94A3B8", fontWeight: 800, textTransform: "uppercase" }}>
              Expected End
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>
              {formatDate(endDate)}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}

function ApprovalStatusBadge({ project, onViewApproval, onResubmit }: {
  project: ProjectCardProject;
  onViewApproval: () => void;
  onResubmit: () => void;
}) {
  const status = project.status;
  const tone = statusChipColor(status);
  const isPending = ["FOR_REVIEW", "FOR_APPROVAL"].includes(status ?? "");
  const isRejected = status === "NEEDS_REVISION" || status === "REJECTED";
  const isActive = status === "ACTIVE" || status === "APPROVED";

  const badgeBase = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 1.25,
    py: 0.75,
    borderRadius: 1.5,
    bgcolor: tone.bg,
    border: `1px solid ${tone.border}`,
  } as const;

  if (isActive) {
    return (
      <Box sx={badgeBase}>
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: tone.color, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: tone.color }}>Approved</Typography>
        {project.activatedAt && (
          <Typography sx={{ fontSize: 10, color: "#64748B", ml: "auto", fontWeight: 600 }}>
            {formatDate(project.activatedAt)}
          </Typography>
        )}
      </Box>
    );
  }

  if (isPending) {
    return (
      <Box
        onClick={onViewApproval}
        sx={{ ...badgeBase, cursor: "pointer", "&:hover": { borderColor: tone.color } }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: tone.color, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: tone.color }}>
          {status === "FOR_REVIEW" ? "Pending BU Review" : "Pending OP Approval"}
        </Typography>
        <Typography sx={{ fontSize: 10, color: "#475569", ml: "auto", fontWeight: 700 }}>View</Typography>
      </Box>
    );
  }

  if (isRejected) {
    return (
      <Box
        onClick={onResubmit}
        sx={{ ...badgeBase, cursor: "pointer", "&:hover": { borderColor: tone.color } }}
      >
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: tone.color, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: tone.color }}>Needs Revision</Typography>
        <Typography sx={{ fontSize: 10, color: "#475569", ml: "auto", fontWeight: 700 }}>Revise</Typography>
      </Box>
    );
  }

  return (
    <Box sx={badgeBase}>
      <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: tone.color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: tone.color }}>{tone.label}</Typography>
    </Box>
  );
}

export default function ProjectCard({
  project,
  actions,
  viewType,
  gridTemplate = "1fr 110px 170px 110px 80px 80px",
  actionMode = "default",
}: ProjectCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const { canView, canUpdate, canDelete } = usePermissions();
  const canUpdateProject = canUpdate("projects");
  const canDeleteProject = canDelete("projects");
  const menuOpen = Boolean(menuAnchor);

  const isActive = project.status === "ACTIVE" || project.status === "APPROVED";
  const isArchived = project.status === "ARCHIVED";
  const isForApproval =
    project.status === "FOR_APPROVAL" || project.status === "FOR_REVIEW";
  const needsSetup =
    !project.status ||
    project.status === "DRAFT" ||
    project.status === "FOR_REVIEW" ||
    project.status === "NEEDS_REVISION";
  const isRejected = project.status === "NEEDS_REVISION" || project.status === "REJECTED";
  const chipStyle = statusChipColor(project.status);
  const priorityStyle = priorityTone(project.priority);
  const cardBackground = priorityCardTone(project.priority);
  const businessUnitName = project.businessUnitDetails?.name || project.businessUnit || "No BU";
  const versionLabel = getProjectVersionLabel(project);
  const approvalOnly = actionMode === "approval";
  const progressPercent = getProjectProgress(project);
  const progressColor = getProgressColor(progressPercent);
  const progressDegree = Math.round((progressPercent / 100) * 360);
  const [progressStartColor, progressEndColor] = getProgressGradientStops(progressPercent);
  const headerBackground = cardBackground;
  const headerTone = getHeaderTone(project.priority);
  const headerBorder = headerTone.border;

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };
  const closeMenu = () => setMenuAnchor(null);

  const menuAction = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    fn();
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    if (!canDeleteProject) return;
    actions.onDelete(project.id);
  };

  const actionMenu = (
    <Menu anchorEl={menuAnchor} open={menuOpen} onClose={closeMenu} onClick={(e) => e.stopPropagation()}>
      {approvalOnly ? (
        <MenuItem onClick={menuAction(() => actions.onViewApproval(project))}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
      ) : (
        [
      canUpdateProject && needsSetup && (
        <MenuItem key="setup" onClick={menuAction(() => actions.onSetup(project.id))}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Setup Project</ListItemText>
        </MenuItem>
      ),
      (isForApproval || isRejected || isActive) && (
        <MenuItem key="view-approval" onClick={menuAction(() => actions.onViewApproval(project))}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Approval</ListItemText>
        </MenuItem>
      ),
      canUpdateProject && isRejected && (
        <MenuItem key="resubmit" onClick={menuAction(() => actions.onSubmitForApproval(project))}>
          <ListItemIcon><SendIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Revise &amp; Resubmit</ListItemText>
        </MenuItem>
      ),
      isActive && canView("team_management") && (
        <MenuItem key="team-management" onClick={menuAction(() => actions.onTeamManage(project))}>
          <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Team Management</ListItemText>
        </MenuItem>
      ),
      isActive && canView("versioning") && (
        <MenuItem key="project-versions" onClick={menuAction(() => actions.onVersion(project))}>
          <ListItemIcon><LayersIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Project Versions</ListItemText>
        </MenuItem>
      ),
      <MenuItem key="sprint" onClick={menuAction(() => actions.onSprint(project.id))}>
        <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Sprint Management</ListItemText>
      </MenuItem>
      ,
      !isArchived && canUpdateProject && (
        <MenuItem key="edit" onClick={menuAction(() => actions.onEdit(project))}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Project</ListItemText>
        </MenuItem>
      ),
      <Divider key="divider" />,
      canDeleteProject && (
      <MenuItem key="delete" onClick={handleDelete} sx={{ color: "#B91C1C" }}>
        <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Delete</ListItemText>
      </MenuItem>
      ),
        ]
      )}
    </Menu>
  );

  if (viewType === "list") {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: gridTemplate,
          alignItems: "center",
          gap: 2,
          px: 2,
          py: 1.5,
          border: "1px solid #E5E7EB",
          borderRadius: 2,
          backgroundColor: "#FFFFFF",
          opacity: isArchived ? 0.75 : 1,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
          "&:hover": {
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
            borderColor: "#CBD5E1",
            transform: "translateY(-1px)",
          },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={800} sx={{ fontSize: 14, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {project.name || "Untitled Project"}
          </Typography>
          <Typography variant="caption" color="#64748B" display="block" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {project.description || "No description"}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
          <Chip
            size="small"
            label={chipStyle.label}
            sx={{ fontSize: 10, fontWeight: 800, bgcolor: chipStyle.bg, color: chipStyle.color, border: `1px solid ${chipStyle.border}` }}
          />
          <Tooltip title={versionLabel}>
            <Chip
              size="small"
              icon={<LayersIcon sx={{ fontSize: 13 }} />}
              label={versionLabel}
              sx={{
                maxWidth: 110,
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
        </Stack>

        <Box sx={{ display: { xs: "none", md: "block" }, minWidth: 0 }}>
          <DateRangeMeta
            startDate={project.startDate}
            endDate={project.expectedEndDate}
          />
        </Box>

        <Box sx={{ display: { xs: "none", lg: "block" }, minWidth: 0 }}>
          <MetaItem
            icon={<BusinessIcon sx={{ fontSize: 16 }} />}
            label="Business Unit"
            value={businessUnitName}
          />
        </Box>

        <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}>
          {project.priority && (
            <Chip
              size="small"
              label={project.priority}
              sx={{
                fontSize: 10,
                fontWeight: 800,
                bgcolor: priorityStyle.bg,
                color: priorityStyle.color,
                border: `1px solid ${priorityStyle.border}`,
              }}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          {approvalOnly ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
              onClick={(event) => {
                event.stopPropagation();
                actions.onViewApproval(project);
              }}
              sx={{
                minWidth: 72,
                borderRadius: 1.5,
                textTransform: "none",
                fontWeight: 800,
                color: "#1D4ED8",
                borderColor: "#BFDBFE",
                bgcolor: "#EFF6FF",
              }}
            >
              View
            </Button>
          ) : (
            <>
              <Tooltip title="Actions">
                <IconButton size="small" onClick={openMenu} sx={{ color: "#64748B" }}>
                  <MoreVertIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              {actionMenu}
            </>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: "16px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
        border: "1px solid #E5E7EB",
        backgroundColor: "#FFFFFF",
        opacity: isArchived ? 0.75 : 1,
        "&:hover": {
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
          borderColor: "#CBD5E1",
          transform: "translateY(-1px)",
        },
      }}
    >
      <CardContent sx={{ pb: 0, p: 0 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 0.75,
            px: 2,
            py: 2,
            height: 90,
            position: "relative",
            backgroundColor: headerBackground,
            borderBottom: `1px solid ${headerBorder}`,
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, pr: approvalOnly ? 10 : 4, width: "100%" }}>
            <Typography fontWeight={800} sx={{ fontSize: 15, color: headerTone.title, lineHeight: 1.35, mb: 0.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {project.name || "Untitled Project"}
            </Typography>
            <Typography
              variant="caption"
              color={headerTone.subtitle}
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.45,
                minHeight: 34,
                wordBreak: "break-word",
              }}
            >
              {project.description || "No description"}
            </Typography>
          </Box>

          <Tooltip title={versionLabel}>
            <Chip
              size="small"
              icon={<LayersIcon sx={{ fontSize: 13 }} />}
              label={versionLabel}
              sx={{
                height: 22,
                maxWidth: 130,
                position: "absolute",
                left: 16,
                bottom: -11,
                zIndex: 1,
                fontSize: 10,
                fontWeight: 800,
                bgcolor: "#FFFFFF",
                color: "#334155",
                border: "1px solid #CBD5E1",
                boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)",
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              }}
            />
          </Tooltip>
          <Chip
            size="small"
            label={chipStyle.label}
            sx={{
              height: 22,
              flexShrink: 0,
              position: "absolute",
              right: 16,
              bottom: -11,
              zIndex: 1,
              fontSize: 10,
              fontWeight: 800,
              bgcolor: "#FFFFFF",
              color: chipStyle.color,
              border: `1px solid ${chipStyle.border}`,
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)",
            }}
          />
          {!approvalOnly && (
                <Tooltip title="Actions">
              <IconButton
                size="small"
                onClick={openMenu}
                sx={{
                  color: headerTone.icon,
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 26,
                  height: 26,
                }}
              >
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
          )}
        </Box>

        <Box sx={{ mb: 2, px: 2, pt: 3, pb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="stretch" sx={{ mb: 1.25 }}>
            <Stack spacing={1.1} sx={{ flex: "0 0 65%", minWidth: 0 }}>
              <MetaItem
                icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                label="Expected Start Date"
                value={formatDate(project.startDate)}
              />
              <MetaItem
                icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                label="Expected End Date"
                value={formatDate(project.expectedEndDate)}
              />
              <MetaItem
                icon={<BusinessIcon sx={{ fontSize: 16 }} />}
                label="Business Unit"
                value={businessUnitName}
              />
            </Stack>

            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{
                flex: "0 0 35%",
                flexShrink: 0,
                pr: 3,
                pl: 1,
                py: 0.75,
              }}
            >

              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  background: `conic-gradient(${progressStartColor} 0deg, ${progressEndColor} ${progressDegree}deg, #E5E7EB ${progressDegree}deg 360deg)`,
                }}
              >
                <Box
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    bgcolor: "#FFFFFF",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "inset 0 0 0 1px rgba(148, 163, 184, 0.16)",
                  }}
                >
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: progressColor, lineHeight: 1 }}>
                    {`${progressPercent}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3 }}>
                Progress
              </Typography>
            </Stack>
          </Stack>

          <MetaItem
            icon={<PlaceIcon sx={{ fontSize: 16 }} />}
            label="Location"
            value={formatLocation(project.location)}
          />
        </Box>
      </CardContent>

      <Box sx={{ px: 2, pb: 2, mt: "auto" }}>
        <ApprovalStatusBadge
          project={project}
          onViewApproval={() => actions.onViewApproval(project)}
          onResubmit={() => actions.onSubmitForApproval(project)}
        />
      </Box>

      {!approvalOnly && actionMenu}
    </Card>
  );
}
