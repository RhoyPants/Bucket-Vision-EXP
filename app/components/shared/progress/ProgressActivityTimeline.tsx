"use client";

import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Divider,
} from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CancelIcon from "@mui/icons-material/Cancel";
import { getProgressHistory, ProgressHistoryEvent } from "@/app/api-service/progressUpdateRequestService";

const formatPercent = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00";
};

const getEventIcon = (type: string) => {
  switch (type) {
    case "PROGRESS_CREATED":
      return <CheckCircleIcon sx={{ color: "#2E7D32", fontSize: 20 }} />;
    case "PROGRESS_UPDATED":
      return <TrendingUpIcon sx={{ color: "#1976d2", fontSize: 20 }} />;
    case "DECREASE_REQUESTED":
      return <WarningIcon sx={{ color: "#F57C00", fontSize: 20 }} />;
    case "DECREASE_APPROVED":
      return <CheckCircleIcon sx={{ color: "#388E3C", fontSize: 20 }} />;
    case "DECREASE_REJECTED":
      return <ErrorIcon sx={{ color: "#D32F2F", fontSize: 20 }} />;
    case "DECREASE_CANCELLED":
      return <CancelIcon sx={{ color: "#757575", fontSize: 20 }} />;
    default:
      return <TimelineIcon sx={{ fontSize: 20 }} />;
  }
};

const getEventColor = (type: string): "success" | "info" | "warning" | "error" | "default" => {
  switch (type) {
    case "PROGRESS_CREATED":
      return "success";
    case "PROGRESS_UPDATED":
      return "info";
    case "DECREASE_REQUESTED":
      return "warning";
    case "DECREASE_APPROVED":
      return "success";
    case "DECREASE_REJECTED":
      return "error";
    case "DECREASE_CANCELLED":
      return "default";
    default:
      return "default";
  }
};

const getEventLabel = (type: string) => {
  switch (type) {
    case "PROGRESS_CREATED":
      return "Progress Created";
    case "PROGRESS_UPDATED":
      return "Progress Updated";
    case "DECREASE_REQUESTED":
      return "Decrease Requested";
    case "DECREASE_APPROVED":
      return "Decrease Approved";
    case "DECREASE_REJECTED":
      return "Decrease Rejected";
    case "DECREASE_CANCELLED":
      return "Decrease Cancelled";
    default:
      return "Event";
  }
};

interface ProgressActivityTimelineProps {
  subtaskId: string;
  limit?: number;
}

export default function ProgressActivityTimeline({
  subtaskId,
  limit = 10,
}: ProgressActivityTimelineProps) {
  const [events, setEvents] = useState<ProgressHistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchHistory = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError("");
    try {
      const response = await getProgressHistory(subtaskId, page, limit);
      if (page === 1) {
        setEvents(response.data);
      } else {
        setEvents((prev) => [...prev, ...response.data]);
      }
      setCurrentPage(page);
      setHasMore(response.pagination.page < response.pagination.totalPages);
    } catch (err: any) {
      console.error("Failed to load progress history:", err);
      setError("Unable to load activity history");
    } finally {
      setLoading(false);
    }
  }, [subtaskId, limit]);

  useEffect(() => {
    void fetchHistory(1);
  }, [fetchHistory]);

  const handleViewMore = () => {
    void fetchHistory(currentPage + 1);
  };

  if (loading && events.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error && events.length === 0) {
    return (
      <Alert severity="warning" sx={{ mt: 1 }}>
        {error}
      </Alert>
    );
  }

  if (events.length === 0) {
    return (
      <Box sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1, textAlign: "center" }}>
        <Typography variant="body2" sx={{ color: "#999" }}>
          No activity recorded yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={1.5}>
        {events.reverse().map((event, idx) => (
          <Box key={event.id || idx}>
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                p: 1.5,
                backgroundColor: "#fafafa",
                borderRadius: 1,
                border: "1px solid #e5e7eb",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "#f0f4ff",
                  borderColor: "#1976d2",
                },
              }}
            >
              {/* Icon */}
              <Box sx={{ flexShrink: 0, pt: 0.25 }}>
                {getEventIcon(event.type)}
              </Box>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Event Type & Timestamp */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: "#1f2937",
                    }}
                  >
                    {getEventLabel(event.type)}
                  </Typography>
                  <Chip
                    label={getEventColor(event.type) === "default" ? "CANCELLED" : ""}
                    color={getEventColor(event.type)}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 10,
                      display: getEventColor(event.type) === "default" ? "none" : "inline-flex",
                    }}
                  />
                </Box>

                {/* Value Change (if applicable) */}
                {(event.currentPercent !== undefined || event.requestedPercent !== undefined) && (
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>
                    {formatPercent(event.currentPercent)}% →{" "}
                    {formatPercent(event.requestedPercent || event.value)}%
                  </Typography>
                )}

                {/* Remarks */}
                {event.remarks && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "#666",
                      mb: 0.5,
                      fontSize: 11,
                    }}
                  >
                    {event.remarks}
                  </Typography>
                )}

                {/* Review Remarks */}
                {event.reviewRemarks && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "#666",
                      mb: 0.5,
                      fontSize: 11,
                      fontStyle: "italic",
                    }}
                  >
                    Review: {event.reviewRemarks}
                  </Typography>
                )}

                {/* Performed By / Approver Info */}
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", fontSize: 11 }}>
                  {event.performedBy && (
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      <strong>{event.performedBy.name || "User"}</strong>
                    </Typography>
                  )}
                  {event.requestedBy && event.type === "DECREASE_REQUESTED" && (
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Requested by <strong>{event.requestedBy.name || "User"}</strong>
                    </Typography>
                  )}
                  {event.approvedBy && event.type === "DECREASE_APPROVED" && (
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Approved by <strong>{event.approvedBy.name || "User"}</strong>
                    </Typography>
                  )}
                  {event.rejectedBy && event.type === "DECREASE_REJECTED" && (
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Rejected by <strong>{event.rejectedBy.name || "User"}</strong>
                    </Typography>
                  )}
                </Box>

                {/* Timestamp */}
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "#999",
                    mt: 0.5,
                    fontSize: 10,
                  }}
                >
                  {dayjs(event.timestamp).format("MMM DD, YYYY • hh:mm A")}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>

      {/* View More Button */}
      {hasMore && (
        <Button
          size="small"
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleViewMore}
          disabled={loading}
        >
          {loading ? "Loading..." : "View More"}
        </Button>
      )}
    </Box>
  );
}
