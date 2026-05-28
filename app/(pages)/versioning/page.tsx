"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/redux/store";
import {
  fetchVersionsByPin,
  fetchVersionHistory,
  selectVersionsForComparison,
} from "@/app/redux/controllers/versioningController";
import {
  getProjects,
  getProjectFull,
} from "@/app/redux/controllers/projectController";
import { useSearchParams, useRouter } from "next/navigation";

import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Button,
  Chip,
  Card,
  Divider,
  Avatar,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import LayersIcon from "@mui/icons-material/Layers";
import AddIcon from "@mui/icons-material/Add";

import Layout from "@/app/components/shared/Layout";
import VersioningActionModal from "@/app/components/shared/modals/VersioningActionModal";
import VersionHistoryTab from "./components/VersionHistoryTab";
import CompareVersionsTab from "./components/CompareVersionsTab";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`versioning-tabpanel-${index}`}
      aria-labelledby={`versioning-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            p: { xs: 2, md: 3 },
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid #eef2ff",
        boxShadow: "0 2px 12px rgba(15,23,42,0.04)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease",

        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
        },

        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 4,
          background: color,
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          sx={{
            bgcolor: color,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>

        <Box>
          <Typography
            sx={{
              fontSize: 11,
              textTransform: "uppercase",
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Typography>

          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 800,
              color: "#0f172a",
              mt: 0.5,
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function VersioningPageContent() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlProjectId = searchParams.get("projectId");
  const urlPin = searchParams.get("pin");

  const { allVersions, versionHistory, loading, error } = useSelector(
    (state: RootState) => state.versioning,
  );

  const { projects, fullProject } = useSelector(
    (state: RootState) => state.project,
  );

  const [tabValue, setTabValue] = useState(0);
  const [createVersionModalOpen, setCreateVersionModalOpen] =
    useState(false);

  const projectId = urlProjectId || "";
  const pin = urlPin || "";

  useEffect(() => {
    if (!projects || projects.length === 0) {
      dispatch(getProjects() as any);
    }
  }, [dispatch, projects]);

  useEffect(() => {
    if (projectId && (!fullProject || fullProject.id !== projectId)) {
      dispatch(getProjectFull(projectId) as any);
    }
  }, [projectId, dispatch, fullProject]);

  useEffect(() => {
    if (pin) {
      dispatch(fetchVersionsByPin(pin));
    } else if (projectId) {
      const project = projects?.find((p: any) => p.id === projectId);

      if (project?.pin) {
        dispatch(fetchVersionsByPin(project.pin));
      } else {
        dispatch(fetchVersionHistory(projectId));
      }
    }
  }, [projectId, pin, projects, dispatch]);

  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setTabValue(newValue);
  };

  const handleSelectVersionsForComparison = (
    v1: any,
    v2: any,
  ) => {
    dispatch(selectVersionsForComparison(v1, v2));
    setTabValue(1);
  };

  if (!projectId && !pin) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          No project selected. Please select a project first.
        </Alert>
      </Container>
    );
  }

  return (
    <Layout>
      <Box
        sx={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          py: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="xl">
          {/* HEADER */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 4 },
              borderRadius: 4,
              border: "1px solid #e2e8f0",
              background:
                "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              boxShadow: "0 10px 40px rgba(15,23,42,0.05)",
              mb: 4,
            }}
          >
            {/* TOP BAR */}
            <Stack
              direction={{ xs: "column", lg: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", lg: "center" }}
              spacing={3}
            >
              <Stack spacing={2}>
            

                <Stack spacing={1}>
                  <Typography
                    sx={{
                      fontSize: { xs: 28, md: 36 },
                      fontWeight: 900,
                      lineHeight: 1.1,
                      color: "#0f172a",
                    }}
                  >
                    {fullProject?.name || "Project"}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#64748b",
                      fontSize: 15,
                      fontWeight: 500,
                    }}
                  >
                    Version Management & Revision Tracking
                  </Typography>
                </Stack>
              </Stack>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateVersionModalOpen(true)}
                sx={{
                  height: 52,
                  px: 3,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: 14,

                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",

                  boxShadow:
                    "0 10px 25px rgba(139,92,246,0.35)",

                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
                  },
                }}
              >
                Create New Version
              </Button>
            </Stack>

            <Divider sx={{ my: 4 }} />

            {/* KPI CARDS */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                  lg: "repeat(4, 1fr)",
                },
                gap: 2.5,
              }}
            >
              <StatCard
                icon={<AccountTreeIcon />}
                label="Project PIN"
                value={fullProject?.pin || pin || "N/A"}
                color="#8b5cf6"
              />

              <StatCard
                icon={<CalendarMonthIcon />}
                label="Start Date"
                value={
                  fullProject?.startDate
                    ? new Date(
                        fullProject.startDate,
                      ).toLocaleDateString()
                    : "N/A"
                }
                color="#0ea5e9"
              />

              <StatCard
                icon={<CalendarMonthIcon />}
                label="Expected End Date"
                value={
                  fullProject?.expectedEndDate
                    ? new Date(
                        fullProject.expectedEndDate,
                      ).toLocaleDateString()
                    : "N/A"
                }
                color="#f59e0b"
              />

              <StatCard
                icon={<MonetizationOnIcon />}
                label="Total Budget"
                value={`₱${(
                  fullProject?.totalBudget || 0
                ).toLocaleString()}`}
                color="#10b981"
              />
            </Box>
          </Paper>

          {/* ERROR */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* MAIN CONTENT */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              background: "#fff",
              boxShadow: "0 10px 40px rgba(15,23,42,0.05)",
            }}
          >
            {/* TABS */}
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                px: 2,
                pt: 1,

                "& .MuiTabs-indicator": {
                  height: 4,
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)",
                },

                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  minHeight: 70,
                  color: "#64748b",

                  "&.Mui-selected": {
                    color: "#7c3aed",
                  },
                },
              }}
            >
              <Tab
                icon={<LayersIcon />}
                iconPosition="start"
                label="Version History"
              />

              <Tab
                icon={<AccountTreeIcon />}
                iconPosition="start"
                label="Compare Versions"
              />
            </Tabs>

            <Divider />

            {/* CONTENT */}
            {loading &&
            !allVersions.length &&
            !versionHistory.length ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 300,
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <>
                <CustomTabPanel value={tabValue} index={0}>
                  <VersionHistoryTab
                    projectId={projectId}
                    pin={pin}
                    onSelectForComparison={
                      handleSelectVersionsForComparison
                    }
                  />
                </CustomTabPanel>

                <CustomTabPanel value={tabValue} index={1}>
                  <CompareVersionsTab
                    projectId={projectId}
                    pin={pin}
                  />
                </CustomTabPanel>
              </>
            )}
          </Paper>

          {/* MODAL */}
          <VersioningActionModal
            open={createVersionModalOpen}
            onClose={() => setCreateVersionModalOpen(false)}
            projectId={projectId}
            projectName={fullProject?.name}
            activeVersion={{
              versionLabel: "v1",
              expectedEndDate:
                fullProject?.expectedEndDate,
              totalBudget: fullProject?.totalBudget,
            }}
          />
        </Container>
      </Box>
    </Layout>
  );
}

export default function VersioningPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <VersioningPageContent />
    </Suspense>
  );
}