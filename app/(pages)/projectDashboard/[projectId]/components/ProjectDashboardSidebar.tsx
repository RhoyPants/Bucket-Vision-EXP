"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Divider, Drawer, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DirectionsRunOutlinedIcon from "@mui/icons-material/DirectionsRunOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import SchemaOutlinedIcon from "@mui/icons-material/SchemaOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import axiosApi from "@/app/lib/axios";
import { useAppSelector } from "@/app/redux/hook";

const sidebarWidth = 280;

const normalizeProgress = (value?: number) => {
  const progress = Number(value ?? 0);
  return Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;
};

export default function ProjectDashboardSidebar({ projectId }: { projectId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("UNKNOWN");
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    axiosApi.get(`/project-dashboards/${projectId}`).then((response) => {
      if (!active) return;
      const project = (response.data?.data ?? response.data)?.project;
      setProgress(normalizeProgress(project?.progress));
      setStatus(project?.status || "UNKNOWN");
      setOwnerId(project?.ownerId ? String(project.ownerId) : null);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [projectId]);

  const items = [
    { label: "Project Dashboard", href: `/projectDashboard/${projectId}`, icon: <DashboardOutlinedIcon /> },
    { label: "Sprint Management", href: `/projectDashboard/${projectId}?view=sprint-management`, icon: <DirectionsRunOutlinedIcon /> },
    { label: "Project Team Organization", href: `/projectDashboard/${projectId}?view=team-organization`, icon: <AccountTreeOutlinedIcon /> },
    { label: "Project Structure", href: `/projectDashboard/${projectId}?view=project-structure`, icon: <SchemaOutlinedIcon /> },
    { label: "Project Versioning", href: `/projectDashboard/${projectId}?view=project-versioning`, icon: <HistoryOutlinedIcon /> },
    { label: "Project Reports", href: `/projectDashboard/${projectId}?view=project-reports`, icon: <AssessmentOutlinedIcon /> },
    { label: "Project Team Overview", href: `/projectDashboard/${projectId}?view=team-overview`, icon: <GroupsOutlinedIcon /> },
    { label: "Project Info and Config", href: `/projectDashboard/${projectId}?view=project-info`, icon: <InfoOutlinedIcon /> },
    { label: "Incident Report", href: `/projectDashboard/${projectId}?view=incident-reports`, icon: <ReportProblemOutlinedIcon /> },
  ];

  const navigate = (href: string) => {
    setMobileOpen(false);
    router.push(href);
  };
  const canSetupProject = String(status).trim().toUpperCase() === "DRAFT"
    && Boolean(ownerId)
    && String(currentUser?.id || "") === ownerId;

  const content = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#FFFFFF" }}>
      <Box
        sx={{
          height: { xs: 150, md: "max(10vh, 125px)" },
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box component="svg" viewBox="0 0 160 134" role="img" aria-label={`${progress.toFixed(0)}% project progress`} sx={{ width: 150, height: 100 }}>
          <circle cx="80" cy="67" r="52" fill="none" stroke="#E5E7EB" strokeWidth="16" strokeDasharray="245 81.7" transform="rotate(135 80 67)" />
          <circle cx="80" cy="67" r="52" fill="none" stroke="#0B74D1" strokeWidth="16" strokeDasharray={`${(245 * progress) / 100} 326.7`} transform="rotate(135 80 67)" />
          <text x="80" y="76" textAnchor="middle" fill="#334155" fontSize="29" fontWeight="500" fontFamily="var(--font-ftsterling), sans-serif">{progress.toFixed(0)}%</text>
        </Box>
        <Typography sx={{ mt: -0.5, fontSize: 12.5, color: "#475569", fontWeight: 700 }}>
          Status: <Box component="span" sx={{ color: "#16A34A", fontWeight: 900 }}>{status}</Box>
        </Typography>
      </Box>

      <Divider />
      <Stack component="nav" aria-label="Project dashboard navigation" spacing={0.25} sx={{ p: 1.25, overflowY: "auto" }}>
        {items.map((item) => {
          const itemView = new URLSearchParams(item.href.split("?")[1] || "").get("view");
          const active = pathname === item.href.split("?")[0] && searchParams.get("view") === itemView;
          return (
            <Button key={item.label} fullWidth startIcon={item.icon} onClick={() => navigate(item.href)} sx={{ minHeight: 40, px: 1.25, justifyContent: "flex-start", textAlign: "left", textTransform: "none", borderRadius: 1.5, fontSize: 12.5, fontWeight: active ? 800 : 600, color: active ? "#1D4ED8" : "#475569", bgcolor: active ? "#EFF6FF" : "transparent", "& .MuiButton-startIcon": { color: active ? "#2563EB" : "#64748B" }, "&:hover": { bgcolor: active ? "#DBEAFE" : "#F1F5F9" } }}>
              {item.label}
            </Button>
          );
        })}
      </Stack>

      <Box sx={{ mt: "auto", p: 1.5 }}>
        <Divider sx={{ mb: 1.5 }} />
        {canSetupProject && (
          <Button fullWidth variant="contained" startIcon={<SettingsOutlinedIcon />} onClick={() => navigate(`/projects/${projectId}/setup`)} sx={{ minHeight: 42, mb: 1, textTransform: "none", borderRadius: 1.5, bgcolor: "#210E64", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#1B169D", boxShadow: "none" } }}>
            Setup Project
          </Button>
        )}
        <Button fullWidth variant="outlined" startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate("/projects")} sx={{ minHeight: 42, textTransform: "none", borderRadius: 1.5, fontWeight: 800 }}>
          Back to Project List
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <Box sx={{ display: { xs: "none", md: "block" }, position: "fixed", right: 0, top: 0, bottom: 0, width: sidebarWidth, zIndex: 1300, borderLeft: "1px solid #E2E8F0", boxShadow: "-2px 0 6px rgba(15, 23, 42, 0.05)" }}>
        {content}
      </Box>

      <Tooltip title="Open project menu">
        <IconButton onClick={() => setMobileOpen(true)} aria-label="Open project menu" sx={{ display: { xs: "inline-flex", md: "none" }, position: "fixed", top: 92, right: 12, zIndex: 1150, bgcolor: "#FFFFFF", border: "1px solid #CBD5E1", boxShadow: "0 3px 10px rgba(15, 23, 42, 0.12)" }}>
          <MenuRoundedIcon />
        </IconButton>
      </Tooltip>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: sidebarWidth } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1 }}>
          <Typography fontWeight={900}>Project Menu</Typography>
          <IconButton onClick={() => setMobileOpen(false)} aria-label="Close project menu"><CloseRoundedIcon /></IconButton>
        </Stack>
        <Divider />
        {content}
      </Drawer>
    </>
  );
}
