"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Avatar, Box, Chip, CircularProgress, Stack, Tab, Tabs, Typography } from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import ProjectTeamPanel from "@/app/(pages)/projects/[id]/setup/components/ProjectTeamPanel";
import OrgChartBuilder from "./OrgChartBuilder";
import axiosApi from "@/app/lib/axios";

type OrgNode = {
  id: string;
  userId?: string;
  projectMemberId?: string;
  name?: string;
  email?: string;
  position?: string;
  systemRole?: string;
  projectRole?: "OWNER" | "SUB_OWNER" | "MEMBER" | string;
  children?: OrgNode[];
};

type OrgChartData = {
  project?: { id: string; name?: string };
  tree?: OrgNode | null;
  summary?: {
    owners?: number;
    subOwners?: number;
    members?: number;
    total?: number;
    membersReportingToSubOwners?: number;
    membersReportingDirectlyToOwner?: number;
  };
};

const roleTone = (role?: string) => {
  if (role === "OWNER") return { background: "#FEF3C7", color: "#92400E", border: "#FCD34D" };
  if (role === "SUB_OWNER") return { background: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" };
  return { background: "#ECFDF5", color: "#047857", border: "#A7F3D0" };
};

function OrganizationNode({ node }: { node: OrgNode }) {
  const children = node.children ?? [];
  const tone = roleTone(node.projectRole);
  const initials = String(node.name || "Unknown")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 150 }}>
      <Box sx={{ width: 160, p: 1, borderRadius: 1.5, bgcolor: "#FFFFFF", border: `1px solid ${tone.border}`, boxShadow: "0 2px 7px rgba(15, 23, 42, 0.07)" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 34, height: 34, bgcolor: tone.background, color: tone.color, fontSize: 11, fontWeight: 900 }}>{initials || "?"}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap title={node.name} sx={{ fontSize: 11.5, fontWeight: 900, color: "#0F172A" }}>{node.name || "Unnamed member"}</Typography>
            <Typography noWrap title={node.position || node.email} sx={{ fontSize: 9.5, color: "#64748B" }}>{node.position || node.email || "No position"}</Typography>
          </Box>
        </Stack>
        <Chip label={String(node.projectRole || "MEMBER").replaceAll("_", " ")} size="small" sx={{ mt: 0.75, height: 18, fontSize: 8, fontWeight: 900, bgcolor: tone.background, color: tone.color, border: `1px solid ${tone.border}` }} />
      </Box>

      {children.length > 0 && (
        <>
          <Box sx={{ width: 2, height: 20, bgcolor: "#94A3B8" }} />
          <Box sx={{ display: "flex", alignItems: "flex-start", position: "relative", pt: 2.5, gap: 1.5, "&::before": { content: '""', position: "absolute", top: 0, left: children.length === 1 ? "50%" : 80, right: children.length === 1 ? "50%" : 80, height: 2, bgcolor: "#94A3B8" } }}>
            {children.map((child) => (
              <Box key={`${node.id}-${child.projectMemberId || child.id}`} sx={{ position: "relative", pt: 0, "&::before": { content: '""', position: "absolute", top: -20, left: "50%", width: 2, height: 20, bgcolor: "#94A3B8" } }}>
                <OrganizationNode node={child} />
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

export default function ProjectTeamOrganization({ projectId }: { projectId: string }) {
  const [data, setData] = useState<OrgChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const loadChart = useCallback(async () => {
    try {
      setError("");
      const response = await axiosApi.get(`/projects/${projectId}/team-org-chart`);
      setData(response.data?.data ?? response.data);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load the project organization chart");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadChart();
  }, [loadChart]);

  const summary = data?.summary;

  return (
    <Box sx={{ height: { xs: "auto", md: "calc(100vh - max(10vh, 125px))" }, minHeight: 600, p: 1.25, display: "flex", flexDirection: "column", overflow: { xs: "visible", md: "hidden" } }}>
      <Box sx={{ flex: 1, minHeight: 0, bgcolor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          aria-label="Project team organization sections"
          sx={{ px: 1.5, minHeight: 52, borderBottom: "1px solid #E2E8F0", "& .MuiTab-root": { minHeight: 52, textTransform: "none", fontSize: 12.5, fontWeight: 800 }, "& .Mui-selected": { color: "#1D4ED8" } }}
        >
          <Tab icon={<GroupsOutlinedIcon />} iconPosition="start" label="Team Management" />
          <Tab icon={<AccountTreeOutlinedIcon />} iconPosition="start" label="Organization Chart" />
          <Tab icon={<EditNoteOutlinedIcon />} iconPosition="start" label="Org Chart Builder" />
        </Tabs>

        {activeTab === 0 ? (
          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 1.5, "& .MuiTypography-body1": { fontSize: "12.5px" }, "& .MuiTypography-body2": { fontSize: "11px" }, "& .MuiButton-root": { fontSize: "11px" }, "& .MuiChip-root": { fontSize: "10px" } }}>
            <ProjectTeamPanel projectId={projectId} onTeamChanged={loadChart} />
          </Box>
        ) : activeTab === 1 ? (
          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ px: 2, py: 1.25, borderBottom: "1px solid #E2E8F0" }}>
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 900, color: "#0F172A" }}>Project Organization</Typography>
                <Typography sx={{ fontSize: 11, color: "#64748B" }}>{data?.project?.name || "Team reporting hierarchy"}</Typography>
              </Box>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={`${summary?.subOwners ?? 0} Sub-owners`} sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 800 }} />
                <Chip size="small" label={`${summary?.members ?? 0} Members`} sx={{ bgcolor: "#ECFDF5", color: "#047857", fontWeight: 800 }} />
                <Chip size="small" label={`${summary?.total ?? 0} Total`} sx={{ bgcolor: "#F1F5F9", color: "#475569", fontWeight: 800 }} />
              </Stack>
            </Stack>

            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
              {loading ? (
                <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><CircularProgress /></Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : data?.tree ? (
                <Box sx={{ width: "max-content", minWidth: "100%", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100%" }}><OrganizationNode node={data.tree} /></Box>
              ) : (
                <Alert severity="info">No organization chart data is available for this project.</Alert>
              )}
            </Box>
          </Box>
        ) : <OrgChartBuilder projectId={projectId} />}
      </Box>
    </Box>
  );
}
