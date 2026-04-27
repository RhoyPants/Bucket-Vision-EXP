"use client";

import React from "react";
import {
  Drawer,
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  Link,
} from "@mui/material";
import { DailyReport } from "@/app/redux/slices/dailyReportSlice";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import DownloadIcon from "@mui/icons-material/Download";
import ReceiverChips from "../../components/ReceiverChips";

interface DailyReportViewerProps {
  report: DailyReport;
  open: boolean;
  onClose: () => void;
}

export default function DailyReportViewer({
  report,
  open,
  onClose,
}: DailyReportViewerProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: { xs: "100%", sm: 480 },
          p: 3,
          maxHeight: "100vh",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
          }}
        >
          <Box>
            <Chip
              label={`Day ${report.dayNumber}`}
              sx={{
                backgroundColor: "#4B2E8315",
                color: "#4B2E83",
                fontWeight: 700,
                mb: 1,
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Daily Report
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "#999" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Content */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Date & Location */}
          <Box>
            <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
              DATE
            </Typography>
            <Typography sx={{ mt: 0.5 }}>
              {formatDate(report.date)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
              LOCATION
            </Typography>
            <Typography sx={{ mt: 0.5, fontWeight: 600 }}>
              {report.location}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
              SUBMITTED BY
            </Typography>
            <Typography sx={{ mt: 0.5 }}>
              {report.user.name}
              <Typography variant="caption" sx={{ display: "block", color: "#999" }}>
                {report.user.email}
              </Typography>
            </Typography>
          </Box>

          {/* Remarks */}
          <Box>
            <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
              REMARKS
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {report.remarks}
            </Typography>
          </Box>

          {/* Recipients */}
          <Box>
            <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
              SHARED WITH
            </Typography>
            <Box sx={{ mt: 1 }}>
              <ReceiverChips receivers={report.receivers} maxShow={10} />
            </Box>
          </Box>

          {/* Attachments */}
          {report.attachments && report.attachments.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
                ATTACHMENTS ({report.attachments.length})
              </Typography>
              <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                {report.attachments.map((url, idx) => (
                  <Button
                    key={idx}
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    fullWidth
                    href={url}
                    target="_blank"
                    sx={{
                      textTransform: "none",
                      justifyContent: "flex-start",
                      borderColor: "#E0E0E0",
                      color: "#333",
                      "&:hover": {
                        borderColor: "#4B2E83",
                        backgroundColor: "rgba(75,46,131,0.04)",
                      },
                    }}
                  >
                    Attachment {idx + 1}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          {/* Metadata */}
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <Typography variant="caption" sx={{ color: "#999" }}>
              Created on{" "}
              {new Date(report.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
