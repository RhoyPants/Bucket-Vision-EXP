"use client";

import { Box, Typography, Card, CircularProgress, Alert, Stack } from "@mui/material";
import { ApprovalAuditLog } from "@/app/redux/slices/approvalSlice";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import SendIcon from "@mui/icons-material/Send";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

interface ApprovalAuditTrailProps {
  auditLogs: ApprovalAuditLog[];
  loading?: boolean;
  empty?: boolean;
}

const actionConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: any }> = {
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
      <Alert severity="info" sx={{ backgroundColor: "#eff6ff", borderColor: "#3b82f6", color: "#1e40af" }}>
        No approval history yet
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1f2937", mb: 2.5 }}>
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
                    left: 19,
                    top: 50,
                    width: 2,
                    height: 60,
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
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    flexShrink: 0,
                    backgroundColor: config.color,
                    boxShadow: `0 0 0 4px ${config.bgColor}`,
                    mt: 0,
                  }}
                >
                  <Icon sx={{ color: "white", fontSize: 20 }} />
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
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1f2937", mb: 0.5 }}>
                        {config.label}
                      </Typography>

                      {log.approverName && (
                        <Box sx={{ mb: 1.5, p: 1, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 0.75 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#1f2937", mb: 0.25 }}>
                            👤 {log.approverName || "N/A"}
                          </Typography>
                          {log.approverEmail && (
                            <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                              {log.approverEmail || "No email"}
                            </Typography>
                          )}
                          <Typography sx={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, mt: 0.25 }}>
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

                    <Typography sx={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </Typography>
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
