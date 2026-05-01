"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getDailyReports, getInboxReports, getSubmittedReports, getDailyReportsSummary } from "@/app/redux/controllers/dailyReportController";
import { getWeeklyReports, getInboxWeeklyReports, getSubmittedWeeklyReports, getWeeklyReportsSummary } from "@/app/redux/controllers/weeklyReportController";
import Layout from "@/app/components/shared/Layout";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import DailyReportModal from "./daily/components/DailyReportModal";
import WeeklyReportModal from "./weekly/components/WeeklyReportModal";

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  
  // Tab states
  const [reportTypeTab, setReportTypeTab] = useState(0); // 0 = Daily, 1 = Weekly
  const [listTypeTab, setListTypeTab] = useState(0); // 0 = Received, 1 = Sent
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDailyModalOpen, setCreateDailyModalOpen] = useState(false);
  const [createWeeklyModalOpen, setCreateWeeklyModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<any>(null);

  // Redux state
  const dailyReports = useAppSelector((state) => state.dailyReport.reports) || [];
  const weeklyReports = useAppSelector((state) => state.weeklyReport.reports) || [];
  const dailyInboxReports = useAppSelector((state) => state.dailyReport.inboxReports) || [];
  const dailySubmittedReports = useAppSelector((state) => state.dailyReport.submittedReports) || [];
  const weeklyInboxReports = useAppSelector((state) => state.weeklyReport.inboxReports) || [];
  const weeklySubmittedReports = useAppSelector((state) => state.weeklyReport.submittedReports) || [];
  const dailySummary = useAppSelector((state) => state.dailyReport.summary);
  const weeklySummary = useAppSelector((state) => state.weeklyReport.summary);
  const currentUser = useAppSelector((state) => state.auth.user);
  const dailyLoading = useAppSelector((state) => state.dailyReport.loading);
  const weeklyLoading = useAppSelector((state) => state.weeklyReport.loading);
  const dailySummaryLoading = useAppSelector((state) => state.dailyReport.summaryLoading);
  const weeklySummaryLoading = useAppSelector((state) => state.weeklyReport.summaryLoading);

  useEffect(() => {
    dispatch(getDailyReports() as any);
    dispatch(getWeeklyReports() as any);
    dispatch(getDailyReportsSummary() as any);
    dispatch(getWeeklyReportsSummary() as any);
  }, [dispatch]);

  // Fetch inbox/submitted reports when list type changes
  useEffect(() => {
    if (reportTypeTab === 0) {
      if (listTypeTab === 0) {
        dispatch(getInboxReports() as any);
      } else {
        dispatch(getSubmittedReports() as any);
      }
    } else {
      if (listTypeTab === 0) {
        dispatch(getInboxWeeklyReports() as any);
      } else {
        dispatch(getSubmittedWeeklyReports() as any);
      }
    }
  }, [reportTypeTab, listTypeTab, dispatch]);

  // Get current report list based on tabs
  const currentReports = useMemo(() => {
    if (reportTypeTab === 0) {
      // Daily reports
      return listTypeTab === 0 ? dailyInboxReports : dailySubmittedReports;
    } else {
      // Weekly reports
      return listTypeTab === 0 ? weeklyInboxReports : weeklySubmittedReports;
    }
  }, [reportTypeTab, listTypeTab, dailyInboxReports, dailySubmittedReports, weeklyInboxReports, weeklySubmittedReports]);

  const currentSummary = reportTypeTab === 0 ? dailySummary : weeklySummary;
  const summaryLoading = reportTypeTab === 0 ? dailySummaryLoading : weeklySummaryLoading;
  const selectedReport = currentReports?.find((r: any) => r.id === selectedReportId);
  const isLoading = reportTypeTab === 0 ? dailyLoading : weeklyLoading;

  // Filter reports by search query
  const filteredReports = useMemo(() => {
    return currentReports.filter((report: any) => {
      const matchesSearch =
        !searchQuery ||
        (reportTypeTab === 1 && report.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        report.remarks?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [currentReports, searchQuery, reportTypeTab]);

  console.log({filteredReports: filteredReports
    
  });
  

  // Format date helper
  const formatDate = (date: string | Date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time helper
  const formatTime = (date: string | Date) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Delete report handler
  const handleDeleteReport = () => {
    if (reportToDelete) {
      // TODO: Call Redux action to delete report
      // dispatch(deleteReport(reportToDelete.id) as any);
      setSelectedReportId(null);
    }
    setDeleteDialogOpen(false);
    setReportToDelete(null);
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 3 }, height: "100vh", display: "flex", flexDirection: "column", maxWidth: "100%", minWidth: 0 }}>
        {/* Summary Highlights */}
        <Box sx={{ mb: 3, display: "flex", gap: 2, flexShrink: 0, flexWrap: "wrap" }}>
          {summaryLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ color: "#999" }}>
                Loading summary...
              </Typography>
            </Box>
          ) : currentSummary ? (
            <>
              {/* Total Submitted */}
              <Paper
                elevation={0}
                sx={{
                  px: 3,
                  py: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0,0,0,0.06)",
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 180,
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    backgroundColor: "#e8f5e9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                    {reportTypeTab === 0 ? "Today" : "This Week"}
                  </Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a" }}>
                    {reportTypeTab === 0 
                      ? (currentSummary as any)?.todayHighlights?.submittedCount || 0
                      : (currentSummary as any)?.thisWeekHighlights?.submittedCount || 0}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "#666" }}>
                    Reports Submitted
                  </Typography>
                </Box>
              </Paper>

              {/* On Time */}
              <Paper
                elevation={0}
                sx={{
                  px: 3,
                  py: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0,0,0,0.06)",
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 180,
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    backgroundColor: "#e3f2fd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircleIcon sx={{ color: "#2196f3", fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                    On Time
                  </Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a" }}>
                    {reportTypeTab === 0 
                      ? (currentSummary as any)?.todayHighlights?.onTimeCount || 0
                      : (currentSummary as any)?.thisWeekHighlights?.onTimeCount || 0}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "#666" }}>
                    {currentSummary?.totalSubmitted === 1 ? "Report" : "Reports"}
                  </Typography>
                </Box>
              </Paper>

              {/* Late Reports */}
              {(reportTypeTab === 0 
                ? (currentSummary as any)?.todayHighlights?.lateCount || 0
                : (currentSummary as any)?.thisWeekHighlights?.lateCount || 0) > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    px: 3,
                    py: 2,
                    borderRadius: 2,
                    border: "1px solid rgba(0,0,0,0.06)",
                    backgroundColor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    minWidth: 180,
                  }}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      backgroundColor: "#fff3e0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <WarningIcon sx={{ color: "#ff9800", fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                      Late
                    </Typography>
                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a" }}>
                      {reportTypeTab === 0 
                        ? (currentSummary as any)?.todayHighlights?.lateCount || 0
                        : (currentSummary as any)?.thisWeekHighlights?.lateCount || 0}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "#666" }}>
                      {currentSummary?.lateReports === 1 ? "Report" : "Reports"}
                    </Typography>
                  </Box>
                </Paper>
              )}

              {/* Pending Review */}
              <Paper
                elevation={0}
                sx={{
                  px: 3,
                  py: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0,0,0,0.06)",
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 180,
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    backgroundColor: "#fce4ec",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#e91e63" }}>
                    ⏳
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                    Pending
                  </Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a" }}>
                    {currentSummary?.totalPending || 0}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "#666" }}>
                    Awaiting Review
                  </Typography>
                </Box>
              </Paper>
            </>
          ) : null}
        </Box>

        {/* Report Type Tabs with Add Button */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: "1px solid rgba(0,0,0,0.06)",
            backgroundColor: "#fff",
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
          }}
        >
          <Tabs
            value={reportTypeTab}
            onChange={(e, newValue) => {
              setReportTypeTab(newValue);
              setSelectedReportId(null);
              setListTypeTab(0);
              setSearchQuery("");
            }}
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "#4B2E83",
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
                color: "#666",
                "&.Mui-selected": {
                  color: "#4B2E83",
                },
              },
              flex: 1,
            }}
          >
            <Tab label="📋 Daily Reports" />
            <Tab label="📊 Weekly Reports" />
          </Tabs>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => (reportTypeTab === 0 ? setCreateDailyModalOpen(true) : setCreateWeeklyModalOpen(true))}
            sx={{
              backgroundColor: "#4B2E83",
              fontWeight: 600,
              textTransform: "none",
              fontSize: 14,
              flexShrink: 0,
              "&:hover": {
                backgroundColor: "#3d2363",
              },
            }}
          >
            New {reportTypeTab === 0 ? "Daily" : "Weekly"} Report
          </Button>
        </Paper>

        {/* Main Split Layout */}
        <Box
          sx={{
            display: "flex",
            flex: 1,
            gap: 2,
            minHeight: 0,
          }}
        >
          {/* Left Sidebar - List View */}
          <Paper
            elevation={0}
            sx={{
              width: { xs: "100%", md: 380 },
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.06)",
              backgroundColor: "#fff",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {/* List Type Tabs */}
            <Tabs
              value={listTypeTab}
              onChange={(e, newValue) => setListTypeTab(newValue)}
              sx={{
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                px: 2,
                "& .MuiTabs-indicator": {
                  backgroundColor: "#4B2E83",
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 12,
                  color: "#666",
                  flex: 1,
                  "&.Mui-selected": {
                    color: "#4B2E83",
                  },
                },
              }}
            >
              <Tab 
                label={`📥 Received (${reportTypeTab === 0 ? dailyInboxReports.length : weeklyInboxReports.length})`} 
              />
              <Tab 
                label={`📤 Sent (${reportTypeTab === 0 ? dailySubmittedReports.length : weeklySubmittedReports.length})`} 
              />
            </Tabs>

            {/* Search Filter */}
            <Box sx={{ p: 2, borderBottom: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#999", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                    backgroundColor: "#f5f5f5",
                    fontSize: 13,
                    "& fieldset": {
                      borderColor: "transparent",
                    },
                    "&:hover fieldset": {
                      borderColor: "#ddd",
                    },
                  },
                }}
              />
            </Box>

            {/* Reports List */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                minWidth: 0,
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#d0d0d0",
                  borderRadius: "3px",
                },
              }}
            >
              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : filteredReports.length === 0 ? (
                <Box sx={{ p: 2, textAlign: "center", color: "#999", fontSize: 13 }}>
                  <Typography sx={{ mb: 1 }}>
                    {searchQuery ? "No reports match your search" : "No reports yet"}
                  </Typography>
                  {!searchQuery && (
                    <Typography sx={{ fontSize: 12 }}>
                      Click "New {reportTypeTab === 0 ? "Daily" : "Weekly"} Report" to get started
                    </Typography>
                  )}
                </Box>
              ) : (
                <>
                  {filteredReports.map((report: any) => (
                    <Box
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      sx={{
                        p: 2,
                        borderBottom: "1px solid rgba(0,0,0,0.04)",
                        cursor: "pointer",
                        backgroundColor: selectedReportId === report.id ? "#f0eef9" : "transparent",
                        borderLeft: selectedReportId === report.id ? "4px solid #4B2E83" : "4px solid transparent",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: "#fafafa",
                        },
                      }}
                    >
                      {/* User Header with Avatar */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                        {/* Avatar */}
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            backgroundColor: "#4B2E83",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {(listTypeTab === 1 && report.receivers?.length > 0
                            ? report.receivers[0]?.name
                            : report.user?.name
                          )
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || "U"}
                        </Box>

                        {/* User Info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#1a1a1a",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {listTypeTab === 1 && report.receivers?.length > 0
                              ? report.receivers[0]?.user?.name || "Unknown"
                              : report.user?.name || "Unknown"}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 10,
                              color: "#999",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {listTypeTab === 1 && report.receivers?.length > 0
                              ? report.receivers[0]?.user?.email || "No email"
                              : report.user?.email || "No email"}
                          </Typography>
                        </Box>

                        {/* Status Badge */}
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.4,
                            borderRadius: "4px",
                            backgroundColor: "#d4edda",
                            color: "#155724",
                            fontSize: "8px",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          ✓ Ready
                        </Box>
                      </Box>

                      {/* Content Preview */}
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "#555",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          mb: 1.5,
                          lineHeight: 1.4,
                        }}
                      >
                        {(report as any)?.remarks || "No details"}
                      </Typography>

                      {/* Footer Info */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: 10, color: "#aaa", fontWeight: 500 }}>
                          {formatDate(report.createdAt)}
                        </Typography>

                        {/* Recipients*/}
                        {report.receivers && report.receivers.length > 0 && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Typography sx={{ fontSize: 9, color: "#999", fontWeight: 500 }}>
                              📤 {report.receivers.length}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          </Paper>

          {/* Right Panel - Detail View */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.06)",
              backgroundColor: "#fff",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {selectedReport ? (
              <>
                {/* Detail Header */}
                <Box
                  sx={{
                    p: 3,
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#1a1a1a",
                        mb: 0.5,
                        wordBreak: "break-word",
                      }}
                    >
                      {reportTypeTab === 1 ? (selectedReport as any)?.title : `Daily Report`}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#999" }}>
                      {formatDate(selectedReport.createdAt)} at {formatTime(selectedReport.createdAt)}
                    </Typography>
                    {selectedReport.user && (
                      <Typography sx={{ fontSize: 12, color: "#666", mt: 0.5 }}>
                        By {selectedReport.user.name || "Unknown"}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" gap={1} flexShrink={0}>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ textTransform: "none", fontSize: 12 }}
                      onClick={() => (reportTypeTab === 0 ? setCreateDailyModalOpen(true) : setCreateWeeklyModalOpen(true))}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ textTransform: "none", fontSize: 12, backgroundColor: "#4B2E83" }}
                    >
                      Submit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                      sx={{ textTransform: "none", fontSize: 12, color: "#ef4444", borderColor: "#ef4444" }}
                      onClick={() => {
                        setReportToDelete(selectedReport);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Box>

                {/* Detail Content */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    p: 3,
                    minHeight: 0,
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#d0d0d0",
                      borderRadius: "3px",
                    },
                  }}
                >
                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", mb: 1 }}>
                      {reportTypeTab === 0 ? "Remarks" : "Description"}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: "#333", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {reportTypeTab === 0 
                        ? (selectedReport as any)?.remarks || "No remarks provided"
                        : (selectedReport as any)?.remarks || "No description provided"}
                    </Typography>
                  </Box>

                  {reportTypeTab === 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", mb: 1 }}>
                        Date
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: "#333" }}>
                        {formatDate((selectedReport as any)?.date) || "N/A"}
                      </Typography>
                    </Box>
                  )}

                  {reportTypeTab === 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", mb: 1 }}>
                        Location
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: "#333" }}>
                        {(selectedReport as any)?.location || "N/A"}
                      </Typography>
                    </Box>
                  )}

                  {reportTypeTab === 1 && (
                    <>
                      <Box sx={{ mb: 3 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", mb: 1 }}>
                          Period
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: "#333" }}>
                          {formatDate((selectedReport as any)?.dateFrom)} - {formatDate((selectedReport as any)?.dateTo)}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  color: "#999",
                  gap: 2,
                }}
              >
                <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
                  📋 Select a report to view details
                </Typography>
                <Typography sx={{ fontSize: 12 }}>
                  Choose from the list on the left or create a new one
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Report?</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Are you sure you want to delete "{reportToDelete?.title || "this report"}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDeleteReport}
              variant="contained"
              sx={{ backgroundColor: "#ef4444", "&:hover": { backgroundColor: "#dc2626" } }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modals */}
        <DailyReportModal
          open={createDailyModalOpen}
          onClose={() => setCreateDailyModalOpen(false)}
          report={null}
        />

        <WeeklyReportModal
          open={createWeeklyModalOpen}
          onClose={() => setCreateWeeklyModalOpen(false)}
          report={null}
        />
      </Box>
    </Layout>
  );
}
