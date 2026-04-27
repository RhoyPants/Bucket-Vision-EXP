"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  InputAdornment,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  getDailyReports,
  deleteDailyReport,
} from "@/app/redux/controllers/dailyReportController";
import Layout from "@/app/components/shared/Layout";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DailyReportModal from "./components/DailyReportModal";
import ReceiverChips from "../components/ReceiverChips";
import { DailyReport } from "@/app/redux/slices/dailyReportSlice";
import SearchIcon from "@mui/icons-material/Search";
import { useRouter } from "next/navigation";

export default function DailyReportsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  const { reports, loading } = useAppSelector((state) => state.dailyReport);
  const projects = useAppSelector((state) => state.project.projects);

  useEffect(() => {
    dispatch(getDailyReports(filters) as any);
  }, [dispatch]);

  const handleCreateOpen = () => setCreateModalOpen(true);
  const handleCreateClose = () => setCreateModalOpen(false);

  const handleEditOpen = (report: DailyReport) => {
    setSelectedReport(report);
    setEditModalOpen(true);
  };
  const handleEditClose = () => {
    setEditModalOpen(false);
    setSelectedReport(null);
  };

  const handleViewOpen = (report: DailyReport) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };
  const handleViewClose = () => {
    setViewDialogOpen(false);
    setSelectedReport(null);
  };

  const handleDeleteConfirm = async () => {
    if (reportToDelete) {
      await dispatch(deleteDailyReport(reportToDelete) as any);
      setDeleteConfirmOpen(false);
      setReportToDelete(null);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const filteredReports = reports.filter((report) => {
    if (
      filters.search &&
      !report.remarks.toLowerCase().includes(filters.search.toLowerCase()) &&
      !report.location.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.dateFrom && new Date(report.date) < new Date(filters.dateFrom)) {
      return false;
    }
    if (filters.dateTo && new Date(report.date) > new Date(filters.dateTo)) {
      return false;
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Header with Back Button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3.5 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              color: "#4B2E83",
              "&:hover": { backgroundColor: "rgba(75,46,131,0.1)" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: "#1a1a1a",
              }}
            >
              Daily Reports
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mt: 0.3 }}>
              Track daily site accomplishments
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateOpen}
            sx={{
              backgroundColor: "#4B2E83",
              fontWeight: 600,
              textTransform: "none",
              fontSize: 14,
              "&:hover": {
                backgroundColor: "#3d2363",
              },
            }}
          >
            New Daily Report
          </Button>
        </Box>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2.5,
            border: "1px solid rgba(0,0,0,0.06)",
            backgroundColor: "#fff",
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <TextField
            size="small"
            placeholder="Search by location or remarks..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ mr: 1, color: "#999" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 250,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          />

          <TextField
            size="small"
            label="From Date"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            sx={{
              minWidth: 150,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          />

          <TextField
            size="small"
            label="To Date"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            sx={{
              minWidth: 150,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          />

          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            sx={{
              borderColor: "#4B2E83",
              color: "#4B2E83",
              textTransform: "none",
              fontWeight: 600,
            }}
            onClick={() => setFilters({ search: "", dateFrom: "", dateTo: "" })}
          >
            Reset
          </Button>
        </Paper>

        {/* Table */}
        {loading && reports.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: "1px solid rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <TableContainer>
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
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: "center", py: 4 }}>
                        <Typography sx={{ color: "#999" }}>
                          No reports found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
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
                          <Chip
                            label={`Day ${report.dayNumber}`}
                            size="small"
                            sx={{
                              backgroundColor: "#4B2E8315",
                              color: "#4B2E83",
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12 }}>
                            {formatDate(report.date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                            {report.location}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              fontSize: 12,
                              maxWidth: 200,
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
                          <ReceiverChips receivers={report.receivers} maxShow={2} />
                        </TableCell>
                        <TableCell>
                          {report.attachments && report.attachments.length > 0 ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <FileDownloadIcon
                                fontSize="small"
                                sx={{ fontSize: 16, color: "#3B82F6" }}
                              />
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
                              onClick={() => handleViewOpen(report)}
                              sx={{
                                color: "#3B82F6",
                                "&:hover": { backgroundColor: "rgba(59,130,246,0.1)" },
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEditOpen(report)}
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
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Create Modal */}
        <DailyReportModal
          open={createModalOpen}
          onClose={handleCreateClose}
          report={null}
        />

        {/* Edit Modal */}
        {selectedReport && editModalOpen && (
          <DailyReportModal
            open={editModalOpen}
            onClose={handleEditClose}
            report={selectedReport}
          />
        )}

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onClose={handleViewClose} maxWidth="sm" fullWidth>
          <DialogTitle>Report Details</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedReport && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
                    DAY #
                  </Typography>
                  <Typography sx={{ mt: 0.5 }}>Day {selectedReport.dayNumber}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
                    DATE
                  </Typography>
                  <Typography sx={{ mt: 0.5 }}>
                    {new Date(selectedReport.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
                    LOCATION
                  </Typography>
                  <Typography sx={{ mt: 0.5 }}>{selectedReport.location}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
                    REMARKS
                  </Typography>
                  <Typography sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                    {selectedReport.remarks}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
                    SUBMITTED BY
                  </Typography>
                  <Typography sx={{ mt: 0.5 }}>{selectedReport.user.name}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>
                    SHARED WITH
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <ReceiverChips receivers={selectedReport.receivers} maxShow={10} />
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleViewClose}>Close</Button>
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
      </Box>
    </Layout>
  );
}
