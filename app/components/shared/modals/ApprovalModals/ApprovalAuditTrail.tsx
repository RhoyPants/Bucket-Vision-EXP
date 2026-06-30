"use client";

import {
  Box,
  Typography,
  Card,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { ApprovalAuditLog } from "@/app/redux/slices/approvalSlice";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import SendIcon from "@mui/icons-material/Send";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import type { SvgIconComponent } from "@mui/icons-material";

interface ApprovalAuditTrailProps {
  auditLogs: ApprovalAuditLog[];
  loading?: boolean;
  empty?: boolean;
  variant?: "default" | "simple";
}

const actionConfig: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: SvgIconComponent;
  }
> = {
  SUBMITTED: {
    label: "Project Submitted",
    color: "#f59e0b",
    bgColor: "#ffffff",
    borderColor: "#f59e0b",
    icon: SendIcon,
  },
  APPROVED: {
    label: "Approved",
    color: "#10b981",
    bgColor: "#ffffff",
    borderColor: "#10b981",
    icon: CheckCircleIcon,
  },
  REJECTED: {
    label: "Rejected",
    color: "#ef4444",
    bgColor: "#ffffff",
    borderColor: "#ef4444",
    icon: BlockIcon,
  },
  RESUBMITTED: {
    label: "Resubmitted",
    color: "#3b82f6",
    bgColor: "#ffffff",
    borderColor: "#3b82f6",
    icon: RestartAltIcon,
  },
};

export default function ApprovalAuditTrail({
  auditLogs,
  loading = false,
  empty = false,
  variant = "default",
}: ApprovalAuditTrailProps) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (empty || auditLogs.length === 0) {
    return (
      <Alert
        severity="info"
        sx={{
          backgroundColor: "#eff6ff",
          borderColor: "#3b82f6",
          color: "#1e40af",
        }}
      >
        No approval history yet
      </Alert>
    );
  }

  if (variant === "simple") {
    return (
      <Box>
        {auditLogs.map((log, index) => {
          const config = actionConfig[log.action] || actionConfig.SUBMITTED;
          const Icon = config.icon;
          const isLast = index === auditLogs.length - 1;

          return (
            <Box
              key={log.id}
              sx={{
                display: "grid",
                gridTemplateColumns: log.remarks ? "1fr auto" : "1fr",
                gap: 1.25,
                px: 1.25,
                py: 1.1,
                borderBottom: isLast ? "none" : "1px solid #eef2f7",
                alignItems: "start",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{ fontSize: 10.5, fontWeight: 900, color: "#16a34a", lineHeight: 1.25 }}
                >
                  {config.label}
                </Typography>
                <Typography
                  noWrap
                  sx={{ fontSize: 10, fontWeight: 700, color: "#475569", lineHeight: 1.3 }}
                >
                  {log.approverName || "System"}
                </Typography>
                <Typography
                  noWrap
                  sx={{ fontSize: 9.5, color: "#64748b", lineHeight: 1.3 }}
                >
                  {new Date(log.createdAt).toLocaleString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "2-digit",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Typography>
              </Box>

              {log.remarks && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "16px minmax(0, 1fr)",
                    alignItems: "center",
                    gap: 0.5,
                    minWidth: 88,
                    maxWidth: 128,
                    pt: 0.4,
                  }}
                >
                  <Icon sx={{ fontSize: 15, color: config.color }} />
                  <Typography
                    noWrap
                    title={log.remarks}
                    sx={{ fontSize: 9.5, color: "#334155", fontWeight: 700 }}
                  >
                    {log.remarks}
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        sx={{ fontSize: 14, fontWeight: 600, color: "#1f2937", mb: 2.5 }}
      >
        📋 Approval Timeline
      </Typography>

      <Stack spacing={3}>
        {auditLogs.map((log, index) => {
          const config = actionConfig[log.action] || actionConfig.SUBMITTED;
          const Icon = config.icon;

          return (
            <Box key={log.id} sx={{ position: "relative" }}>
              {/* Timeline line */}
              {index < auditLogs.length - 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 9,
                    top: 25,
                    width: 2,
                    height: 90,
                    backgroundColor: "#e5e7eb",
                  }}
                />
              )}

              {/* Timeline dot + card container */}
              <Box sx={{ display: "flex", gap: 2 }}>
                {/* Timeline dot */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    flexShrink: 0,
                    backgroundColor: config.color,
                    boxShadow: `0 0 0 4px ${config.bgColor}`,
                    mt: 0,
                  }}
                >
                  <Icon sx={{ color: "white", fontSize: 12 }} />
                </Box>

                {/* Card content */}
                <Card
                  sx={{
                    flex: 1,
                    p: 2,
                    border: `1px solid ${config.borderColor}`,
                    backgroundColor: config.bgColor,
                    boxShadow: "none",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#1f2937",
                          mb: 0.5,
                        }}
                      >
                        {config.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "#9ca3af",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Typography>

                      {log.approverName && (
                        <Box
                          sx={{
                            mb: 1.5,
                            p: 1,
                            backgroundColor: "rgba(0,0,0,0.05)",
                            borderRadius: 0.75,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#1f2937",
                              mb: 0.25,
                            }}
                          >
                            👤 {log.approverName || "N/A"}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "#9ca3af",
                              fontWeight: 500,
                              mt: 0.25,
                            }}
                          >
                            Role: {log.level}
                          </Typography>
                        </Box>
                      )}

                      {log.remarks && (
                        <Box
                          sx={{
                            mt: 1,
                            p: 1.5,
                            backgroundColor: "rgba(255, 255, 255, 0.7)",
                            borderLeft: `3px solid ${config.color}`,
                            borderRadius: 0.75,
                          }}
                        >
                          <Typography sx={{ fontSize: 12, color: "#374151" }}>
                            <strong>Remarks:</strong> {log.remarks}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
