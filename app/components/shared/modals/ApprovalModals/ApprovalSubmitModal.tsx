"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { useState, useEffect } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIcon from "@mui/icons-material/Assignment";

interface ApprovalSubmitModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  projectName: string;
  projectStatus: string;
  hasScopes: boolean;
  hasTasks: boolean;
  requiresApproval: boolean;
  isSubmitting?: boolean;
}

export default function ApprovalSubmitModal({
  open,
  onClose,
  onConfirm,
  projectName,
  projectStatus,
  hasScopes,
  hasTasks,
  requiresApproval,
  isSubmitting = false,
}: ApprovalSubmitModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
  }, [open]);

  const canSubmit = hasScopes && hasTasks;

  const handleSubmit = async () => {
    try {
      setError("");
      setLoading(true);
      await onConfirm();
    } catch (err: any) {
      setError(err.message || "Failed to submit project for approval");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #4B2E83 0%, #6d40a0 100%)",
          color: "white",
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        Submit Project for Approval
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5 }}>
            {error}
          </Alert>
        )}

        {/* Project Info */}
        <Box sx={{ mb: 2.5, p: 2, backgroundColor: "#f3f4f6", borderRadius: 1.5 }}>
          <Typography sx={{ fontSize: 12, color: "#6b7280", mb: 0.5 }}>
            PROJECT
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1f2937" }}>
            {projectName}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.5 }}>
            Current Status: <strong>{projectStatus}</strong>
          </Typography>
        </Box>

        {/* Validation Checklist */}
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6b7280", mb: 1.5, textTransform: "uppercase" }}>
          ✓ Requirements
        </Typography>

        <List dense sx={{ mb: 2.5 }}>
          <ListItem
            sx={{
              py: 1,
              px: 0,
              opacity: hasScopes ? 1 : 0.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {hasScopes ? (
                <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
              ) : (
                <ErrorIcon sx={{ color: "#ef4444", fontSize: 20 }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Scopes Defined"
              secondary="Project must have at least one scope"
              primaryTypographyProps={{ fontSize: 12, fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: 11 }}
            />
          </ListItem>

          <ListItem
            sx={{
              py: 1,
              px: 0,
              opacity: hasTasks ? 1 : 0.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {hasTasks ? (
                <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
              ) : (
                <ErrorIcon sx={{ color: "#ef4444", fontSize: 20 }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Tasks Created"
              secondary="Each scope must have at least one task"
              primaryTypographyProps={{ fontSize: 12, fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: 11 }}
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 2.5 }} />

        {/* Approval Workflow Info */}
        {requiresApproval && (
          <>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6b7280", mb: 1.5, textTransform: "uppercase" }}>
              📋 Approval Workflow
            </Typography>

            <Alert severity="info" sx={{ mb: 2.5, backgroundColor: "#eff6ff", borderColor: "#3b82f6", color: "#1e40af" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                Your project will go through a multi-level approval process:
              </Typography>
              <Box sx={{ mt: 1, ml: 2 }}>
                <Typography sx={{ fontSize: 11, mb: 0.5 }}>
                  1. <strong>BU Head Review</strong> - Your business unit head will review the project
                </Typography>
                <Typography sx={{ fontSize: 11, mb: 0.5 }}>
                  2. <strong>OP Approval</strong> - Office of President will review and approve
                </Typography>
                <Typography sx={{ fontSize: 11 }}>
                  3. <strong>Project Activation</strong> - Once approved, your project becomes ACTIVE
                </Typography>
              </Box>
            </Alert>
          </>
        )}

        {!requiresApproval && (
          <Alert severity="success" sx={{ mb: 2.5, backgroundColor: "#ecfdf5", borderColor: "#10b981", color: "#065f46" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
              ✓ Approval workflow is disabled. Project will be automatically activated.
            </Typography>
          </Alert>
        )}

        {!canSubmit && (
          <Alert severity="warning" icon={<InfoIcon />}>
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
              Cannot submit: Please ensure all requirements are met
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ pt: 2, pb: 2.5, borderTop: "1px solid #e5e7eb" }}>
        <Button onClick={onClose} disabled={isSubmitting || loading} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit || isSubmitting || loading}
          sx={{
            backgroundColor: "#4B2E83",
            "&:hover": { backgroundColor: "#3d2363" },
            textTransform: "none",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {loading && <CircularProgress size={16} sx={{ color: "white" }} />}
          Submit for Approval
        </Button>
      </DialogActions>
    </Dialog>
  );
}
