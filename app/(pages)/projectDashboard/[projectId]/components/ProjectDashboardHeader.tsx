"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import axiosApi from "@/app/lib/axios";
import SubtaskHealthKpi from "./SubtaskHealthKpi";

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
  const [dashboard, setDashboard] = useState<DashboardHeaderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    axiosApi
      .get(`/project-dashboards/${projectId}`)
      .then((response) => {
        if (active) setDashboard(response.data?.data ?? response.data);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          typeof requestError === "object" && requestError !== null && "message" in requestError
            ? String(requestError.message)
            : "Unable to load project dashboard",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [projectId]);

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
      <Box sx={{ flexShrink: 0 }}>
        {loading ? (
          <Stack direction="row" spacing={1.25} alignItems="center">
            <CircularProgress size={18} />
            <Typography color="text.secondary">Loading project dashboard...</Typography>
          </Stack>
        ) : error ? (
          <Typography color="error" fontWeight={600}>{error}</Typography>
        ) : (
          <Typography component="h1" noWrap sx={{ fontSize: { xs: 18, md: 22 }, fontWeight: 800, color: "#0F172A", lineHeight: 1.15 }}>
            {dashboard?.project?.name || "Untitled Project"}
            <Box component="span" sx={{ mx: 1, color: "#CBD5E1" }}>|</Box>
            <Box component="span" sx={{ color: "#64748B", fontWeight: 500 }}>{getVersionLabel(dashboard?.project)}</Box>
          </Typography>
        )}
      </Box>
      <Box sx={{ overflowX: "auto", overflowY: "hidden", pb: 0.25 }}>
        <SubtaskHealthKpi projectId={projectId} summaryOnly bareSummary />
      </Box>
    </Box>
  );
}
