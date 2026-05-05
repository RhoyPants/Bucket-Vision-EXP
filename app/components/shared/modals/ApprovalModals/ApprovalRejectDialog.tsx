"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { useState } from "react";
import WarningIcon from "@mui/icons-material/Warning";

interface ApprovalRejectDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => Promise<void>;
  projectName: string;
  isSubmitting?: boolean;
}

export default function ApprovalRejectDialog({
  open,
  onClose,
  onConfirm,
  projectName,
  isSubmitting = false,
}: ApprovalRejectDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const handleReject = async () => {
    if (!remarks.trim()) {
      setError("Remarks are required");
      return;
    }

    try {
      setError("");
      await onConfirm(remarks);
      setRemarks("");
    } catch (err: any) {
      setError(err.message || "Failed to reject project");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          background: "#fef2f2",
          borderBottom: "1px solid #fecaca",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <WarningIcon sx={{ color: "#ef4444", fontSize: 24 }} />
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#1f2937" }}>
            Reject Project
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
            This action will send the project back for revision
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Alert
          severity="warning"
          sx={{
            mb: 2.5,
            backgroundColor: "#fffbeb",
            borderColor: "#fbbf24",
            color: "#92400e",
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
            Project "<strong>{projectName}</strong>" will be returned to the project owner with status{" "}
            <strong>NEEDS_REVISION</strong>
          </Typography>
        </Alert>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Rejection Remarks *"
          placeholder="Explain why this project needs revision..."
          value={remarks}
          onChange={(e) => {
            setRemarks(e.target.value);
            if (error) setError("");
          }}
          disabled={isSubmitting}
          error={!!error}
          helperText={error || `${remarks.length}/500 characters`}
          inputProps={{ maxLength: 500 }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              backgroundColor: "#f9fafb",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#e5e7eb",
            },
          }}
        />

        <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 1.5 }}>
          The project owner will receive a notification with your comments and can resubmit after making revisions.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ pt: 2, borderTop: "1px solid #e5e7eb" }}>
        <Button onClick={onClose} disabled={isSubmitting} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={handleReject}
          variant="contained"
          disabled={isSubmitting || !remarks.trim()}
          sx={{
            backgroundColor: "#ef4444",
            "&:hover": { backgroundColor: "#dc2626" },
            textTransform: "none",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {isSubmitting && <CircularProgress size={16} sx={{ color: "white" }} />}
          Reject & Send Back
        </Button>
      </DialogActions>
    </Dialog>
  );
}
