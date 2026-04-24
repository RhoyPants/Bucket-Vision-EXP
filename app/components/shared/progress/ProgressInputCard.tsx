"use client";

import { useState } from "react";
import {
  Paper,
  Box,
  TextField,
  Button,
  LinearProgress,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import axiosApi from "@/app/lib/axios";

interface ProgressInputCardProps {
  subtaskId: string;
  subtaskTitle: string;
  currentProgress: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function ProgressInputCard({
  subtaskId,
  subtaskTitle,
  currentProgress,
  onSuccess,
  onClose,
}: ProgressInputCardProps) {
  const [progress, setProgress] = useState(currentProgress.toString());
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const progressValue = parseInt(progress) || 0;
  const isValid = progressValue >= 0 && progressValue <= 100;
  const isChanged = progressValue !== currentProgress;

  const handleSave = async () => {
    if (!isValid) {
      setError("Progress must be between 0 and 100");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const today = new Date().toISOString().split("T")[0];

      await axiosApi.post("/progress", {
        subtaskId,
        date: today,
        value: progressValue,
        remarks: remarks || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setProgress("");
        setRemarks("");
        setSuccess(false);
        onSuccess?.();
        onClose?.();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update progress");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Paper
        sx={{
          p: 3,
          textAlign: "center",
          background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
          borderRadius: "12px",
          border: "none",
        }}
      >
        <CheckIcon
          sx={{
            fontSize: 48,
            color: "#FFFFFF",
            mb: 1,
          }}
        />
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#FFFFFF",
          }}
        >
          Progress Updated!
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: "12px",
        border: "1px solid #E0E4EA",
        background: "#FFFFFF",
      }}
    >
      {/* Subtask Title */}
      <Box sx={{ mb: 2 }}>
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
          Updating
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

      {/* Current Progress */}
      <Box
        sx={{
          p: 1.5,
          background: "#F7F8FA",
          borderRadius: "8px",
          mb: 2,
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
            Current
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

      {/* Progress Input */}
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
          New Progress (%)
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
          size="small"
          value={progress}
          onChange={(e) => {
            setProgress(e.target.value);
            setError("");
          }}
          placeholder="Enter progress"
          sx={{
            "& .MuiOutlinedInput-root": {
              background: "#FFFFFF",
            },
          }}
        />

        {/* Progress Preview */}
        {progress && (
          <Box sx={{ mt: 1.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#7D8693",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Preview
              </Typography>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color:
                    progressValue === 0
                      ? "#9E9E9E"
                      : progressValue < 50
                        ? "#F59E0B"
                        : progressValue < 100
                          ? "#3B82F6"
                          : "#22C55E",
                }}
              >
                {progressValue}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.max(0, progressValue))}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "#DDE1E8",

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
          Remarks (Optional)
        </Typography>
        <TextField
          disabled={loading}
          fullWidth
          size="small"
          multiline
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add notes about this update..."
          sx={{
            "& .MuiOutlinedInput-root": {
              background: "#FFFFFF",
            },
          }}
        />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            flex: 1,
            textTransform: "none",
            fontWeight: 600,
            color: "#7D8693",
            background: "#F7F8FA",

            "&:hover": {
              background: "#E6E8EE",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={!isValid || loading || !isChanged}
          variant="contained"
          sx={{
            flex: 1,
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
      </Box>
    </Paper>
  );
}
