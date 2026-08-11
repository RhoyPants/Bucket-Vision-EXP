"use client";

import React from "react";
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
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PlaceIcon from "@mui/icons-material/Place";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ProjectCardActions, ViewType } from "./types";

type ProjectCardProject = {
  id: string;
  name?: string;
  description?: string;
  progress?: number;
  overallProgress?: number;
  completionRate?: number;
  completionPercentage?: number;
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
  showActions?: boolean;
  nextApproverName?: string;
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

const statusChipColor = (status?: string) => {
  const normalized = String(status || "DRAFT").toUpperCase();
  if (normalized === "ACTIVE" || normalized === "APPROVED") return { bg: "#D1FAE5", color: "#111827", border: "#34D399", label: "Active" };
  if (normalized === "COMPLETED") return { bg: "#EEF2FF", color: "#3730A3", border: "#818CF8", label: "Completed" };
  if (normalized === "FOR_REVIEW") return { bg: "#FEF3C7", color: "#111827", border: "#FBBF24", label: "For Review" };
  if (normalized === "FOR_APPROVAL") return { bg: "#DBEAFE", color: "#111827", border: "#60A5FA", label: "For Approval" };
  if (normalized === "NEEDS_REVISION") return { bg: "#FFE4E6", color: "#111827", border: "#FB7185", label: "Needs Revision" };
  if (normalized === "REJECTED") return { bg: "#FFE4E6", color: "#111827", border: "#FB7185", label: "Rejected" };
  if (normalized === "ARCHIVED") return { bg: "#F1F5F9", color: "#111827", border: "#94A3B8", label: "Archived" };
  if (normalized === "CANCELLED") return { bg: "#FFE4E6", color: "#111827", border: "#FB7185", label: "Cancelled" };
  return { bg: "#EDE9FE", color: "#111827", border: "#A78BFA", label: "Draft" };
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

const PROGRESS_COLOR = "#281469";
const PROGRESS_GRADIENT: [string, string] = ["#315FAE", "#281469"];

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

function ApprovalStatusBadge({ project, onViewApproval, onResubmit, nextApproverName }: {
  project: ProjectCardProject;
  onViewApproval: () => void;
  onResubmit: () => void;
  nextApproverName?: string;
}) {
  const status = project.status;
  const tone = statusChipColor(status);
  const isPending = ["FOR_REVIEW", "FOR_APPROVAL"].includes(status ?? "");
  const isRejected = status === "NEEDS_REVISION" || status === "REJECTED";
  const isNeedsRevision = status === "NEEDS_REVISION";
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
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: tone.border, flexShrink: 0 }} />
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
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: tone.border, flexShrink: 0 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: tone.color }}>
            {status === "FOR_REVIEW" ? "Pending Review" : "Pending Approval"}
          </Typography>
          {nextApproverName && (
            <Typography noWrap title={nextApproverName} sx={{ mt: 0.1, maxWidth: 210, fontSize: 10, color: "#64748b", fontWeight: 600 }}>
              Next: {nextApproverName}
            </Typography>
          )}
        </Box>
        <Typography sx={{ fontSize: 10, color: "#475569", ml: "auto", fontWeight: 700 }}>View</Typography>
      </Box>
    );
  }

  if (isRejected) {
    return (
      <Box
        onClick={isNeedsRevision ? onViewApproval : onResubmit}
        sx={{ ...badgeBase, cursor: "pointer", "&:hover": { borderColor: tone.color } }}
      >
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: tone.border, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: tone.color }}>Needs Revision</Typography>
        <Typography sx={{ fontSize: 10, color: "#475569", ml: "auto", fontWeight: 700 }}>
          {isNeedsRevision ? "View" : "Revise"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={badgeBase}>
      <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: tone.border, flexShrink: 0 }} />
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
  showActions = true,
  nextApproverName,
}: ProjectCardProps) {
  const isArchived = project.status === "ARCHIVED";
  const chipStyle = statusChipColor(project.status);
  const businessUnitName = project.businessUnitDetails?.name || project.businessUnitName || "No BU";
  const versionLabel = getProjectVersionLabel(project);
  const versionTone = chipStyle;
  const approvalOnly = actionMode === "approval";
  const progressPercent = getProjectProgress(project);
  const progressDegree = Math.round((progressPercent / 100) * 360);
  const [progressStartColor, progressEndColor] = PROGRESS_GRADIENT;

  if (viewType === "list") {
    return (
      <Box
        onClick={() => actions.onOpenDashboard?.(project.id)}
        role="link"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") actions.onOpenDashboard?.(project.id);
        }}
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
            sx={{ fontSize: 10, fontWeight: 800, bgcolor: chipStyle.border, color: chipStyle.color, border: `1px solid ${chipStyle.border}` }}
          />
          <Tooltip title={versionLabel}>
            <Chip
              size="small"
              label={versionLabel}
              sx={{
                maxWidth: 110,
                fontSize: 10,
                fontWeight: 800,
                bgcolor: versionTone.border,
                color: "#111827",
                border: `1px solid ${versionTone.border}`,
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

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          {showActions && (approvalOnly || project.status === "NEEDS_REVISION") ? (
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
            null
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Card
      onClick={() => actions.onOpenDashboard?.(project.id)}
      role="link"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") actions.onOpenDashboard?.(project.id);
      }}
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
        cursor: "pointer",
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
            height: 58,
            position: "relative",
            background: "linear-gradient(23deg, #210E64 35%, #1B169D 100%)",
            borderBottom: `3px solid ${versionTone.border}`,
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, pr: approvalOnly ? 10 : 4, width: "100%" }}>
            <Typography fontWeight={800} sx={{ fontSize: 13, color: "#FFFFFF", lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {project.name || "Untitled Project"}
            </Typography>
          </Box>

          <Tooltip title={versionLabel}>
            <Chip
              size="small"
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
                bgcolor: versionTone.border,
                color: versionTone.color,
                border: `1px solid ${versionTone.border}`,
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
              bgcolor: chipStyle.border,
              color: chipStyle.color,
              border: `1px solid ${chipStyle.border}`,
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)",
            }}
          />
          {showActions && !approvalOnly && project.status === "NEEDS_REVISION" && (
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  actions.onViewApproval(project);
                }}
                sx={{
                  color: "#1D4ED8",
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 26,
                  height: 26,
                  border: "1px solid #BFDBFE",
                  backgroundColor: "#EFF6FF",
                }}
              >
                <VisibilityIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ mb: 1, px: 2, pt: 3, pb: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="stretch" sx={{ mb: 1.25 }}>
            <Stack spacing={1.1} sx={{ flex: "0 0 65%", minWidth: 0 }}>
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
              <MetaItem
                icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                label="Expected Start Date"
                value={formatDate(project.startDate)}
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
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  background: `conic-gradient(${progressStartColor} 0deg, ${progressEndColor} ${progressDegree}deg, #E5E7EB ${progressDegree}deg 360deg)`,
                }}
              >
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    bgcolor: "#FFFFFF",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "inset 0 0 0 1px rgba(148, 163, 184, 0.16)",
                  }}
                >
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: PROGRESS_COLOR, lineHeight: 1 }}>
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
          nextApproverName={nextApproverName}
        />
      </Box>

    </Card>
  );
}
