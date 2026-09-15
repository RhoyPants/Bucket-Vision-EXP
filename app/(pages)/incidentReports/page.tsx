"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Autocomplete, Box, Button, Chip, CircularProgress, Container, MenuItem, Pagination, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/shared/Layout";
import { CorrectiveActionInboxItem, InboxFilters, InboxTab, IncidentInboxItem, IncidentInboxSummary, incidentInboxService } from "@/app/api-service/incidentInboxService";
import { Page, workflowError } from "@/app/api-service/incidentManagementService";
import { incidentDate } from "@/app/(pages)/projectDashboard/[projectId]/components/IncidentEscalationPanel";
import { dueDateInput } from "@/app/utils/incidentCase";

const tabs: Array<{ key: InboxTab; label: string; count: keyof IncidentInboxSummary }> = [
  { key: "my-reports", label: "My Reports", count: "myReports" },
  { key: "for-my-action", label: "For My Action", count: "forMyAction" },
  { key: "corrective-actions", label: "Corrective Actions", count: "myCorrectiveActions" },
  { key: "all", label: "All Incidents", count: "allIncidents" },
];

export default function IncidentReportsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<InboxTab>("my-reports");
  const [summary, setSummary] = useState<IncidentInboxSummary | null>(null);
  const [result, setResult] = useState<Page<IncidentInboxItem | CorrectiveActionInboxItem> | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await incidentInboxService.summary();
      setSummary(response.data);
      if (tab === "all" && response.data.permissions?.canViewAllIncidents === false) setTab("my-reports");
    } catch (err) { setError(workflowError(err).message); }
  }, [tab]);

  const loadList = useCallback(async () => {
    setLoading(true); setError("");
    const filters: InboxFilters = { page, limit: 20, search: debouncedSearch || undefined, projectId: projectId || undefined, status: status || undefined, severity: severity || undefined, sortBy: tab === "corrective-actions" ? "dueDate" : tab === "for-my-action" ? "levelSlaDeadline" : "dateRaised", sortOrder: tab === "my-reports" || tab === "all" ? "desc" : "asc" };
    try {
      const response = tab === "my-reports" ? await incidentInboxService.myReports(filters)
        : tab === "for-my-action" ? await incidentInboxService.forMyAction(filters)
          : tab === "corrective-actions" ? await incidentInboxService.correctiveActions(filters)
            : await incidentInboxService.allIncidents(filters);
      setResult(response);
    } catch (err) { setError(workflowError(err).message); setResult(null); }
    finally { setLoading(false); }
  }, [tab, page, debouncedSearch, projectId, status, severity]);

  useEffect(() => { void loadSummary(); }, [loadSummary]);
  useEffect(() => { void loadList(); }, [loadList]);
  useEffect(() => { void incidentInboxService.projects().then((response) => setProjects(response.data)).catch(() => setProjects([])); }, []);

  const openIncident = (item: IncidentInboxItem, destination = tab === "for-my-action" ? "workflow" : "overview") => {
    const targetProjectId = item.project?.id || item.projectId;
    router.push(`/projectDashboard/${encodeURIComponent(targetProjectId)}?view=incident-reports&incidentId=${encodeURIComponent(item.id)}&incidentTab=${destination}`);
  };
  const openAction = (item: CorrectiveActionInboxItem) => {
    const targetProjectId = item.project?.id || item.projectId;
    const targetIncidentId = item.incidentId || item.incident?.id || item.incidentReport?.id;
    if (!targetProjectId || !targetIncidentId) {
      setError("This corrective action is missing its project or incident reference.");
      return;
    }
    router.push(`/projectDashboard/${encodeURIComponent(targetProjectId)}?view=incident-reports&incidentId=${encodeURIComponent(targetIncidentId)}&incidentTab=actions&actionId=${encodeURIComponent(item.id)}`);
  };
  const visibleTabs = tabs.filter((item) => item.key !== "all" || summary?.permissions?.canViewAllIncidents !== false);

  return <Layout><Container maxWidth={false} sx={{ py: { xs: 2, md: 3 }, height: { md: "100%" }, overflow: { md: "hidden" }, boxSizing: "border-box" }}><Stack spacing={2.5} sx={{ height: { md: "100%" }, minHeight: 0 }}>
    <Box sx={{ bgcolor: "#FFFFFF", borderRadius: 3, boxShadow: "0 3px 16px rgba(15,23,42,.06)", overflow: "hidden", display: "flex", flexDirection: "column", flex: { md: 1 }, minHeight: { xs: 520, md: 0 } }}>
      <Tabs value={tab} onChange={(_, value: InboxTab) => { setTab(value); setStatus("PENDING"); setSeverity(""); setPage(1); }} variant="scrollable" scrollButtons="auto" sx={{ px: 1.5, borderBottom: "1px solid #E2E8F0" }}>{visibleTabs.map((item) => <Tab key={item.key} value={item.key} label={`${item.label} ${summary ? `(${Number(summary[item.count]) || 0})` : ""}`} sx={{ textTransform: "none", minHeight: 58, px: 2.5 }} />)}</Tabs>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, alignItems: { lg: "center" }, borderBottom: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
      <Tabs value={status} onChange={(_, value: string) => { setStatus(value); setPage(1); }} variant="scrollable" scrollButtons="auto" sx={{ px: 2, minHeight: 56, flexShrink: 0, "& .MuiTab-root": { minHeight: 56, py: 1, px: 2, minWidth: "auto", textTransform: "none", fontWeight: 700 } }}>
        <Tab value="" label={tab === "corrective-actions" ? "All actions" : "All incidents"} />
        <Tab value="PENDING" label="Pending" />
        {tab === "corrective-actions" && <Tab value="IN_PROGRESS" label="In progress" />}
        {tab === "corrective-actions" ? <Tab value="COMPLETED" label="Completed" /> : <Tab value="RESOLVED" label="Resolved" />}
        <Tab value="CANCELLED" label="Cancelled" />
      </Tabs>
      <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} sx={{ px: 2, py: 1, flex: 1, minWidth: 0, justifyContent: "flex-end", bgcolor: { xs: "#F8FAFC", lg: "transparent" } }}>
        <TextField size="small" placeholder={tab === "corrective-actions" ? "Search assigned actions" : "Search incidents"} value={search} onChange={(event) => setSearch(event.target.value)} sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 180 }, flex: { sm: 1 }, maxWidth: { lg: 280 }, "& .MuiInputBase-root": { height: 38 } }} />
        <Autocomplete size="small" options={projects} value={projects.find((project) => project.id === projectId) || null} getOptionLabel={(item) => item.name} isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, item) => { setProjectId(item?.id || ""); setPage(1); }} renderInput={(params) => <TextField {...params} label="Project" />} sx={{ width: { xs: "100%", sm: 160 }, flexShrink: 0, "& .MuiInputBase-root": { height: 38 } }} />
        {tab !== "corrective-actions" && <TextField select size="small" label="Criticality" value={severity} onChange={(event) => { setSeverity(event.target.value); setPage(1); }} sx={{ width: { xs: "100%", sm: 130 }, flexShrink: 0, "& .MuiInputBase-root": { height: 38 } }}><MenuItem value="">All levels</MenuItem>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>}
      </Stack>
      </Box>
      {error && <Alert severity="error" sx={{ m: 2 }} action={<Button onClick={() => { void loadSummary(); void loadList(); }}>Retry</Button>}>{error}</Alert>}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarGutter: "stable" }}>
        {loading ? <Box sx={{ height: "100%", minHeight: 260, display: "grid", placeItems: "center" }}><CircularProgress size={28} /></Box> : !result?.data.length ? <Box sx={{ height: "100%", minHeight: 260, display: "grid", placeItems: "center", textAlign: "center", px: 2 }}><Box><Typography fontWeight={700}>{status ? `No ${status.toLowerCase().replaceAll("_", " ")} ${tab === "corrective-actions" ? "corrective actions" : "incidents"}` : "Nothing here right now"}</Typography><Typography variant="body2" color="text.secondary">Try another status or adjust the filters.</Typography></Box></Box> : <Stack divider={<Box sx={{ borderTop: "1px solid #EDF0F4" }} />}>{result.data.map((item) => tab === "corrective-actions" ? <ActionRow key={item.id} item={item as CorrectiveActionInboxItem} onOpen={openAction} /> : <IncidentRow key={item.id} item={item as IncidentInboxItem} onOpen={openIncident} />)}</Stack>}
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" gap={1.5} sx={{ p: 2, borderTop: "1px solid #E2E8F0", bgcolor: "#FFFFFF", flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">{!result?.pagination.total ? "No results" : `Showing ${(page - 1) * result.pagination.limit + 1}–${Math.min(page * result.pagination.limit, result.pagination.total)} of ${result.pagination.total}`}</Typography>
        <Pagination page={page} count={Math.max(1, result?.pagination.totalPages || 1)} onChange={(_, value) => setPage(value)} color="primary" showFirstButton showLastButton disabled={loading || (result?.pagination.totalPages || 0) <= 1} />
      </Stack>
    </Box>
  </Stack></Container></Layout>;
}

function IncidentRow({ item, onOpen }: { item: IncidentInboxItem; onOpen: (item: IncidentInboxItem) => void }) {
  const workflow = item.workflow;
  return <Box role="button" tabIndex={0} onClick={() => onOpen(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(item); }} sx={{ p: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px, 1.4fr) minmax(160px, .8fr) minmax(180px, .9fr) auto" }, gap: 2, alignItems: "center", cursor: "pointer", "&:hover": { bgcolor: "#F8FAFC" }, "&:focus-visible": { outline: "2px solid #4F46E5", outlineOffset: -2 } }}>
    <Box><Typography variant="caption" color="primary.main" fontWeight={700}>{item.incidentNumber}</Typography><Typography fontWeight={750}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.incidentType?.name || "Incident"} · {item.project?.name || "Project"}</Typography></Box>
    <Stack direction="row" gap={1}><Chip size="small" label={item.severity} variant="outlined" /><Chip size="small" label={item.status} color={item.status === "RESOLVED" ? "success" : item.status === "PENDING" ? "warning" : "default"} /></Stack>
    <Box><Typography variant="caption" color="text.secondary">Current workflow</Typography><Typography variant="body2" fontWeight={600}>{workflow?.activeLevelOrder ? `Level ${workflow.activeLevelOrder} · ${workflow.responsiblePartyLabel || "Assigned resolver"}` : workflow?.status || "No active level"}</Typography>{workflow?.levelSlaDeadline && <Typography variant="caption" color={workflow.isLevelOverdue ? "error" : "text.secondary"}>{workflow.isLevelOverdue ? "Overdue · " : "Due "}{incidentDate(workflow.levelSlaDeadline)}</Typography>}</Box>
    <Stack direction="row" alignItems="center" color="primary.main"><Typography variant="body2" fontWeight={700}>Open</Typography><ChevronRight /></Stack>
  </Box>;
}

function ActionRow({ item, onOpen }: { item: CorrectiveActionInboxItem; onOpen: (item: CorrectiveActionInboxItem) => void }) {
  const linkedIncident = item.incident || item.incidentReport;
  const incidentNumber = linkedIncident?.incidentNumber || item.incidentNumber || "Incident report";
  const incidentTitle = linkedIncident?.title || item.incidentTitle || "Untitled incident";
  const projectName = item.project?.name || item.projectName || "Project";
  const dueDate = dueDateInput(item.dueDate);
  return <Box role="button" tabIndex={0} onClick={() => onOpen(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(item); }} sx={{ p: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px, 1.4fr) minmax(180px, .8fr) minmax(160px, .7fr) auto" }, gap: 2, alignItems: "center", cursor: "pointer", "&:hover": { bgcolor: "#F8FAFC" }, "&:focus-visible": { outline: "2px solid #4F46E5", outlineOffset: -2 } }}>
    <Box><Typography fontWeight={750}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{incidentNumber} · {incidentTitle}</Typography><Typography variant="caption" color="text.secondary">{projectName}</Typography></Box>
    <Box><Typography variant="caption" color="text.secondary">Due date</Typography><Typography variant="body2" color={item.isOverdue ? "error" : "text.primary"} fontWeight={600}>{dueDate || "No due date"}{item.isOverdue && dueDate ? " · Overdue" : ""}</Typography></Box>
    <Stack direction="row" gap={1} flexWrap="wrap"><Chip size="small" label={item.status.replaceAll("_", " ")} color={item.status === "COMPLETED" ? "success" : item.isOverdue ? "error" : "default"} />{item.requiredForResolution && <Chip size="small" label="Required" variant="outlined" />}</Stack>
    <Stack direction="row" alignItems="center" color="primary.main"><Typography variant="body2" fontWeight={700}>Open</Typography><ChevronRight /></Stack>
  </Box>;
}
