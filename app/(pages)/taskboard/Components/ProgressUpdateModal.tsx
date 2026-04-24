"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  LinearProgress,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useState } from "react";
import axiosApi from "@/app/lib/axios";

interface ProgressUpdateModalProps {
  open: boolean;
  onClose: () => void;
  subtaskId: string;
  subtaskTitle: string;
  currentProgress: number;
  onSuccess?: () => void;
}

export default function ProgressUpdateModal({
  open,
  onClose,
  subtaskId,
  subtaskTitle,
  currentProgress,
  onSuccess,
}: ProgressUpdateModalProps) {
  const [progress, setProgress] = useState(currentProgress.toString());
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const progressValue = parseInt(progress) || 0;
  const isValid = progressValue >= 0 && progressValue <= 100;

  const handleSave = async () => {
    if (!isValid) {
      setError("Progress must be between 0 and 100");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      await axiosApi.post("/progress", {
        subtaskId,
        date: today,
        value: progressValue,
        remarks: remarks || undefined,
      });

      setProgress("");
      setRemarks("");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update progress");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#1D1F26",
        }}
      >
        📈 Update Progress
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Subtask Title */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "#7D8693",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              mb: 0.5,
            }}
          >
            Subtask
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#1D1F26",
            }}
          >
            {subtaskTitle}
          </Typography>
        </Box>

        {/* Current Progress Info */}
        <Box
          sx={{
            p: 1.5,
            background: "#F7F8FA",
            borderRadius: "8px",
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#7D8693",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Current Progress
            </Typography>
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#0C66E4",
              }}
            >
              {currentProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={currentProgress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: "#DDE1E8",

              "& .MuiLinearProgress-bar": {
                backgroundColor: "#0C66E4",
              },
            }}
          />
        </Box>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* New Progress Input */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "#7D8693",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              mb: 0.8,
            }}
          >
            Update Progress (%)
          </Typography>
          <TextField
            disabled={loading}
            type="number"
            inputProps={{
              min: 0,
              max: 100,
              step: 5,
            }}
            fullWidth
            value={progress}
            onChange={(e) => {
              setProgress(e.target.value);
              setError("");
            }}
            placeholder="Enter progress percentage"
            sx={{
              "& .MuiOutlinedInput-root": {
                background: "#FFFFFF",
              },
            }}
          />

          {/* Progress Preview */}
          {progress && (
            <Box sx={{ mt: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#7D8693",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Preview:
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.max(0, progressValue))}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#DDE1E8",
                  mt: 0.5,

                  "& .MuiLinearProgress-bar": {
                    backgroundColor:
                      progressValue === 0
                        ? "#9E9E9E"
                        : progressValue < 50
                          ? "#F59E0B"
                          : progressValue < 100
                            ? "#3B82F6"
                            : "#22C55E",
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {/* Remarks */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "#7D8693",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              mb: 0.8,
            }}
          >
            Remarks (Optional)
          </Typography>
          <TextField
            disabled={loading}
            fullWidth
            multiline
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any notes about this progress update..."
            sx={{
              "& .MuiOutlinedInput-root": {
                background: "#FFFFFF",
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          pt: 2.5,
          borderTop: "1px solid #E0E4EA",
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "#7D8693",

            "&:hover": {
              background: "#F7F8FA",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={!isValid || loading}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            background: "#0C66E4",

            "&:hover": {
              background: "#0A5AC4",
            },

            "&:disabled": {
              background: "#D6D9DE",
              color: "#FFFFFF",
            },
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} color="inherit" />
              Saving...
            </Box>
          ) : (
            "Update Progress"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
