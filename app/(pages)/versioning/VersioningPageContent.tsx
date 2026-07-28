"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CloseIcon from "@mui/icons-material/Close";
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

export function VersioningPageContent({
  projectId: projectIdProp,
  embedded = false,
}: {
  projectId?: string;
  embedded?: boolean;
} = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = projectIdProp || searchParams.get("projectId") || "";
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
    <Box
      sx={{
        minHeight: embedded ? "100%" : "100vh",
        width: "100%",
        bgcolor: "#F8FAFC",
        "& .MuiButton-containedPrimary": {
          bgcolor: "#210E64",
          "&:hover": { bgcolor: "#180A4D" },
        },
        "& .MuiButton-outlinedPrimary": {
          color: "#210E64",
          borderColor: "#210E64",
          "&:hover": { borderColor: "#180A4D", bgcolor: "rgba(33,14,100,0.05)" },
        },
        "& .MuiButton-textPrimary": {
          color: "#210E64",
          "&:hover": { bgcolor: "rgba(33,14,100,0.05)" },
        },
      }}
    >
      <Box sx={{ width: "100%", px: { xs: 1.5, md: embedded ? 2 : 4, xl: embedded ? 2.5 : 5 }, py: { xs: 1.5, md: embedded ? 2 : 3 } }}>
        {embedded ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
              px: { xs: 1.5, md: 2 },
              py: 1.5,
              mb: 2,
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 2,
            }}
          >
            <Box>
              <Typography sx={{ color: "#0F172A", fontSize: { xs: 16, md: 18 }, fontWeight: 900, lineHeight: 1.2 }}>
                Project Versioning
              </Typography>
              <Typography sx={{ color: "#64748B", fontSize: 11.5, fontWeight: 600, mt: 0.45 }}>
                Preserve approved project changes, review previous versions, and compare what changed.
              </Typography>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.8 }}>
                <Box sx={{ px: 1, py: 0.3, borderRadius: 999, bgcolor: "rgba(33,14,100,0.08)", color: "#210E64", fontSize: 9.5, fontWeight: 850 }}>
                  {versions.length} {versions.length === 1 ? "version" : "versions"}
                </Box>
                {activeVersion && (
                  <Typography sx={{ color: "#047857", fontSize: 10, fontWeight: 800 }}>
                    Current: {getVersionTitle(activeVersion)}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Guard permissionKey="versioning" action="create">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateVersionModalOpen(true)}
                sx={{
                  height: 36,
                  px: 2.25,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "#210E64",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#180A4D", boxShadow: "none" },
                }}
              >
                Create New Version
              </Button>
            </Guard>
          </Box>
        ) : (
          <>
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
                  bgcolor: "#210E64",
                  color: "#FFFFFF",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#180A4D", boxShadow: "none" },
                }}
              >
                Create New Version
              </Button>
            </Guard>
            {!embedded && (
              <Button
                variant="text"
                startIcon={<CloseIcon />}
                onClick={handleClose}
                sx={{ color: "#efeeff", textTransform: "none", fontWeight: 900 }}
              >
                Close
              </Button>
            )}
          </Stack>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(5, 1fr)" }, gap: 2, mb: 3 }}>
          <SummaryCard icon={<AccountTreeOutlinedIcon />} label="Project PIN" value={selectedProjectPin} color="#7c3aed" />
          <SummaryCard icon={<CalendarMonthOutlinedIcon />} label="Start Date" value={formatDate(startDate)} color="#0ea5e9" />
          <SummaryCard icon={<TimelineOutlinedIcon />} label="Expected End Date" value={formatDate(endDate)} color="#f59e0b" />
          <SummaryCard icon={<MonetizationOnOutlinedIcon />} label="Total Budget" value={formatBudget(budget)} color="#10b981" />
          <SummaryCard icon={<FactCheckOutlinedIcon />} label="Total Versions" value={`${versions.length} Versions`} color="#6366f1" />
        </Box>
          </>
        )}

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
              boxShadow: "inset 0 3px 0 #210E64",
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
                  bgcolor: "#210E64",
                },
                "& .MuiTab-root": {
                  minHeight: 52,
                  textTransform: "none",
                  fontWeight: 800,
                  color: "#64748B",
                  "&.Mui-selected": {
                    color: "#210E64",
                    bgcolor: "rgba(33,14,100,0.06)",
                  },
                },
              }}
            >
              <Tab label="Version History" />
              <Tab label="Compare Versions" />
            </Tabs>
            <Typography sx={{ pb: 1.2, color: "#64748B", fontSize: 10.5 }}>
              {activeTab === 0
                ? "Review every saved version. Open one for details or compare it with an earlier version."
                : "Choose a base version and a newer version to see budget, schedule, progress, and structure changes."}
            </Typography>
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
