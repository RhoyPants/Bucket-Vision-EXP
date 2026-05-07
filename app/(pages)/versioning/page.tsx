"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/redux/store";
import {
  fetchVersionsByPin,
  fetchVersionHistory,
  selectVersionsForComparison,
} from "@/app/redux/controllers/versioningController";
import { getProjects } from "@/app/redux/controllers/projectController";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Layout from "@/app/components/shared/Layout";
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// ─── Inner component that uses useSearchParams() ──────────────────────────────
function VersioningPageContent() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get("projectId");
  const urlPin = searchParams.get("pin");

  const { allVersions, versionHistory, loading, error } = useSelector(
    (state: RootState) => state.versioning
  );

  const { projects } = useSelector(
    (state: RootState) => state.project
  );

  const [tabValue, setTabValue] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    urlProjectId || ""
  );

  // Load projects if not already loaded
  useEffect(() => {
    if (!projects || projects.length === 0) {
      dispatch(getProjects() as any);
    }
  }, [dispatch, projects]);

  // Load versions when projectId is selected — use PIN to get ALL versions in the group
  useEffect(() => {
    if (urlPin) {
      dispatch(fetchVersionsByPin(urlPin));
    } else if (selectedProjectId) {
      // Look up the selected project's PIN and use it to fetch all sibling versions
      const project = projects?.find((p: any) => p.id === selectedProjectId);
      if (project?.pin) {
        dispatch(fetchVersionsByPin(project.pin));
      } else {
        // Fallback: history API (won't include version 1 if this is not v1)
        dispatch(fetchVersionHistory(selectedProjectId));
      }
    }
  }, [selectedProjectId, urlPin, projects, dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSelectVersionsForComparison = (v1: any, v2: any) => {
    dispatch(selectVersionsForComparison(v1, v2));
    setTabValue(1); // Switch to compare tab
  };

  const selectedProject = projects?.find((p: any) => p.id === selectedProjectId);

  // Show projects grid when no project is selected
  if (!selectedProjectId && !urlPin) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", mb: 1 }}>
              📋 Project Versioning
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Select a project to view and manage its versions
            </Typography>
          </Box>

          {!projects || projects.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2, color: "textSecondary" }}>
                Loading projects...
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {projects.filter((p: any) => p.status === "ACTIVE").map((project: any) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                        {project.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {project.description || "No description"}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Typography variant="caption" sx={{ bgcolor: "#f3f4f6", px: 1, py: 0.5, borderRadius: 1 }}>
                          PIN: {project.pin?.substring(0, 8) || "N/A"}
                        </Typography>
                        <Typography variant="caption" sx={{ bgcolor: "#f3f4f6", px: 1, py: 0.5, borderRadius: 1 }}>
                          {project.status || "ACTIVE"}
                        </Typography>
                      </Stack>
                    </CardContent>
                    <CardActions>
                      <Button size="small" color="primary">
                        View Versions →
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Layout>
      );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header with back button */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              setSelectedProjectId("");
              setTabValue(0);
            }}
            sx={{ mb: 2 }}
          >
            ← Back to Projects
          </Button>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", mb: 1 }}>
              📋 {selectedProject?.name || "Project"} Versions
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Track and manage all versions of this project • PIN: {selectedProject?.pin?.substring(0, 12) || urlPin}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: "100%", boxShadow: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="versioning tabs"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="📊 Version History" id="versioning-tab-0" aria-controls="versioning-tabpanel-0" />
            <Tab label="🔄 Compare Versions" id="versioning-tab-1" aria-controls="versioning-tabpanel-1" />
          </Tabs>

          {loading && !allVersions.length && !versionHistory.length ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <CustomTabPanel value={tabValue} index={0}>
                <VersionHistoryTab 
                  projectId={selectedProjectId}
                  pin={urlPin || ""}
                  onSelectForComparison={handleSelectVersionsForComparison}
                />
              </CustomTabPanel>


              <CustomTabPanel value={tabValue} index={1}>
                <CompareVersionsTab 
                  projectId={selectedProjectId}
                  pin={urlPin || ""}
                />
              </CustomTabPanel>
            </>
          )}
        </Paper>
      </Container>
    </Layout>
  );
}

// ─── Main page export wrapped in Suspense ────────────────────────────────────
export default function VersioningPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <CircularProgress />
          </Box>
        </Layout>
      }
    >
      <VersioningPageContent />
    </Suspense>
  );
}
