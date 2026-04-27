"use client";

import React, { useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getWeeklyReportsSummary } from "@/app/redux/controllers/weeklyReportController";
import { getDailyReports } from "@/app/redux/controllers/dailyReportController";
import { getWeeklyReports } from "@/app/redux/controllers/weeklyReportController";
import Layout from "@/app/components/shared/Layout";
import SummaryCards from "./components/SummaryCards";
import WeeklyAccomplishmentsList from "./components/WeeklyAccomplishmentsList";
import RecentDailyReportsFeed from "./components/RecentDailyReportsFeed";
import DailyInboxList from "./components/DailyInboxList";
import DailySubmittedList from "./components/DailySubmittedList";
import WeeklyInboxList from "./components/WeeklyInboxList";
import WeeklySubmittedList from "./components/WeeklySubmittedList";
import AddIcon from "@mui/icons-material/Add";
import DailyReportModal from "./daily/components/DailyReportModal";
import WeeklyReportModal from "./weekly/components/WeeklyReportModal";

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const [tabValue, setTabValue] = React.useState(0);
  const [createDailyModalOpen, setCreateDailyModalOpen] = React.useState(false);
  const [createWeeklyModalOpen, setCreateWeeklyModalOpen] = React.useState(false);

  const weeklyLoading = useAppSelector(
    (state) => state.weeklyReport.loading
  );
  const dailyLoading = useAppSelector((state) => state.dailyReport.loading);
  const summary = useAppSelector((state) => state.weeklyReport.summary);

  useEffect(() => {
    // Load summary and reports on mount
    dispatch(getWeeklyReportsSummary() as any);
    dispatch(getDailyReports() as any);
    dispatch(getWeeklyReports() as any);
  }, [dispatch]);

  const isLoading = weeklyLoading || dailyLoading;

  return (
    <Layout>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: "#1a1a1a",
                mb: 0.5,
              }}
            >
              Reports
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Daily & Weekly accomplishments overview
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCreateDailyModalOpen(true)}
              sx={{
                borderColor: "#4B2E83",
                color: "#4B2E83",
                fontWeight: 600,
                textTransform: "none",
                fontSize: 14,
                "&:hover": {
                  borderColor: "#4B2E83",
                  backgroundColor: "rgba(75,46,131,0.04)",
                },
              }}
            >
              New Daily Report
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateWeeklyModalOpen(true)}
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
              New Weekly Report
            </Button>
          </Box>
        </Box>

        {isLoading && !summary ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 400,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <SummaryCards summary={summary} />

            {/* Tabs for different views */}
            <Paper
              elevation={0}
              sx={{
                mt: 4,
                borderRadius: 3,
                border: "1px solid rgba(0,0,0,0.06)",
                backgroundColor: "#fff",
                boxShadow: "0 6px 18px rgba(15,15,15,0.03)",
              }}
            >
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  px: 3,
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
                    minHeight: 64,
                  },
                }}
              >
                <Tab label="Daily Inbox" />
                <Tab label="Daily Submitted" />
                <Tab label="Weekly Inbox" />
                <Tab label="Weekly Submitted" />
              </Tabs>

              {/* Tab content */}
              <Box sx={{ p: 3 }}>
                {tabValue === 0 && <DailyInboxList />}
                {tabValue === 1 && <DailySubmittedList />}
                {tabValue === 2 && <WeeklyInboxList />}
                {tabValue === 3 && <WeeklySubmittedList />}
              </Box>
            </Paper>

            {/* Create Daily Report Modal */}
            <DailyReportModal
              open={createDailyModalOpen}
              onClose={() => setCreateDailyModalOpen(false)}
              report={null}
            />

            {/* Create Weekly Report Modal */}
            <WeeklyReportModal
              open={createWeeklyModalOpen}
              onClose={() => setCreateWeeklyModalOpen(false)}
              report={null}
            />
          </>
        )}
      </Box>
    </Layout>
  );
}
