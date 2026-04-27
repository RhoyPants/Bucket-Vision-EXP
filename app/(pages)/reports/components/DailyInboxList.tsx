"use client";

import React, { useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getInboxReports, markDailyReportAsRead } from "@/app/redux/controllers/dailyReportController";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { DailyReport } from "@/app/redux/slices/dailyReportSlice";
import ReceiverChips from "./ReceiverChips";

export default function DailyInboxList() {
  const dispatch = useAppDispatch();
  const [viewModalOpen, setViewModalOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<DailyReport | null>(null);

  const { inboxReports, loading } = useAppSelector((state) => state.dailyReport);

  useEffect(() => {
    dispatch(getInboxReports() as any);
  }, [dispatch]);

  const handleMarkAsRead = async (reportId: string) => {
    try {
      await dispatch(markDailyReportAsRead(reportId) as any);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading && inboxReports.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (inboxReports.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography variant="body1" sx={{ color: "#999" }}>
          No inbox reports
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "rgba(75,46,131,0.04)" }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#4B2E83",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Status
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#4B2E83",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Day #
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#4B2E83",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Date
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#4B2E83",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Location
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#4B2E83",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Remarks
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#4B2E83",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                From
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#4B2E83",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Attachments
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#4B2E83",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
                align="right"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inboxReports.slice(0, 5).map((report) => {
              const isRead = report.receivers[0]?.read;
              return (
                <TableRow
                  key={report.id}
                  sx={{
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    backgroundColor: isRead ? "transparent" : "rgba(75,46,131,0.02)",
                    "&:hover": {
                      backgroundColor: "rgba(75,46,131,0.04)",
                    },
                  }}
                >
                  <TableCell>
                    <Chip
                      label={isRead ? "Read" : "New"}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: isRead ? "#10B981" : "#3B82F6",
                        color: isRead ? "#10B981" : "#3B82F6",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>
                      {report.dayNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, color: "#666" }}>
                      {formatDate(report.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, color: "#666" }}>
                      {report.location}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#1a1a1a",
                        maxWidth: 150,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {report.remarks}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                      {report.user.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {report.attachments && report.attachments.length > 0 ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <FileDownloadIcon sx={{ fontSize: 16, color: "#3B82F6" }} />
                        <Typography
                          variant="caption"
                          component="a"
                          href={report.attachments[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontSize: 11,
                            color: "#3B82F6",
                            fontWeight: 600,
                            textDecoration: "none",
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {report.attachments.length} file(s)
                        </Typography>
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "#ccc" }}>-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                      {!isRead && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleMarkAsRead(report.id)}
                          sx={{
                            fontSize: 10,
                            color: "#3B82F6",
                            borderColor: "#3B82F6",
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": {
                              backgroundColor: "rgba(59,130,246,0.1)",
                              borderColor: "#3B82F6",
                            },
                          }}
                        >
                          Mark Read
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedReport(report);
                          setViewModalOpen(true);
                        }}
                        sx={{
                          color: "#3B82F6",
                          "&:hover": { backgroundColor: "rgba(59,130,246,0.1)" },
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {inboxReports.length > 5 && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button
            variant="text"
            sx={{
              color: "#4B2E83",
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            View All {inboxReports.length} Reports
          </Button>
        </Box>
      )}

      {/* View Modal */}
      <Dialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#1a1a1a" }}>
          Day {selectedReport?.dayNumber} Report
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "#666" }}>
                From
              </Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                {selectedReport?.user.name}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Date
              </Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                {selectedReport &&
                  new Date(selectedReport.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Location
              </Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                {selectedReport?.location}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Remarks
              </Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                {selectedReport?.remarks}
              </Typography>
            </Box>

            {selectedReport?.attachments && selectedReport.attachments.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: "#666" }}>
                  Attachments ({selectedReport.attachments.length})
                </Typography>
                <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                  {selectedReport.attachments.map((url, idx) => (
                    <Button
                      key={idx}
                      href={url}
                      target="_blank"
                      variant="text"
                      sx={{
                        justifyContent: "flex-start",
                        color: "#3B82F6",
                        textTransform: "none",
                        "&:hover": { backgroundColor: "rgba(59,130,246,0.1)" },
                      }}
                    >
                      📎 {url.split("/").pop()}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
