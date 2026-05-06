"use client";

import { Chip, Box, Tooltip, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import BlockIcon from "@mui/icons-material/Block";
import EditIcon from "@mui/icons-material/Edit";
import CallMadeIcon from "@mui/icons-material/CallMade";
import ArchiveIcon from "@mui/icons-material/Archive";

export type ProjectStatus = "DRAFT" | "FOR_REVIEW" | "FOR_APPROVAL" | "ACTIVE" | "INACTIVE" | "NEEDS_REVISION" | "REJECTED" | "ARCHIVED";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  size?: "small" | "medium";
  isLatestVersion?: boolean;
}

const statusConfig: Record<ProjectStatus, { label: string; color: any; bgColor: string; icon: any; description: string }> = {
  DRAFT: {
    label: "Draft",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    icon: EditIcon,
    description: "Project is in draft mode",
  },
  FOR_REVIEW: {
    label: "For Review",
    color: "#f59e0b",
    bgColor: "#fffbeb",
    icon: PendingActionsIcon,
    description: "Awaiting BU Head review",
  },
  FOR_APPROVAL: {
    label: "For Approval",
    color: "#3b82f6",
    bgColor: "#eff6ff",
    icon: PendingActionsIcon,
    description: "Awaiting OP (Office of President) approval",
  },
  ACTIVE: {
    label: "Active",
    color: "#10b981",
    bgColor: "#ecfdf5",
    icon: CheckCircleIcon,
    description: "Project is approved and active",
  },
  INACTIVE: {
    label: "Inactive",
    color: "#8b5cf6",
    bgColor: "#faf5ff",
    icon: BlockIcon,
    description: "Project is inactive (superseded by newer version)",
  },
  NEEDS_REVISION: {
    label: "Needs Revision",
    color: "#ef4444",
    bgColor: "#fef2f2",
    icon: WarningIcon,
    description: "Project rejected - revisions required",
  },
  REJECTED: {
    label: "Rejected",
    color: "#dc2626",
    bgColor: "#fef2f2",
    icon: BlockIcon,
    description: "Project has been rejected",
  },
  ARCHIVED: {
    label: "Archived",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    icon: ArchiveIcon,
    description: "Superseded by a newer approved version",
  },
};

export default function ProjectStatusBadge({
  status,
  size = "small",
  isLatestVersion = true,
}: ProjectStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig["DRAFT"];
  const Icon = config.icon;

  const badge = (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: size === "small" ? 1.5 : 2,
        py: size === "small" ? 0.5 : 0.75,
        borderRadius: 1,
        backgroundColor: config.bgColor,
        border: `1px solid ${config.color}22`,
      }}
    >
      <Icon sx={{ fontSize: size === "small" ? 16 : 20, color: config.color }} />
      <Typography
        sx={{
          fontSize: size === "small" ? 11 : 12,
          fontWeight: 600,
          color: config.color,
          textTransform: "capitalize",
        }}
      >
        {config.label}
      </Typography>
      {!isLatestVersion && status === "INACTIVE" && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.3,
            ml: 0.5,
            px: 0.75,
            py: 0.25,
            borderRadius: 0.75,
            backgroundColor: "#e5e7eb",
          }}
        >
          <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#374151" }}>Old</Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Tooltip title={config.description} arrow>
      <Box>{badge}</Box>
    </Tooltip>
  );
}
