"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Pagination, Stack, Tab, Tabs, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { Incident, incidentService } from "@/app/api-service/incidentService";
import { CaseEvent, IncidentAction, Investigation, incidentCaseService } from "@/app/api-service/incidentCaseService";
import { Page, workflowError } from "@/app/api-service/incidentManagementService";
import IncidentOverview from "./IncidentOverview";
import IncidentInvestigation from "./IncidentInvestigation";
import IncidentActions from "./IncidentActions";
import IncidentResolution from "./IncidentResolution";
import IncidentEscalationPanel, { incidentDate } from "./IncidentEscalationPanel";

export type IncidentDetailTab = "overview" | "investigation" | "actions" | "workflow" | "history";
const detailTabIndex: Record<IncidentDetailTab, number> = { overview: 0, investigation: 1, actions: 2, workflow: 3, history: 4 };

export default function IncidentCaseDetail({ initial, initialTab = "overview", initialActionId, onClose, onUpdated }: { initial: Incident; initialTab?: IncidentDetailTab; initialActionId?: string; onClose: (incident: Incident) => void; onUpdated: (incident: Incident) => void }) {
  const [incident, setIncident] = useState(initial);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [actions, setActions] = useState<Page<IncidentAction> | null>(null);
  const [history, setHistory] = useState<Page<CaseEvent> | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [tab, setTab] = useState(detailTabIndex[initialTab]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reload, setReload] = useState(0);
  const request = useRef(0);
  const update = (value: Incident) => { request.current++; setIncident(value); onUpdated(value); };
  const refresh = useCallback(async () => {
    const generation = ++request.current;
    try { const current = await incidentService.get(initial.id); if (generation === request.current) setIncident(current); }
    catch (err) { if (generation === request.current) setError(workflowError(err).message); }
  }, [initial.id]);

  useEffect(() => {
    let alive = true; setLoading(true); setError("");
    void Promise.allSettled([incidentCaseService.investigation(initial.id), incidentCaseService.actions(initial.id), incidentCaseService.history(initial.id, 1)]).then(([findings, actionList, events]) => {
      if (!alive) return;
      if (findings.status === "fulfilled") setInvestigation(findings.value);
      if (actionList.status === "fulfilled") setActions(actionList.value);
      if (events.status === "fulfilled") { setHistory(events.value); setHistoryPage(1); }
      const failed = [findings, actionList, events].filter((result) => result.status === "rejected");
      if (failed.length) setError(failed.map((result) => workflowError(result.reason).message).join(" "));
      setLoading(false);
    });
    return () => { alive = false; };
  }, [initial.id, reload]);

  useEffect(() => {
    if (incident.status !== "PENDING" || resolution) return;
    let alive = true; let timer: ReturnType<typeof setTimeout>;
    const poll = async () => { await refresh(); if (alive) timer = setTimeout(poll, 15000); };
    timer = setTimeout(poll, 15000);
    return () => { alive = false; clearTimeout(timer); };
  }, [incident.status, resolution, refresh]);

  useEffect(() => {
    if (tab !== 4) return;
    let alive = true; let timer: ReturnType<typeof setTimeout>;
    const loadHistory = async () => {
      try { const result = await incidentCaseService.history(initial.id, historyPage); if (alive) setHistory(result); }
      catch (err) { if (alive) setError(workflowError(err).message); }
      finally { if (alive && incident.status === "PENDING") timer = setTimeout(loadHistory, 15000); }
    };
    void loadHistory();
    return () => { alive = false; clearTimeout(timer); };
  }, [tab, historyPage, initial.id, incident.status]);

  const exportPdf = async () => {
    setExporting(true); setError("");
    try { await incidentCaseService.exportPdf(incident.id, incident.incidentNumber); }
    catch (err) { setError(workflowError(err).message); }
    finally { setExporting(false); }
  };

  const workflow = incident.workflow;
  const legacy = incident.escalation;
  const activeOrder = workflow?.activeLevelOrder ?? legacy?.activeLevelOrder;
  const isFinal = workflow?.isFinal ?? legacy?.isFinal;
  const names = workflow?.eligibleResolvers ?? legacy?.eligibleResolvers ?? [];
  const deadline = workflow?.levelSlaDeadline ?? legacy?.slaDeadline;
  const canProcess = workflow ? (incident.permissions?.canCompleteLevel ?? incident.permissions?.canCompleteCurrentLevel) : incident.permissions?.canResolve;

  return <Box sx={{ minHeight: 600 }}>
    <Stack spacing={2.5}>
      <Box sx={{ border: "1px solid #E2E8F0", borderRadius: 1.25, bgcolor: "#FFFFFF", overflow: "hidden", boxShadow: "0 2px 10px rgba(15,23,42,.04)" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ px: { xs: 1.25, md: 2 }, py: 0.75, borderBottom: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
          <Button variant="text" color="inherit" size="small" startIcon={<ArrowBack />} onClick={() => onClose(incident)} sx={{ textTransform: "none", px: 0.5, color: "#475569", fontWeight: 700, "&:hover": { bgcolor: "#EEF2F7", color: "#1E293B" } }}>Back to incident reports</Button>
          <Stack direction="row" gap={0.75}>
            <Chip size="small" label={incident.severity} color={incident.severity === "CRITICAL" ? "error" : incident.severity === "HIGH" ? "warning" : incident.severity === "LOW" ? "success" : "default"} sx={{ borderRadius: 0.75, fontWeight: 800, ...(incident.severity === "MEDIUM" ? { bgcolor: "#FEF3C7", color: "#92400E" } : {}) }} />
            <Chip size="small" label={incident.status} color={incident.status === "RESOLVED" ? "success" : incident.status === "PENDING" ? "warning" : incident.status === "CANCELLED" ? "error" : "default"} sx={{ borderRadius: 0.75, fontWeight: 800 }} />
          </Stack>
        </Stack>
        <Box sx={{ px: { xs: 1.5, md: 2 }, py: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(220px, 1.3fr) minmax(180px, .8fr)", lg: "minmax(260px, 1.35fr) minmax(200px, .8fr) minmax(220px, .8fr) auto" }, alignItems: "center", gap: { xs: 1.5, md: 2 } }}>
          <Box sx={{ minWidth: 0 }}><Typography variant="caption" color="primary.main" fontWeight={700}>{incident.incidentNumber}</Typography><Typography variant="h6" fontWeight={750} noWrap>{incident.title}</Typography><Typography variant="caption" color="text.secondary">{incident.incidentType?.name || "Incident"} · Reported {incidentDate(incident.dateRaised)}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary" fontWeight={700}>Current responsibility</Typography><Typography variant="body2" fontWeight={700}>{activeOrder != null ? `Level ${activeOrder}${isFinal ? " · Final" : ""}` : "No active level"}</Typography><Typography variant="caption">{workflow?.responsiblePartyLabel || names.map((person) => person.name || person.email).filter(Boolean).join(", ") || "No active assignment"}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary" fontWeight={700}>Level SLA · Asia/Manila</Typography><Typography variant="body2" fontWeight={700}>{incidentDate(deadline)}</Typography>{workflow?.isLevelOverdue && <Typography variant="caption" color="error">Overdue; responsibility remains active.</Typography>}</Box>
          <Stack direction="row" gap={1} justifyContent={{ xs: "flex-start", lg: "flex-end" }}>{incident.permissions?.canExportReport && <Button size="small" variant="outlined" disabled={exporting} onClick={exportPdf}>{exporting ? "Exporting…" : "Export PDF"}</Button>}{incident.status === "PENDING" && canProcess && <Button size="small" variant="contained" onClick={() => setResolution(true)}>{isFinal ? "Complete & Resolve" : workflow ? "Complete Level" : "Review Resolution"}</Button>}</Stack>
        </Box>
      </Box>
      {error && <Alert severity="error" action={<Button color="inherit" onClick={() => { void refresh(); setReload((value) => value + 1); }}>Retry</Button>}>{error}</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
      <Box sx={{ border: "1px solid #E2E8F0", borderRadius: 1.25, bgcolor: "#FFFFFF", overflow: "hidden", boxShadow: "0 3px 14px rgba(15,23,42,.05)" }}>
      <Box sx={{ bgcolor: "#F1F5F9", borderBottom: "1px solid #E2E8F0" }}><Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" sx={{ px: { xs: 0.5, md: 1.5 } }}>{["Overview", "Investigation", "Corrective Actions", "Workflow & SLA", "History"].map((label) => <Tab key={label} label={label} sx={{ textTransform: "none" }} />)}</Tabs></Box>
      <Box sx={{ p: { xs: 1.5, md: 2.5 }, minHeight: 420, bgcolor: "#FFFFFF" }}>
      <Box hidden={tab !== 0}><IncidentOverview incident={incident} onChanged={refresh} onUpdated={(value) => { update(value); setNotice("Overview saved."); }} /></Box>
      <Box hidden={tab !== 1}>{investigation ? <IncidentInvestigation incident={incident} initial={investigation} onChanged={refresh} /> : loading ? <CircularProgress size={24} /> : <Alert severity="warning">Investigation could not be loaded.</Alert>}</Box>
      <Box hidden={tab !== 2}>{actions ? <IncidentActions incident={incident} initial={actions} initialActionId={initialActionId} onChanged={refresh} /> : loading ? <CircularProgress size={24} /> : <Alert severity="warning">Actions could not be loaded.</Alert>}</Box>
      {tab === 3 && <IncidentEscalationPanel incident={incident} />}
      {tab === 4 && <Stack spacing={2}>{!history ? <CircularProgress size={24} /> : history.data.map((event) => <Box key={event.id} sx={{ pl: 2, borderLeft: "3px solid", borderColor: "primary.light" }}><Typography fontWeight={600}>{event.summary || event.eventType.replaceAll("_", " ")}</Typography><Typography variant="caption" color="text.secondary">{incidentDate(event.timestamp)}{event.actor?.name ? ` · ${event.actor.name}` : ""}</Typography></Box>)}{history && history.pagination.totalPages > 1 && <Pagination count={history.pagination.totalPages} page={historyPage} onChange={(_, value) => setHistoryPage(value)} />}</Stack>}
      </Box>
      </Box>
    </Stack>
    {resolution && <IncidentResolution incident={incident} onClose={() => setResolution(false)} onChanged={refresh} onCompleted={(value) => { update(value); setResolution(false); setNotice(value.status === "RESOLVED" ? "Incident resolved." : "Workflow completion recorded."); }} />}
  </Box>;
}
