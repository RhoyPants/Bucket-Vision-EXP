"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { useState } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import InfoIcon from "@mui/icons-material/Info";
import { ProjectApproval } from "@/app/redux/slices/approvalSlice";
import ApprovalAuditTrail from "./ApprovalAuditTrail";
import ApprovalRejectDialog from "./ApprovalRejectDialog";
import ApprovalFlowUI from "./ApprovalFlowUI";
import { ApprovalAuditLog } from "@/app/redux/slices/approvalSlice";

interface ApprovalDetailModalProps {
  open: boolean;
  onClose: () => void;
  project: any; // Full project data
  approval: ProjectApproval | null;
  auditLogs: ApprovalAuditLog[];
  onApprove: () => Promise<void>;
  onReject: (remarks: string) => Promise<void>;
  isSubmitting?: boolean;
  loading?: boolean;
}

export default function ApprovalDetailModal({
  open,
  onClose,
  project,
  approval,
  auditLogs,
  onApprove,
  onReject,
  isSubmitting = false,
  loading = false,
}: ApprovalDetailModalProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const canApprove = approval?.status === "PENDING";

  const handleApprove = async () => {
    try {
      await onApprove();
      onClose();
    } catch (err: any) {
      console.error("Approval failed:", err);
    }
  };

  const handleRejectConfirm = async (remarks: string) => {
    try {
      await onReject(remarks);
      setRejectDialogOpen(false);
      onClose();
    } catch (err: any) {
      console.error("Rejection failed:", err);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #4B2E83 0%, #6d40a0 100%)",
            color: "white",
            fontWeight: 700,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>Project Approval</Box>
          {approval && (
            <Chip
              icon={approval.status === "PENDING" ? <InfoIcon /> : <CheckCircleIcon />}
              label={approval.status}
              sx={{
                backgroundColor:
                  approval.status === "PENDING"
                    ? "#fbbf24"
                    : approval.status === "APPROVED"
                      ? "#10b981"
                      : "#ef4444",
                color: "white",
                fontWeight: 600,
              }}
            />
          )}
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Project Info Card */}
              <Card sx={{ p: 2.5, mb: 2.5, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#6b7280", fontWeight: 600, mb: 0.5 }}>
                      Project Name
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1f2937" }}>
                      {project?.name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#6b7280", fontWeight: 600, mb: 0.5 }}>
                      Status
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#4B2E83" }}>
                      {project?.status}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#6b7280", fontWeight: 600, mb: 0.5 }}>
                      Owner
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                      {project?.user?.name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#6b7280", fontWeight: 600, mb: 0.5 }}>
                      Budget
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                      ${project?.totalBudget?.toLocaleString() || "N/A"}
                    </Typography>
                  </Box>
                </Box>

                {project?.description && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography sx={{ fontSize: 11, color: "#6b7280", fontWeight: 600, mb: 1 }}>
                      Description
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                      {project.description}
                    </Typography>
                  </>
                )}
              </Card>

              {/* Approval Flow Progress */}
              {project?.id && (
                <Card sx={{ p: 2.5, mb: 2.5, border: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
                  <ApprovalFlowUI projectId={project.id} projectStatus={project.status} />
                </Card>
              )}

              {/* Audit Trail */}
              <Card sx={{ p: 2.5, border: "1px solid #e5e7eb" }}>
                <ApprovalAuditTrail auditLogs={auditLogs} empty={auditLogs.length === 0} />
              </Card>

              {/* Info Alert */}
              {canApprove && (
                <Alert severity="info" sx={{ mt: 2.5, backgroundColor: "#eff6ff", borderColor: "#3b82f6" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                    You can approve or reject this project below. Rejections will require detailed remarks.
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ pt: 2.5, pb: 2, borderTop: "1px solid #e5e7eb" }}>
          <Button onClick={onClose} disabled={isSubmitting} sx={{ textTransform: "none" }}>
            Close
          </Button>
          {canApprove && (
            <>
              <Button
                onClick={() => setRejectDialogOpen(true)}
                disabled={isSubmitting}
                sx={{
                  textTransform: "none",
                  color: "#ef4444",
                  borderColor: "#ef4444",
                }}
                variant="outlined"
              >
                {isSubmitting && <CircularProgress size={16} sx={{ mr: 1 }} />}
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                variant="contained"
                sx={{
                  backgroundColor: "#10b981",
                  "&:hover": { backgroundColor: "#059669" },
                  textTransform: "none",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {isSubmitting && <CircularProgress size={16} sx={{ color: "white" }} />}
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <ApprovalRejectDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={handleRejectConfirm}
        projectName={project?.name}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
