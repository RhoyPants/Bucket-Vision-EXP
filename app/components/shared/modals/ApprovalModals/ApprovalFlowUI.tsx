"use client";

import { useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Alert,
  LinearProgress,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getProjectApprovals } from "@/app/redux/controllers/approvalController";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CancelIcon from "@mui/icons-material/Cancel";

interface ApprovalFlowUIProps {
  projectId: string;
  projectStatus?: string;
}

const statusConfig: Record<string, any> = {
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

export default function ApprovalFlowUI({ projectId, projectStatus = "DRAFT" }: ApprovalFlowUIProps) {
  const dispatch = useAppDispatch();
  const { allApprovals } = useAppSelector((state) => state.approval);

  useEffect(() => {
    dispatch(getProjectApprovals(projectId) as any);
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
  const completedCount = projectApprovals.filter((a: any) => a.status === "APPROVED").length;
  const totalCount = projectApprovals.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const currentStepIndex = projectApprovals.findIndex((a: any) => a.status === "PENDING");

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
        {projectApprovals.map((approval: any, index: number) => {
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
                  "0%, 100%": {
                    boxShadow: "0 0 0 0 rgba(245, 158, 11, 0.4)",
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
                      "{approval.remarks}"
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
