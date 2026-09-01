"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, Stack, Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { GlobalDashboardProject } from "@/app/api-service/dashboardService";
import { ComputedSubtaskKpi, subtaskKpiService, SubtaskHealthStatus } from "@/app/api-service/subtaskKpiService";
import { Incident, incidentService } from "@/app/api-service/incidentService";

export type DashboardDrilldownMetric = "CRITICAL" | "ONFLOW" | "HEALTHY" | "INCIDENTS";

const labels: Record<DashboardDrilldownMetric, string> = {
  CRITICAL: "Critical",
  ONFLOW: "In Flow",
  HEALTHY: "Healthy",
  INCIDENTS: "Incident Reports",
};

const tones: Record<DashboardDrilldownMetric, string> = {
  CRITICAL: "#E34D6F",
  ONFLOW: "#D99118",
  HEALTHY: "#0F9F82",
  INCIDENTS: "#3978D4",
};

const countForProject = (project: GlobalDashboardProject, metric: DashboardDrilldownMetric) => {
  if (metric === "INCIDENTS") return 0;
  const summary = project.kpiSummary;
  return Number(metric === "CRITICAL" ? summary?.critical : metric === "ONFLOW" ? summary?.onflow : summary?.healthy) || 0;
};

export default function DashboardMetricDrilldownModal({
  open,
  metric,
  total,
  projects,
  onClose,
}: {
  open: boolean;
  metric: DashboardDrilldownMetric | null;
  total: number;
  projects: GlobalDashboardProject[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<GlobalDashboardProject | null>(null);
  const [kpiData, setKpiData] = useState<ComputedSubtaskKpi | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentCounts, setIncidentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedProject(null);
    setKpiData(null);
    setIncidents([]);
    setError("");
    if (metric !== "INCIDENTS") return;
    setLoading(true);
    Promise.all(projects.map(async (project) => {
      try {
        const result = await incidentService.list(project.id);
        return [project.id, result.incidents.length] as const;
      } catch {
        return [project.id, 0] as const;
      }
    }))
      .then((entries) => setIncidentCounts(Object.fromEntries(entries)))
      .finally(() => setLoading(false));
  }, [open, metric, projects]);

  const projectRows = useMemo(() => projects
    .map((project) => ({ project, count: metric === "INCIDENTS" ? incidentCounts[project.id] || 0 : metric ? countForProject(project, metric) : 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count), [incidentCounts, metric, projects]);

  const openProject = async (project: GlobalDashboardProject) => {
    if (!metric) return;
    setSelectedProject(project);
    setLoading(true);
    setError("");
    try {
      if (metric === "INCIDENTS") {
        const result = await incidentService.list(project.id);
        setIncidents(result.incidents);
      } else {
        setKpiData(await subtaskKpiService.get(project.id));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load details.");
    } finally {
      setLoading(false);
    }
  };

  const subtaskRows = metric && metric !== "INCIDENTS"
    ? (kpiData?.subtasks || []).filter((item) => item.status === metric as SubtaskHealthStatus)
    : [];
  const color = metric ? tones[metric] : "#64748B";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2, maxHeight: "82vh", overflow: "hidden", border: "1px solid #E5E7EB", boxShadow: "0 12px 28px rgba(15,23,42,.12)" } }}>
      <DialogTitle sx={{ px: 2.5, py: 1.6, borderBottom: "1px solid #E5E7EB", bgcolor: "#F8FAFC" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            {selectedProject && <IconButton size="small" onClick={() => { setSelectedProject(null); setError(""); }} aria-label="Back to projects"><ArrowBackOutlinedIcon /></IconButton>}
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 16, fontWeight: 900, color: "#172033" }}>{selectedProject?.name || `${metric ? labels[metric] : "Metric"} by project`}</Typography>
              <Typography sx={{ mt: 0.2, fontSize: 10.5, color: "#64748B" }}>{selectedProject ? `${labels[metric!]} items` : `${total} total across accessible projects`}</Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} aria-label="Close"><CloseOutlinedIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: "#FFFFFF" }}>
        {error && <Alert severity="error" sx={{ m: 2, mb: 0 }}>{error}</Alert>}
        {loading && <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}><CircularProgress size={32} /></Box>}

        {!loading && !selectedProject && (
          <Stack spacing={0.75} sx={{ p: 2, maxHeight: "62vh", overflowY: "auto" }}>
            {!projectRows.length ? <Alert severity="info">No matching projects were returned in the dashboard breakdown.</Alert> : projectRows.map(({ project, count }) => (
              <Box key={project.id} component="button" type="button" onClick={() => void openProject(project)} sx={{ width: "100%", px: 1.5, py: 1.15, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, textAlign: "left", border: "1px solid #E2E8F0", borderRadius: 1.5, bgcolor: "#FFF", cursor: "pointer", transition: "all .15s", "&:hover": { bgcolor: "#F8FAFC", borderColor: color, transform: "translateX(2px)" } }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 850, color: "#1E293B" }}>{project.name}</Typography>
                  <Typography sx={{ mt: 0.15, fontSize: 9.5, color: "#64748B" }}>{project.versionLabel || `Version ${project.versionNumber || 1}`}</Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip label={`${count} ${count === 1 ? "item" : "items"}`} size="small" sx={{ height: 23, bgcolor: `${color}10`, color, fontSize: 9.5, fontWeight: 900, border: `1px solid ${color}35` }} />
                  <ArrowForwardOutlinedIcon sx={{ color: "#94A3B8", fontSize: 19 }} />
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        {!loading && selectedProject && metric !== "INCIDENTS" && (
          <Stack divider={<Divider />} sx={{ maxHeight: "58vh", overflowY: "auto" }}>
            {!subtaskRows.length ? <Alert severity="info">No matching subtasks found.</Alert> : subtaskRows.map((item) => (
              <Box key={item.id} sx={{ px: 2.5, py: 1.25, "&:hover": { bgcolor: "#FAFAFC" } }}>
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap title={item.title} sx={{ fontSize: 13, fontWeight: 800 }}>{item.title}</Typography>
                    <Typography noWrap sx={{ mt: 0.25, color: "#64748B", fontSize: 10.5 }}>{item.scope?.name || "Scope"} · {item.task?.title || "Task"}</Typography>
                  </Box>
                  <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
                    <Box sx={{ textAlign: "right" }}><Typography sx={{ fontSize: 9, color: "#94A3B8" }}>ACTUAL</Typography><Typography sx={{ fontSize: 12, fontWeight: 800 }}>{item.actualProgress}%</Typography></Box>
                    <Box sx={{ textAlign: "right" }}><Typography sx={{ fontSize: 9, color: "#94A3B8" }}>VARIANCE</Typography><Typography sx={{ fontSize: 12, fontWeight: 900, color }}>{item.variance > 0 ? "+" : ""}{item.variance}%</Typography></Box>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        {!loading && selectedProject && metric === "INCIDENTS" && (
          <Stack divider={<Divider />} sx={{ maxHeight: "58vh", overflowY: "auto" }}>
            {!incidents.length ? <Alert severity="info">No incident reports found.</Alert> : incidents.map((incident) => (
              <Box key={incident.id} sx={{ px: 2.5, py: 1.25, "&:hover": { bgcolor: "#FAFAFC" } }}>
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontSize: 13, fontWeight: 800 }}>{incident.title}</Typography><Typography sx={{ mt: 0.25, fontSize: 10.5, color: "#64748B" }}>{incident.incidentNumber} · {incident.status}</Typography></Box>
                  <Chip label={incident.severity} size="small" sx={{ height: 22, fontSize: 9, fontWeight: 900 }} />
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: "1px solid #E5E7EB", bgcolor: "#FFFFFF" }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700 }}>Close</Button>
        {selectedProject && (
          <Button
            variant="contained"
            endIcon={<ArrowForwardOutlinedIcon />}
            onClick={() => router.push(`/projectDashboard/${selectedProject.id}${metric === "INCIDENTS" ? "?view=incident-reports" : ""}`)}
            sx={{ bgcolor: "#210E64", textTransform: "none", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "#180A4D", boxShadow: "none" } }}
          >
            Proceed to Project Dashboard
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
