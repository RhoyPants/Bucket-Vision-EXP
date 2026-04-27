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
import { getWeeklyReports } from "@/app/redux/controllers/weeklyReportController";
import { deleteWeeklyReport } from "@/app/redux/controllers/weeklyReportController";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { WeeklyReport } from "@/app/redux/slices/weeklyReportSlice";
import ReceiverChips from "./ReceiverChips";

export default function WeeklyAccomplishmentsList() {
  const dispatch = useAppDispatch();
  const [viewModalOpen, setViewModalOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<WeeklyReport | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [reportToDelete, setReportToDelete] = React.useState<string | null>(null);

  const { reports, loading } = useAppSelector((state) => state.weeklyReport);

  useEffect(() => {
    dispatch(getWeeklyReports() as any);
  }, [dispatch]);

  const handleDeleteConfirm = async () => {
    if (reportToDelete) {
      await dispatch(deleteWeeklyReport(reportToDelete) as any);
      setDeleteConfirmOpen(false);
      setReportToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading && reports.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (reports.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography variant="body1" sx={{ color: "#999" }}>
          No weekly reports yet
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
                Week
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
                Date Range
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
                Submitted By
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
                Receivers
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
                Created
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
            {reports.slice(0, 5).map((report) => (
              <TableRow
                key={report.id}
                sx={{
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  "&:hover": {
                    backgroundColor: "rgba(75,46,131,0.02)",
                  },
                }}
              >
                <TableCell>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: "#1a1a1a",
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {report.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 12, color: "#666" }}>
                    {formatDate(report.dateFrom)} – {formatDate(report.dateTo)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                    {report.user.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <ReceiverChips receivers={report.receivers} maxShow={2} />
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 12, color: "#666" }}>
                    {formatDate(report.createdAt)}
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
                    <IconButton
                      size="small"
                      sx={{
                        color: "#F59E0B",
                        "&:hover": { backgroundColor: "rgba(245,158,11,0.1)" },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setReportToDelete(report.id);
                        setDeleteConfirmOpen(true);
                      }}
                      sx={{
                        color: "#EF4444",
                        "&:hover": { backgroundColor: "rgba(239,68,68,0.1)" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {reports.length > 5 && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button
            variant="text"
            sx={{
              color: "#4B2E83",
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            View All {reports.length} Reports
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
          {selectedReport?.title}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Date Range
              </Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                {selectedReport && (
                  <>
                    {formatDate(selectedReport.dateFrom)} –{" "}
                    {formatDate(selectedReport.dateTo)}
                  </>
                )}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Author
              </Typography>
              <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                {selectedReport?.user.name}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Receivers
              </Typography>
              <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selectedReport?.receivers.map((r) => (
                  <Chip
                    key={r.user.id}
                    label={r.user.name}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: "#4B2E83",
                      color: "#4B2E83",
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Remarks
              </Typography>
              <Typography sx={{ mt: 0.5, lineHeight: 1.6 }}>
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
                      startIcon={<FileDownloadIcon />}
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
                      {url.split("/").pop()}
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

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Report?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this report? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
