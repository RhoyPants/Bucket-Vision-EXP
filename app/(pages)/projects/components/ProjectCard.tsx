"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
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

type ProjectCardProject = {
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

interface ProjectCardProps {
  project: ProjectCardProject;
  actions: ProjectCardActions;
  viewType: ViewType;
  gridTemplate?: string;
}

export const formatLocation = (location?: ProjectCardProject["location"]): string => {
  if (!location) return "No location";
  const { street, barangayName, cityName, provinceName } = location;
  return (
    [street, barangayName, cityName, provinceName].filter(Boolean).join(", ") ||
    "No location"
  );
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
  if (normalized === "HIGH") return "#FFF1F2";
  if (normalized === "MEDIUM") return "#FFF7ED";
  if (normalized === "LOW") return "#ECFDF5";
  if (normalized === "CRITICAL") return "#FEF2F2";
  return "#FFFFFF";
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
}: ProjectCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
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
    actions.onDelete(project.id);
  };

  const actionMenu = (
    <Menu anchorEl={menuAnchor} open={menuOpen} onClose={closeMenu} onClick={(e) => e.stopPropagation()}>
      {needsSetup && (
        <MenuItem onClick={menuAction(() => actions.onSetup(project.id))}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Setup Project</ListItemText>
        </MenuItem>
      )}
      {(isForApproval || isRejected || isActive) && (
        <MenuItem onClick={menuAction(() => actions.onViewApproval(project))}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Approval</ListItemText>
        </MenuItem>
      )}
      {isRejected && (
        <MenuItem onClick={menuAction(() => actions.onSubmitForApproval(project))}>
          <ListItemIcon><SendIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Revise &amp; Resubmit</ListItemText>
        </MenuItem>
      )}
      {isActive && (
        <MenuItem onClick={menuAction(() => actions.onTeamManage(project))}>
          <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Team Management</ListItemText>
        </MenuItem>
      )}
      {isActive && (
        <MenuItem onClick={menuAction(() => actions.onVersion(project))}>
          <ListItemIcon><LayersIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Project Versions</ListItemText>
        </MenuItem>
      )}
      <MenuItem onClick={menuAction(() => actions.onSprint(project.id))}>
        <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Sprint Management</ListItemText>
      </MenuItem>
      {!isArchived && (
        <MenuItem onClick={menuAction(() => actions.onEdit(project))}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Project</ListItemText>
        </MenuItem>
      )}
      <Divider />
      <MenuItem onClick={handleDelete} sx={{ color: "#B91C1C" }}>
        <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Delete</ListItemText>
      </MenuItem>
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

        <Box>
          <Chip
            size="small"
            label={chipStyle.label}
            sx={{ fontSize: 10, fontWeight: 800, bgcolor: chipStyle.bg, color: chipStyle.color, border: `1px solid ${chipStyle.border}` }}
          />
        </Box>

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
          <Tooltip title="Actions">
            <IconButton size="small" onClick={openMenu} sx={{ color: "#64748B" }}>
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {actionMenu}
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
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1.5,
            px: 2,
            py: 2,
            backgroundColor: cardBackground,
            borderBottom: `1px solid ${project.priority ? priorityStyle.border : "#E5E7EB"}`,
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
            <Typography fontWeight={800} sx={{ fontSize: 15, color: "#0F172A", lineHeight: 1.35, mb: 0.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {project.name || "Untitled Project"}
            </Typography>
            <Typography
              variant="caption"
              color="#64748B"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.45,
                minHeight: 34,
              }}
            >
              {project.description || "No description"}
            </Typography>
          </Box>

          <Stack spacing={0.8} alignItems="flex-end" sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.6} alignItems="center">
              <Chip
                size="small"
                label={chipStyle.label}
                sx={{
                  height: 22,
                  fontSize: 10,
                  fontWeight: 800,
                  bgcolor: chipStyle.bg,
                  color: chipStyle.color,
                  border: `1px solid ${chipStyle.border}`,
                }}
              />
              <Tooltip title="Actions">
                <IconButton size="small" onClick={openMenu} sx={{ color: "#64748B" }}>
                  <MoreVertIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        <Stack spacing={1.1} sx={{ mb: 2, p: 2 }}>
          <MetaItem
            icon={<PlaceIcon sx={{ fontSize: 16 }} />}
            label="Location"
            value={formatLocation(project.location)}
          />
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
      </CardContent>

      <Box sx={{ px: 2, pb: 2, mt: "auto" }}>
        <ApprovalStatusBadge
          project={project}
          onViewApproval={() => actions.onViewApproval(project)}
          onResubmit={() => actions.onSubmitForApproval(project)}
        />
      </Box>

      {actionMenu}
    </Card>
  );
}
