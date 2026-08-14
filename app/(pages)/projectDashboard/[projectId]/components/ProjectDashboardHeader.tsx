"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress, FormControl, MenuItem, Select, Stack, Typography } from "@mui/material";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import SubtaskHealthKpi from "./SubtaskHealthKpi";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { fetchPersonalDashboardDetail } from "@/app/redux/controllers/personalDashboardController";
import { getActiveProjectDropdown } from "@/app/api-service/projectService";

type DashboardHeaderData = {
  project?: {
    id: string;
    name?: string;
    version?: string | number;
    versionNumber?: string | number;
    versionLabel?: string;
    currentVersion?: {
      version?: string | number;
      versionNumber?: string | number;
      versionLabel?: string;
    } | null;
  };
};

const getVersionLabel = (project?: DashboardHeaderData["project"]) => {
  const version =
    project?.versionLabel ??
    project?.versionNumber ??
    project?.version ??
    project?.currentVersion?.versionLabel ??
    project?.currentVersion?.versionNumber ??
    project?.currentVersion?.version;
  if (version === undefined || version === null || version === "") return "Version not set";
  const label = String(version).trim();
  return /^v/i.test(label) || /version/i.test(label) ? label : `Version ${label}`;
};

export default function ProjectDashboardHeader({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedDashboard, detailLoading: loading, error } = useAppSelector((state) => state.personalDashboard);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const dashboard = selectedDashboard?.id === projectId
    ? selectedDashboard as DashboardHeaderData
    : null;

  const switchableProjects = useMemo(() => {
    return (projects || [])
      .sort((a: any, b: any) => String(a?.name || "").localeCompare(String(b?.name || "")));
  }, [projects]);

  useEffect(() => {
    dispatch(fetchPersonalDashboardDetail(projectId)).catch(() => undefined);
  }, [dispatch, projectId]);

  useEffect(() => {
    getActiveProjectDropdown()
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, [dispatch]);

  const handleSwitchProject = (nextProjectId: string) => {
    if (!nextProjectId || nextProjectId === projectId) return;
    const query = searchParams.toString();
    router.push(`/projectDashboard/${nextProjectId}${query ? `?${query}` : ""}`);
  };

  return (
    <Box
      component="header"
      sx={{
        height: { xs: 125, md: "max(10vh, 125px)" },
        position: "fixed",
        inset: 0,
        right: { xs: 0, md: "280px" },
        bottom: "auto",
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "stretch",
        gap: 1,
        px: { xs: 1.5, md: 3 },
        py: 1,
        bgcolor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ minWidth: 0, flexShrink: 0 }}>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {loading ? (
          <Stack direction="row" spacing={1.25} alignItems="center">
            <CircularProgress size={18} />
            <Typography color="text.secondary">Loading project dashboard...</Typography>
          </Stack>
        ) : error ? (
          <Typography color="error" fontWeight={600}>{error}</Typography>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography component="h1" noWrap sx={{ minWidth: 0, fontSize: { xs: 18, md: 22 }, fontWeight: 800, color: "#0F172A", lineHeight: 1.15 }}>
              {dashboard?.project?.name || "Untitled Project"}
            </Typography>
            <Box
              component="span"
              sx={{
                flexShrink: 0,
                px: 1,
                py: 0.45,
                borderRadius: "999px",
                bgcolor: "#F1F0FF",
                color: "#5045B8",
                border: "1px solid #DDD8FF",
                fontSize: { xs: 10.5, md: 12 },
                lineHeight: 1,
                fontWeight: 800,
              }}
            >
              {getVersionLabel(dashboard?.project)}
            </Box>
          </Stack>
        )}
      </Box>
        <FormControl size="small" sx={{ width: { xs: 132, sm: 158 }, flexShrink: 0 }}>
          <Select
            value=""
            onChange={(event) => handleSwitchProject(String(event.target.value))}
            displayEmpty
            aria-label="Switch project"
            renderValue={() => (
              <Stack direction="row" spacing={0.65} alignItems="center">
                <SwapHorizRoundedIcon sx={{ fontSize: 17, color: "#5045B8" }} />
                <Typography noWrap sx={{ fontSize: 12, color: "#5045B8", fontWeight: 800 }}>
                  Switch project
                </Typography>
              </Stack>
            )}
            sx={{
              height: 36,
              bgcolor: "#FFFFFF",
              borderRadius: 1.5,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E0DAE6" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#686AF3" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#210E64" },
              "& .MuiSelect-select": { py: 0.75, pl: 1.1, pr: "28px !important" },
            }}
          >
            <MenuItem value="" disabled sx={{ display: "none" }}>Switch project</MenuItem>
            {switchableProjects.map((project: any) => (
              <MenuItem key={project.id} value={project.id} disabled={String(project.id) === projectId} sx={{ py: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 13, fontWeight: String(project.id) === projectId ? 800 : 600 }}>
                    {project.name || "Untitled Project"}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>
                    {String(project.id) === projectId ? "Current project" : "Active"}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Box sx={{ overflowX: "auto", overflowY: "hidden", pb: 0.25 }}>
        <SubtaskHealthKpi projectId={projectId} summaryOnly bareSummary />
      </Box>
    </Box>
  );
}
