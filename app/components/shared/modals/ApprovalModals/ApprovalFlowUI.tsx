"use client";

import { useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  Alert,
  LinearProgress,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getProjectApprovals } from "@/app/redux/controllers/approvalController";
import type { ProjectApproval } from "@/app/redux/slices/approvalSlice";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CancelIcon from "@mui/icons-material/Cancel";

interface ApprovalFlowUIProps {
  projectId: string;
  projectStatus?: string;
  variant?: "default" | "simple";
}

const statusConfig: Record<
  ProjectApproval["status"],
  {
    icon: typeof CheckCircleIcon;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  }
> = {
  APPROVED: {
    icon: CheckCircleIcon,
    color: "#10b981",
    bgColor: "#ffffff",
    borderColor: "#a7f3d0",
    label: "✓",
  },
  PENDING: {
    icon: PendingIcon,
    color: "#f59e0b",
    bgColor: "#ffffff",
    borderColor: "#fce7b6",
    label: "⏳",
  },
  REJECTED: {
    icon: CancelIcon,
    color: "#ef4444",
    bgColor: "#ffffff",
    borderColor: "#fecaca",
    label: "✗",
  },
};

const getSimpleStatus = (
  approval: ProjectApproval,
  index: number,
  currentStepIndex: number,
) => {
  if (approval.status === "APPROVED") {
    return { label: "SUBMITTED", color: "#16a34a", dot: "#d1d5db" };
  }
  if (approval.status === "REJECTED") {
    return { label: "REJECTED", color: "#dc2626", dot: "#dc2626" };
  }
  if (currentStepIndex === index || currentStepIndex === -1) {
    return { label: "PENDING", color: "#dc2626", dot: "#2563eb" };
  }
  return { label: "WAITING", color: "#f59e0b", dot: "#d1d5db" };
};

const getStatusLabel = (projectStatus: string) => {
  switch (projectStatus) {
    case "FOR_REVIEW":
      return "🔍 FOR REVIEW";
    case "FOR_APPROVAL":
      return "⏳ FOR APPROVAL";
    case "NEEDS_REVISION":
      return "🔄 NEEDS REVISION";
    case "ACTIVE":
      return "✅ ACTIVE";
    case "REJECTED":
      return "❌ REJECTED";
    default:
      return "📋 PENDING";
  }
};

export default function ApprovalFlowUI({
  projectId,
  projectStatus = "DRAFT",
  variant = "default",
}: ApprovalFlowUIProps) {
  const dispatch = useAppDispatch();
  const { allApprovals } = useAppSelector((state) => state.approval);

  useEffect(() => {
    dispatch(getProjectApprovals(projectId));
  }, [dispatch, projectId]);

  const projectApprovals = allApprovals[projectId] || [];

  if (!projectApprovals || projectApprovals.length === 0) {
    return (
      <Alert severity="info" sx={{ fontSize: 11, py: 1 }}>
        Not submitted for approval yet
      </Alert>
    );
  }

  // Calculate progress
  const completedCount = projectApprovals.filter((a) => a.status === "APPROVED").length;
  const totalCount = projectApprovals.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const currentStepIndex = projectApprovals.findIndex((a) => a.status === "PENDING");

  if (variant === "simple") {
    return (
      <Box>
        {projectApprovals.map((approval, index) => {
          const status = getSimpleStatus(approval, index, currentStepIndex);
          const isLast = index === projectApprovals.length - 1;

          return (
            <Box
              key={approval.id}
              sx={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "18px 1fr auto",
                gap: 1,
                px: 1.25,
                py: 1.1,
                borderBottom: isLast ? "none" : "1px solid #eef2f7",
              }}
            >
              {!isLast && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 19,
                    top: 24,
                    bottom: -2,
                    width: 2,
                    bgcolor: "#e5e7eb",
                  }}
                />
              )}
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  mt: 0.35,
                  borderRadius: "50%",
                  bgcolor: status.dot,
                  border: "2px solid #ffffff",
                  boxShadow: "0 0 0 1px #e5e7eb",
                  zIndex: 1,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{ fontSize: 11, fontWeight: 800, color: "#16a34a", lineHeight: 1.2 }}
                >
                  {approval.approverName || approval.level}
                </Typography>
                <Typography
                  noWrap
                  sx={{ fontSize: 10, color: "#64748b", fontWeight: 700, lineHeight: 1.3 }}
                >
                  {approval.approverRole || approval.level}
                </Typography>
              </Box>
              <Typography
                sx={{
                  pt: 0.2,
                  fontSize: 9,
                  fontWeight: 900,
                  color: status.color,
                  letterSpacing: 0.2,
                }}
              >
                {status.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <Box sx={{ fontSize: 12 }}>
      {/* STATUS BADGE */}
      <Box sx={{ mb: 1.5 }}>
        <Chip
          label={getStatusLabel(projectStatus)}
          size="small"
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 700,
            backgroundColor:
              projectStatus === "FOR_APPROVAL"
                ? "#fef3c7"
                : projectStatus === "FOR_REVIEW"
                  ? "#dbeafe"
                  : projectStatus === "NEEDS_REVISION"
                    ? "#fed7aa"
                    : projectStatus === "ACTIVE"
                      ? "#dcfce7"
                      : "#f3f4f6",
            color:
              projectStatus === "FOR_APPROVAL"
                ? "#92400e"
                : projectStatus === "FOR_REVIEW"
                  ? "#0c2d6b"
                  : projectStatus === "NEEDS_REVISION"
                    ? "#92400e"
                    : projectStatus === "ACTIVE"
                      ? "#065f46"
                      : "#1f2937",
          }}
        />
      </Box>

      {/* PROGRESS BAR */}
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5, fontSize: 10 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>
            Progress
          </Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#10b981" }}>
            {completedCount}/{totalCount}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "#e5e7eb",
            "& .MuiLinearProgress-bar": {
              backgroundColor: "#10b981",
              borderRadius: 3,
            },
          }}
        />
      </Box>

      {/* APPROVAL STEPS - COMPACT */}
      <Stack spacing={1}>
        {projectApprovals.map((approval, index) => {
          const config = statusConfig[approval.status];
          const isCurrent = index === currentStepIndex;

          return (
            <Box
              key={approval.id}
              sx={{
                p: 1.25,
                border: `1.5px solid ${config.borderColor}`,
                backgroundColor: config.bgColor,
                borderRadius: 1,
                transition: "all 0.3s ease",
                animation: isCurrent ? "pulse 2s infinite" : "none",
                "@keyframes pulse": {
                  "0%, 80%": {
                    boxShadow: "0 0 0 3px rgba(245, 159, 11, 0.8)",
                  },
                  "50%": {
                    boxShadow: "0 0 0 4px rgba(245, 158, 11, 0)",
                  },
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {/* ICON */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: isCurrent ? 40 : 32,
                    height: isCurrent ? 40 : 32,
                    borderRadius: "50%",
                    backgroundColor: config.color,
                    flexShrink: 0,
                    fontSize: isCurrent ? 16 : 14,
                    fontWeight: 700,
                    color: "white",
                    transition: "all 0.3s ease",
                  }}
                >
                  {config.label}
                </Box>

                {/* CONTENT */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#1f2937" }}>
                      {approval.level}
                    </Typography>
                    {approval.approverName && (
                      <Typography sx={{ fontSize: 10, color: "#6b7280" }}>
                        • {approval.approverName}
                      </Typography>
                    )}
                  </Box>
                  {approval.remarks && (
                    <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 0.25, fontStyle: "italic" }}>
                      &quot;{approval.remarks}&quot;
                    </Typography>
                  )}
                </Box>

                {/* BADGE */}
                {isCurrent && (
                  <Chip
                    label="NOW"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 9,
                      fontWeight: 700,
                      backgroundColor: "#f59e0b",
                      color: "white",
                      animation: "pulse-badge 1.5s infinite",
                      "@keyframes pulse-badge": {
                        "0%, 100%": { opacity: 1 },
                        "50%": { opacity: 0.6 },
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
