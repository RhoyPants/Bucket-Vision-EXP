"use client";

import { Box, Card, Typography, Chip, Stack, Button, Tooltip, Alert, Divider } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import StorageIcon from "@mui/icons-material/Storage";
import RefreshIcon from "@mui/icons-material/Refresh";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ProjectStatusBadge from "./ProjectStatusBadge";

interface ProjectApprovalStatusCardProps {
  project: any;
  onViewApproval?: () => void;
  onResubmit?: () => void;
  compact?: boolean;
}

export default function ProjectApprovalStatusCard({
  project,
  onViewApproval,
  onResubmit,
  compact = false,
}: ProjectApprovalStatusCardProps) {
  const isPending = ["FOR_REVIEW", "FOR_APPROVAL"].includes(project?.status);
  const isRejected = project?.status === "NEEDS_REVISION" || project?.status === "REJECTED";
  const isActive = project?.status === "ACTIVE";
  const isDraft = project?.status === "DRAFT";

  if (compact) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <ProjectStatusBadge status={project?.status} size="small" />
        {isPending && (
          <Tooltip title="Project is pending approval">
            <WarningIcon sx={{ fontSize: 20, color: "#f59e0b", animation: "pulse 2s infinite" }} />
          </Tooltip>
        )}
        {isActive && (
          <Tooltip title="Project is active and approved">
            <CheckCircleIcon sx={{ fontSize: 20, color: "#10b981" }} />
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Card
      sx={{
        p: 2.5,
        backgroundColor:
          isActive ? "#ecfdf5" : isPending ? "#fffbeb" : isRejected ? "#fef2f2" : isDraft ? "#f3f4f6" : "#fff",
        border: `1px solid ${
          isActive ? "#d1fae5" : isPending ? "#fcd34d" : isRejected ? "#fecaca" : isDraft ? "#e5e7eb" : "#e5e7eb"
        }`,
        position: "relative",
      }}
    >
      {/* Status Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6b7280", mb: 1, textTransform: "uppercase" }}>
            Project Status
          </Typography>
          <ProjectStatusBadge status={project?.status} />
        </Box>

        {project?.versionNumber && (
          <Tooltip title={`Version ${project.versionNumber}${!project.isLatestVersion ? " (Superseded)" : " (Latest)"}`}>
            <Chip
              icon={<StorageIcon />}
              label={`v${project.versionNumber}`}
              size="small"
              sx={{
                backgroundColor: project.isLatestVersion ? "#dbeafe" : "#e5e7eb",
                color: project.isLatestVersion ? "#1e40af" : "#6b7280",
                fontWeight: 600,
              }}
            />
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Status-Specific Content */}

      {isDraft && (
        <Box>
          <Alert severity="info" sx={{ mb: 2, backgroundColor: "#eff6ff", borderColor: "#3b82f6" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
              ℹ️ This project is in draft mode. Complete the setup and submit for approval to activate it.
            </Typography>
          </Alert>

          <Button
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#4B2E83",
              "&:hover": { backgroundColor: "#3d2363" },
              textTransform: "none",
              fontWeight: 600,
            }}
            onClick={onViewApproval}
          >
            Setup & Submit
          </Button>
        </Box>
      )}

      {isPending && (
        <Box>
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{
              mb: 2,
              backgroundColor: "#fffbeb",
              borderColor: "#fbbf24",
              color: "#92400e",
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
              ⏳ Project is awaiting approval
            </Typography>
            <Typography sx={{ fontSize: 11, mt: 0.5 }}>
              Status: <strong>{project?.status}</strong>
            </Typography>
          </Alert>

          <Stack spacing={1.5}>
            {project?.status === "FOR_REVIEW" && (
              <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                🔄 Your BU Head is reviewing this project
              </Typography>
            )}

            {project?.status === "FOR_APPROVAL" && (
              <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                👔 Office of President (OP) is reviewing this project
              </Typography>
            )}

            <Button
              variant="outlined"
              fullWidth
              sx={{
                textTransform: "none",
                borderColor: "#f59e0b",
                color: "#f59e0b",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#fffbeb" },
              }}
              onClick={onViewApproval}
            >
              View Approval Status
            </Button>
          </Stack>
        </Box>
      )}

      {isRejected && (
        <Box>
          <Alert
            severity="error"
            icon={<WarningIcon />}
            sx={{
              mb: 2,
              backgroundColor: "#fef2f2",
              borderColor: "#fecaca",
              color: "#991b1b",
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
              ❌ Project has been rejected
            </Typography>
            <Typography sx={{ fontSize: 11, mt: 0.5 }}>
              Status: <strong>{project?.status}</strong>
            </Typography>
          </Alert>

          {/* Show rejection reason if available */}
          {project?.rejectionReason && (
            <Box
              sx={{
                p: 1.5,
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                border: "1px solid #fecaca",
                borderRadius: 1,
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 11, color: "#6b7280", fontWeight: 600, mb: 0.5 }}>
                Rejection Reason:
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#374151", fontStyle: "italic", lineHeight: 1.5 }}>
                "{project.rejectionReason}"
              </Typography>
            </Box>
          )}

          <Stack spacing={1.5} direction="row">
            <Button
              variant="outlined"
              fullWidth
              startIcon={<RefreshIcon />}
              sx={{
                textTransform: "none",
                borderColor: "#ef4444",
                color: "#ef4444",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#fef2f2" },
              }}
              onClick={onResubmit}
            >
              Revise & Resubmit
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                textTransform: "none",
                borderColor: "#6b7280",
                color: "#6b7280",
              }}
              onClick={onViewApproval}
            >
              View Details
            </Button>
          </Stack>
        </Box>
      )}

      {isActive && (
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <CheckCircleIcon sx={{ color: "#10b981", fontSize: 24 }} />
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#065f46" }}>
                ✅ Project is Active
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#047857", mt: 0.5 }}>
                This project is approved and can be used in sprints and reports
              </Typography>
            </Box>
          </Stack>

          {project?.activatedAt && (
            <Typography sx={{ fontSize: 10, color: "#6b7280", mb: 2 }}>
              Activated on {new Date(project.activatedAt).toLocaleDateString()}
            </Typography>
          )}

          <Button
            variant="outlined"
            fullWidth
            sx={{
              textTransform: "none",
              borderColor: "#10b981",
              color: "#10b981",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#ecfdf5" },
            }}
            onClick={onViewApproval}
          >
            View Approval History
          </Button>
        </Box>
      )}

      {/* Footer - Common Info */}
      {!isDraft && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1}>
            <Box sx={{ display: "flex", gap: 1, fontSize: 11, color: "#6b7280" }}>
              <GroupIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: 11 }}>
                <strong>Team Members:</strong> {project?.members?.length || 0}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, fontSize: 11, color: "#6b7280" }}>
              <AssignmentTurnedInIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: 11 }}>
                <strong>Scopes:</strong> {project?.scopes?.length || 0}
              </Typography>
            </Box>
          </Stack>
        </>
      )}
    </Card>
  );
}
