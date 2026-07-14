"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import RuleFolderOutlinedIcon from "@mui/icons-material/RuleFolderOutlined";

interface NeedsRevisionModalProps {
  open: boolean;
  projectName?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  reason?: string;
  remarks?: string;
  onClose: () => void;
  onReviseResubmit: () => void;
}

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function NeedsRevisionModal({
  open,
  projectName,
  rejectedBy,
  rejectedAt,
  reason,
  remarks,
  onClose,
  onReviseResubmit,
}: NeedsRevisionModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "#0f172a",
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <WarningAmberIcon sx={{ color: "#2563eb", fontSize: 20 }} />
        Needs Revision
      </DialogTitle>

      <DialogContent sx={{ pt: 2.25 }}>
        <Stack spacing={2}>
          <Typography sx={{ fontSize: 14, color: "#031f46", lineHeight: 1.5 }}>
            <strong>{projectName || "This request"}</strong> was returned and requires revision before resubmission.
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              variant="outlined"
              label={`Approver: ${rejectedBy || "N/A"}`}
              sx={{ fontWeight: 600, borderColor: "#cbd5e1", color: "#334155", backgroundColor: "#ffffff" }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`Date: ${formatDateTime(rejectedAt)}`}
              sx={{ fontWeight: 600, borderColor: "#cbd5e1", color: "#334155", backgroundColor: "#ffffff" }}
            />
          </Stack>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "#1d4ed8", fontWeight: 800, mb: 0.5, display: "flex", alignItems: "center", gap: 0.6, textTransform: "uppercase" }}>
              <RuleFolderOutlinedIcon sx={{ fontSize: 14, color: "#1d4ed8" }} />
              Reason
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#000000", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {reason || "Request requires revision based on approval review."}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              border: "1px solid #d1d5db",
              backgroundColor: "#f8fafc",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "#b45309", fontWeight: 800, mb: 0.5, display: "flex", alignItems: "center", gap: 0.6, textTransform: "uppercase" }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: "#b45309" }} />
              Remarks
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#000000", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {remarks || "No remarks provided."}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, borderTop: "1px solid #f1f5f9" }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ textTransform: "none", fontWeight: 700, borderColor: "#cbd5e1", color: "#334155" }}
        >
          Close
        </Button>
        <Button
          onClick={onReviseResubmit}
          variant="contained"
          sx={{ textTransform: "none", fontWeight: 800, backgroundColor: "#0f172a", "&:hover": { backgroundColor: "#020617" } }}
        >
          Revise & Resubmit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
