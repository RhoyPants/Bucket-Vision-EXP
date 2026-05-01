"use client";

import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Button,
} from "@mui/material";
import UpdateIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface SubtaskCardProps {
  id: string;
  title: string;
  status: number; // 0 = not started, 1 = in progress, 2 = completed
  progress: number;
  priority: string;
  task?: {
    id: string;
    title: string;
  } | null;
  Scope?: {
    id: string;
    name: string;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  onUpdateProgress: (subtaskId: string) => void;
  onViewDetails: (subtaskId: string) => void;
}

const statusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Not Started", color: "#9E9E9E" },
  1: { label: "In Progress", color: "#3B82F6" },
  2: { label: "Completed", color: "#22C55E" },
};

const priorityColors: Record<string, string> = {
  HIGH: "#E5494D",
  MEDIUM: "#FF9800",
  LOW: "#57A55A",
  NORMAL: "#57A55A",
};

const getProgressColor = (progress: number) => {
  if (progress === 0) return "#9E9E9E";
  if (progress < 50) return "#F59E0B";
  if (progress < 100) return "#3B82F6";
  return "#22C55E";
};

export default function SubtaskCard({
  id,
  title,
  status,
  progress,
  priority,
  task,
  Scope,
  project,
  onUpdateProgress,
  onViewDetails,
}: SubtaskCardProps) {
  const statusInfo = statusMap[status] || statusMap[0];

  return (
    <Card
      sx={{
        background: "#FFFFFF",
        border: "1px solid #E0E4EA",
        borderRadius: "12px",
        transition: "all 0.2s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",

        "&:hover": {
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
          borderColor: "#0C66E4",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #F0F2F5",
          background: "linear-gradient(135deg, #F7F8FA 0%, #FFFFFF 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            mb: 1,
          }}
        >
          {/* Priority Indicator */}
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: priorityColors[priority] || "#888",
              flexShrink: 0,
              mt: 0.8,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1D1F26",
              lineHeight: "22px",
              flex: 1,
              wordBreak: "break-word",
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Status Chip */}
        <Chip
          label={statusInfo.label}
          size="small"
          sx={{
            background: statusInfo.color,
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: "12px",
            height: "24px",
          }}
        />
      </Box>

      {/* Content */}
      <CardContent
        sx={{
          flex: 1,
          p: 2,
          pb: 1.5,
        }}
      >
        {/* Project, Scope, Task Info */}
        <Box sx={{ mb: 2 }}>
          {/* Project */}
          {project?.name && (
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "#7D8693",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Project
              </Typography>

              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1D1F26",
                  mt: 0.3,
                }}
              >
                {project?.name || "No project"}
              </Typography>
            </Box>
          )}

          {/* Scope */}
          {Scope && (
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "#7D8693",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Scope
              </Typography>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1D1F26",
                  mt: 0.3,
                }}
              >
                {Scope?.name || "N/A"}
              </Typography>
            </Box>
          )}

          {/* Task */}
          {task && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "#7D8693",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Task
              </Typography>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1D1F26",
                  mt: 0.3,
                }}
              >
                {task?.title || "N/A"}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Progress Section */}
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 0.8,
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
              Progress
            </Typography>
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                color: getProgressColor(progress),
              }}
            >
              {progress}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: "#DDE1E8",

              "& .MuiLinearProgress-bar": {
                backgroundColor: getProgressColor(progress),
                transition: "0.3s ease",
              },
            }}
          />
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions
        sx={{
          p: 1.5,
          gap: 1,
          borderTop: "1px solid #F0F2F5",
          pt: 1.5,
        }}
      >
        <Button
          size="small"
          variant="contained"
          startIcon={<UpdateIcon />}
          onClick={() => onUpdateProgress(id)}
          sx={{
            flex: 1,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "12px",
            background: "#0C66E4",

            "&:hover": {
              background: "#0A5AC4",
            },
          }}
        >
          Update Progress
        </Button>

        <IconButton
          size="small"
          onClick={() => onViewDetails(id)}
          sx={{
            color: "#0C66E4",
            border: "1px solid #0C66E4",

            "&:hover": {
              background: "rgba(12, 102, 228, 0.08)",
            },
          }}
        >
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
}
