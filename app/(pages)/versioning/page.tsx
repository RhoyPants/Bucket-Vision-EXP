"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import { format } from "date-fns";

import VersioningActionModal from "@/app/components/shared/modals/VersioningActionModal";
import { getProjectFull, getProjects } from "@/app/redux/controllers/projectController";
import {
  fetchVersionHistory,
  fetchVersionsByPin,
  selectVersionsForComparison,
} from "@/app/redux/controllers/versioningController";
import { AppDispatch, RootState } from "@/app/redux/store";
import Guard from "@/app/components/shared/Guard";
import CompareVersionsTab from "./components/CompareVersionsTab";
import VersionHistoryTab from "./components/VersionHistoryTab";

type VersionRecord = {
  id: string;
  name?: string;
  versionNumber: number;
  versionLabel?: string;
  status?: string;
  isActive?: boolean;
  isLatestVersion?: boolean;
  pin?: string;
  totalBudget?: number;
  expectedStartDate?: string;
  expectedEndDate?: string;
  startDate?: string;
};

type ProjectRecord = {
  id?: string;
  name?: string;
  pin?: string;
  startDate?: string;
  expectedEndDate?: string;
  totalBudget?: number;
};

const formatDate = (value?: string, fallback = "Not set") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return format(date, "MMM d, yyyy");
};

const formatBudget = (value?: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getVersionTitle = (version: VersionRecord) =>
  version.versionLabel || `Version ${version.versionNumber}`;

function SummaryCard({
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
    <Box
      sx={{
        minHeight: 80,
        p: 2,
        borderRadius: 2,
        border: "1px solid #E5E7EB",
        bgcolor: "#efeeff",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography sx={{ color: "#64748b", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
            {label}
          </Typography>
          <Typography sx={{ color: "#0f172a", fontSize: 16, fontWeight: 900, mt: 1, lineHeight: 1.15 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            color,
            bgcolor: "#F8FAFC",
            border: "1px solid #E5E7EB",
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Box>
  );
}

function VersioningPageContent() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = searchParams.get("projectId") || "";
  const pin = searchParams.get("pin") || "";

  const { allVersions, versionHistory, error } = useSelector(
    (state: RootState) => state.versioning,
  );
  const { projects, fullProject } = useSelector((state: RootState) => state.project);

  const [createVersionModalOpen, setCreateVersionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const project = fullProject as ProjectRecord | null;

  useEffect(() => {
    if (!projects || projects.length === 0) {
      dispatch(getProjects());
    }
  }, [dispatch, projects]);

  useEffect(() => {
    if (projectId && (!project || project.id !== projectId)) {
      dispatch(getProjectFull(projectId));
    }
  }, [projectId, dispatch, project]);

  useEffect(() => {
    if (pin) {
      dispatch(fetchVersionsByPin(pin));
      return;
    }

    if (projectId) {
      const listedProject = projects?.find((item) => item.id === projectId);
      if (listedProject?.pin) {
        dispatch(fetchVersionsByPin(listedProject.pin));
      } else {
        dispatch(fetchVersionHistory(projectId));
      }
    }
  }, [projectId, pin, projects, dispatch]);

  const versions = useMemo<VersionRecord[]>(() => {
    const source = allVersions.length > 0 ? allVersions : versionHistory;
    return [...source].sort((a, b) => Number(b.versionNumber || 0) - Number(a.versionNumber || 0));
  }, [allVersions, versionHistory]);

  const activeVersion =
    versions.find((version) => version.status === "ACTIVE" || version.isActive || version.isLatestVersion) ||
    versions[0] ||
    null;

  const selectedProjectPin = project?.pin || activeVersion?.pin || pin || "N/A";
  const startDate = project?.startDate || activeVersion?.expectedStartDate || activeVersion?.startDate;
  const endDate = project?.expectedEndDate || activeVersion?.expectedEndDate;
  const budget = project?.totalBudget || activeVersion?.totalBudget;

  const handleClose = () => {
    if (projectId) {
      router.push("/projects");
      return;
    }
    router.back();
  };

  const handleSelectVersionsForComparison = (v1: VersionRecord, v2: VersionRecord) => {
    dispatch(selectVersionsForComparison(v1, v2));
    setActiveTab(1);
  };

  if (!projectId && !pin) {
    return (
      <Box sx={{ minHeight: "100vh", p: 4, bgcolor: "#F8FAFC" }}>
        <Alert severity="error">No project selected. Please select a project first.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", bgcolor: "#F8FAFC" }}>
      <Box sx={{ width: "100%", px: { xs: 2, md: 4, xl: 5 }, py: { xs: 2, md: 3 } }}>
        <Box
          component="header"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 2,
            p: { xs: 2, md: 2.5 },
            border: "1px solid #E5E7EB",
            borderRadius: 2,
            bgcolor: "#02005f",
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            mb: 3,
          }}
        >
          <Box>
            <Typography sx={{ color: "#e5e6f8", fontSize: { xs: 16, md: 20 }, fontWeight: 950, lineHeight: 1.08 }}>
              {project?.name || activeVersion?.name || "Project"}
            </Typography>
            <Typography sx={{ color: "#b6bdc7", mt: 1, fontWeight: 700 }}>
              Version Management & Revision Tracking
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Guard permissionKey="versioning" action="create">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateVersionModalOpen(true)}
                sx={{
                  height: 35,
                  px: 2.5,
                  borderRadius: 2.25,
                  textTransform: "none",
                  fontWeight: 900,
                  bgcolor: "#b1aaff",
                  color: "#15123d",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#9c97df", boxShadow: "none" },
                }}
              >
                Create New Version
              </Button>
            </Guard>
            <Button
              variant="text"
              startIcon={<CloseIcon />}
              onClick={handleClose}
              sx={{ color: "#efeeff", textTransform: "none", fontWeight: 900 }}
            >
              Close
            </Button>
          </Stack>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(5, 1fr)" }, gap: 2, mb: 3 }}>
          <SummaryCard icon={<AccountTreeOutlinedIcon />} label="Project PIN" value={selectedProjectPin} color="#7c3aed" />
          <SummaryCard icon={<CalendarMonthOutlinedIcon />} label="Start Date" value={formatDate(startDate)} color="#0ea5e9" />
          <SummaryCard icon={<TimelineOutlinedIcon />} label="Expected End Date" value={formatDate(endDate)} color="#f59e0b" />
          <SummaryCard icon={<MonetizationOnOutlinedIcon />} label="Total Budget" value={formatBudget(budget)} color="#10b981" />
          <SummaryCard icon={<FactCheckOutlinedIcon />} label="Total Versions" value={`${versions.length} Versions`} color="#6366f1" />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box
          sx={{
            borderRadius: 2,
            border: "1px solid #E5E7EB",
            bgcolor: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              pt: 1,
              borderBottom: "1px solid #E5E7EB",
              bgcolor: "#FFFFFF",
              boxShadow: "inset 0 3px 0 #2563EB",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              sx={{
                minHeight: 52,
                "& .MuiTabs-indicator": {
                  height: 3,
                  borderRadius: 999,
                  bgcolor: "#2563EB",
                },
                "& .MuiTab-root": {
                  minHeight: 52,
                  textTransform: "none",
                  fontWeight: 800,
                  color: "#64748B",
                  "&.Mui-selected": { color: "#1D4ED8" },
                },
              }}
            >
              <Tab icon={<TimelineOutlinedIcon />} iconPosition="start" label="Version Timeline" />
              <Tab icon={<CompareArrowsIcon />} iconPosition="start" label="Compare Versions" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <VersionHistoryTab
                projectId={projectId}
                pin={pin}
                onSelectForComparison={handleSelectVersionsForComparison}
              />
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#F8FAFC" }}>
              <Box
                sx={{
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 2,
                  p: { xs: 2, md: 3 },
                  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                }}
              >
                <CompareVersionsTab projectId={projectId} pin={pin} />
              </Box>
            </Box>
          )}
        </Box>

        <VersioningActionModal
          open={createVersionModalOpen}
          onClose={() => setCreateVersionModalOpen(false)}
          projectId={projectId}
          projectName={project?.name}
          activeVersion={{
            versionLabel: activeVersion ? getVersionTitle(activeVersion) : "v1",
            expectedEndDate: endDate,
            totalBudget: budget,
          }}
        />
      </Box>
    </Box>
  );
}

export default function VersioningPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "grid", placeItems: "center", minHeight: "100vh", bgcolor: "#F8FAFC" }}>
          <CircularProgress />
        </Box>
      }
    >
      <VersioningPageContent />
    </Suspense>
  );
}
