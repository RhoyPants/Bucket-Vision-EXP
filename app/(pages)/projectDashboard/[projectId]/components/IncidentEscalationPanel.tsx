"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Divider, Pagination, Skeleton, Stack, Typography } from "@mui/material";
import { EscalationEvent, Incident, IncidentWorkflowRuntimeLevel, IncidentWorkflowState, incidentService } from "@/app/api-service/incidentService";
import { IncidentWorkflow, Page, incidentWorkflowService, workflowError } from "@/app/api-service/incidentManagementService";
import IncidentAcknowledgements from "./IncidentAcknowledgements";

export const incidentDate = (value?: string | null) => value ? new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }) : "—";
const readable = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());

export default function IncidentEscalationPanel({ incident }: { incident: Incident }) {
  const [workflowEvents, setWorkflowEvents] = useState<Page<EscalationEvent> | null>(null);
  const [notificationEvents, setNotificationEvents] = useState<Page<EscalationEvent> | null>(null);
  const [workflowPage, setWorkflowPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const [error, setError] = useState("");
  const [definitionLookup, setDefinitionLookup] = useState<{ workflowId: string; status: "ready" | "failed"; definition: IncidentWorkflow | null } | null>(null);

  useEffect(() => {
    const snapshot = incident.workflow;
    if (!snapshot?.workflowId || snapshot.levels?.length || snapshot.levelSnapshots?.length) {
      return;
    }
    if (definitionLookup?.workflowId === snapshot.workflowId) return;
    let alive = true;
    void incidentWorkflowService.get(snapshot.workflowId).then((definition) => {
      if (!alive) return;
      setDefinitionLookup({ workflowId: snapshot.workflowId, status: definition.version === snapshot.workflowVersion ? "ready" : "failed", definition: definition.version === snapshot.workflowVersion ? definition : null });
    }).catch(() => {
      if (alive) setDefinitionLookup({ workflowId: snapshot.workflowId, status: "failed", definition: null });
    });
    return () => { alive = false; };
  }, [incident.workflow, definitionLookup?.workflowId]);

  useEffect(() => {
    if (!incident.workflow) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      const results = await Promise.allSettled([
        incidentService.workflowHistory(incident.id, workflowPage),
        incidentService.notificationHistory(incident.id, notificationPage),
      ]);
      if (!alive) return;
      if (results[0].status === "fulfilled") setWorkflowEvents(results[0].value);
      if (results[1].status === "fulfilled") setNotificationEvents(results[1].value);
      const failures = results.filter((result) => result.status === "rejected");
      setError(failures.map((result) => workflowError(result.reason).message).join(" "));
      if (incident.status === "PENDING") timer = setTimeout(load, 15000);
    };
    void load();
    return () => { alive = false; clearTimeout(timer); };
  }, [incident.id, incident.status, incident.workflow, workflowPage, notificationPage]);

  const workflow = incident.workflow;
  if (!workflow) return incident.escalation ? <LegacyEscalation incident={incident} /> : <Typography>This incident has no workflow snapshot.</Typography>;

  const notification = incident.notificationEscalation;
  const eligibleResolvers = workflow.eligibleResolvers ?? [];
  const confirmedResolverIds = workflow.confirmedResolverIds ?? [];
  const notifiedRecipients = notification?.notifiedRecipients ?? notification?.notifiedLevels ?? [];
  const overallDeadline = incident.overallSla?.deadline ?? incident.overallSlaDeadline;
  const overallBreachedAt = incident.overallSla?.breachedAt ?? incident.overallSlaBreachedAt;
  const overallIsBreached = incident.overallSla?.isBreached ?? Boolean(overallBreachedAt);
  const hasOverallSla = Boolean(incident.overallSla || incident.overallSlaSnapshot || overallDeadline);
  const hasSnapshotLevels = Boolean(workflow.levels?.length || workflow.levelSnapshots?.length);
  const definitionPending = !hasSnapshotLevels && definitionLookup?.workflowId !== workflow.workflowId;
  const matchingDefinition = definitionLookup?.workflowId === workflow.workflowId && definitionLookup.status === "ready" && definitionLookup.definition?.version === workflow.workflowVersion ? definitionLookup.definition : null;
  const workflowName = workflow.workflowName || workflow.name || matchingDefinition?.name;
  const completedOrders = [...new Set((workflow.completedLevels ?? []).map((level) => level.order))].sort((a, b) => a - b);
  const knownLevelCount = workflow.levelCount ?? matchingDefinition?.levelCount ?? Math.max(workflow.activeLevelOrder ?? 0, ...completedOrders);
  const configuredLevels = workflow.levels ?? workflow.levelSnapshots ?? matchingDefinition?.levels ?? [];
  const trackedLevels: IncidentWorkflowRuntimeLevel[] = (configuredLevels.length ? configuredLevels : [
    ...(workflow.completedLevels ?? []).map((level) => ({ levelId: level.levelId, order: level.order })),
    ...(workflow.activeLevelOrder != null && !completedOrders.includes(workflow.activeLevelOrder) ? [{ levelId: workflow.activeLevelId ?? undefined, order: workflow.activeLevelOrder, responsiblePartyLabel: workflow.responsiblePartyLabel, completionRule: workflow.completionRule, isFinal: workflow.isFinal, eligibleResolvers, activatedAt: workflow.activatedAt, levelSlaDeadline: workflow.levelSlaDeadline, levelSlaBreachedAt: workflow.levelSlaBreachedAt }] : []),
  ]).sort((a, b) => a.order - b.order);

  return <Stack spacing={3}>
    {error && <Alert severity="error">{error}</Alert>}
    <Box><Typography variant="h6" fontWeight={700}>Incident Report Workflow</Typography>{definitionPending ? <Skeleton width={220} height={24} /> : <Typography fontWeight={700}>{workflowName || "Assigned workflow snapshot"}</Typography>}<Typography variant="body2" color="text.secondary">Snapshot version {workflow.workflowVersion}. Controls processing authority; an overdue level keeps the same responsible resolver.</Typography></Box>
    {workflow.exception && <Alert severity="warning">Assignment exception: {readable(workflow.exception)}. The workflow does not skip automatically.</Alert>}
    <Stack direction="row" gap={1} flexWrap="wrap"><Chip color="primary" variant="outlined" label={workflow.activeLevelOrder == null ? workflow.status || "Completed" : `Level ${workflow.activeLevelOrder}${workflow.isFinal ? " · Final" : ""}`} /><Chip variant="outlined" label={workflow.completionRule === "ALL" ? "All must complete" : "Any one may complete"} />{workflow.isLevelOverdue && <Chip color="error" label="Overdue" />}</Stack>
    {definitionPending ? <WorkflowTrackerSkeleton /> : <WorkflowLevelTracker workflow={workflow} levels={trackedLevels} total={knownLevelCount} />}
    <Box><Typography variant="body2" color="text.secondary">Level SLA deadline · Asia/Manila</Typography><Typography>{incidentDate(workflow.levelSlaDeadline)}</Typography>{workflow.levelSlaBreachedAt && <Typography color="error" variant="body2">Breached {incidentDate(workflow.levelSlaBreachedAt)}{workflow.lateBy ? ` · Late by ${workflow.lateBy.value} ${readable(workflow.lateBy.unit)}` : ""}</Typography>}</Box>
    {workflow.completionRule === "ALL" && <Typography variant="body2">{workflow.confirmationCount ?? confirmedResolverIds.length} of {workflow.eligibleResolverCount ?? eligibleResolvers.length} confirmations recorded</Typography>}
    <IncidentAcknowledgements incidentId={incident.id} resourceType="INCIDENT" title="Resolver notification acknowledgements" />
    <History title="Workflow history" page={workflowPage} result={workflowEvents} onPage={setWorkflowPage} />
    <Divider />
    <Box><Typography variant="h6" fontWeight={700}>Overall SLA & Notification Escalation</Typography><Typography variant="body2" color="text.secondary">Notifications provide visibility only and never grant workflow authority.</Typography></Box>
    {hasOverallSla ? <Stack spacing={1}><Stack direction="row" gap={1}><Chip label={overallIsBreached ? "Overall SLA breached" : "Overall SLA running"} color={overallIsBreached ? "error" : "success"} variant="outlined" /><Chip label={notification?.status?.replaceAll("_", " ") || "Not configured"} variant="outlined" /></Stack>{incident.overallSla?.startedAt && <Typography variant="body2">Started: {incidentDate(incident.overallSla.startedAt)}</Typography>}<Typography variant="body2">Deadline: {incidentDate(overallDeadline)}</Typography>{overallBreachedAt && <Typography variant="body2" color="error">Breached: {incidentDate(overallBreachedAt)}</Typography>}</Stack> : <Typography color="text.secondary">Overall SLA information is unavailable.</Typography>}
    {notification && <Stack spacing={1}><Typography variant="body2">Active notification level: {notification.activeNotificationLevelOrder ?? notification.activeLevelOrder ?? "Waiting"}</Typography><Typography variant="body2">Last notified: {incidentDate(notification.lastNotifiedAt)}</Typography><Typography variant="body2">Next notification: {incidentDate(notification.nextNotificationAt)}</Typography>{notifiedRecipients.map((recipient, index) => <Typography variant="body2" key={`${recipient.levelOrder ?? recipient.order ?? "level"}-${recipient.recipientId || index}`}>Level {recipient.levelOrder ?? recipient.order ?? index + 1}: {recipient.name || recipient.recipientLabel || "Recipient notified"} · {incidentDate(recipient.notifiedAt)}</Typography>)}</Stack>}
    <History title="Notification history" page={notificationPage} result={notificationEvents} onPage={setNotificationPage} />
  </Stack>;
}

function WorkflowLevelTracker({ workflow, levels, total }: { workflow: IncidentWorkflowState; levels: IncidentWorkflowRuntimeLevel[]; total: number }) {
  const completed = new Map((workflow.completedLevels ?? []).map((level) => [level.order, level]));
  return <Stack spacing={1.25}>
    <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={700}>Workflow levels</Typography>{total > 0 && <Typography variant="caption" color="text.secondary">{completed.size} of {total} completed</Typography>}</Stack>
    {!levels.length && <Alert severity="info">The incident response does not include the workflow level snapshots yet.</Alert>}
    {levels.map((level) => {
      const completion = completed.get(level.order);
      const isCurrent = workflow.activeLevelOrder === level.order && workflow.status !== "COMPLETED";
      const isResolved = Boolean(completion && level.isFinal && workflow.status === "COMPLETED");
      const isLate = Boolean(completion?.wasLate || (isCurrent && workflow.isLevelOverdue));
      const state = isResolved ? "Resolved" : completion ? (completion.wasLate ? "Completed late · advanced" : "Completed · advanced") : isCurrent ? (workflow.isLevelOverdue ? "Current · late" : "Current") : "Upcoming";
      const recipients = (isCurrent ? workflow.eligibleResolvers : level.eligibleResolvers) ?? [];
      const deadline = isCurrent ? workflow.levelSlaDeadline : level.levelSlaDeadline;
      const sla = level.slaValue != null && level.slaUnit ? `${level.slaValue} ${level.slaUnit === "DAYS" ? "working days" : "elapsed hours"}` : null;
      return <Box key={level.id || level.levelId || level.order} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: isCurrent ? (isLate ? "error.main" : "primary.main") : completion ? "success.light" : "divider", bgcolor: isCurrent ? (isLate ? "error.50" : "primary.50") : completion ? "success.50" : "grey.50", boxShadow: isCurrent ? 2 : 0 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
          <Box><Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Typography fontWeight={800}>Level {level.order}{level.isFinal ? " · Final" : ""}</Typography><Chip size="small" label={state} color={isLate ? "error" : completion || isResolved ? "success" : isCurrent ? "primary" : "default"} /></Stack><Typography fontWeight={600} mt={0.75}>{level.responsiblePartyLabel || (isCurrent ? workflow.responsiblePartyLabel : null) || "Responsible party"}</Typography>{recipients.length > 0 && <Typography variant="body2">{recipients.map((person) => person.name || person.email || "Assigned user").join(", ")}</Typography>}</Box>
          <Box sx={{ minWidth: 190 }}><Typography variant="body2"><strong>Rule:</strong> {(level.completionRule || (isCurrent ? workflow.completionRule : undefined)) === "ALL" ? "All eligible resolvers" : "Any one resolver"}</Typography><Typography variant="body2"><strong>Level SLA:</strong> {sla || "Not provided"}</Typography>{deadline && <Typography variant="body2"><strong>Deadline:</strong> {incidentDate(deadline)}</Typography>}</Box>
        </Stack>
        {completion && <Typography variant="caption" color={completion.wasLate ? "error.main" : "success.main"} display="block" mt={1}>{completion.wasLate ? "Completed after the level SLA and advanced to the next level." : level.isFinal ? "Final level completed; incident resolved." : "Completed within SLA and advanced to the next level."}{completion.completedAt ? ` ${incidentDate(completion.completedAt)}` : ""}</Typography>}
        {isCurrent && workflow.isLevelOverdue && <Typography variant="caption" color="error.main" display="block" mt={1}>Level SLA breached. This level remains responsible until completion.</Typography>}
      </Box>;
    })}
  </Stack>;
}

function WorkflowTrackerSkeleton() {
  return <Stack spacing={1.25} aria-label="Loading workflow levels"><Stack direction="row" justifyContent="space-between"><Skeleton width={120} height={24} /><Skeleton width={90} height={20} /></Stack>{[1, 2, 3].map((level) => <Box key={level} sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC" }}><Stack direction="row" justifyContent="space-between" gap={2}><Box sx={{ flex: 1 }}><Skeleton width={90} height={22} /><Skeleton width="45%" height={20} /></Box><Box sx={{ width: 190 }}><Skeleton width="100%" height={18} /><Skeleton width="80%" height={18} /></Box></Stack></Box>)}</Stack>;
}

function History({ title, page, result, onPage }: { title: string; page: number; result: Page<EscalationEvent> | null; onPage: (page: number) => void }) {
  return <Stack spacing={1.5}><Typography fontWeight={700}>{title}</Typography>{!result ? <CircularProgress size={22} /> : !result.data.length ? <Typography variant="body2" color="text.secondary">No events recorded.</Typography> : result.data.map((event) => <Box key={event.id} sx={{ pl: 2, borderLeft: "3px solid", borderColor: "primary.light" }}><Typography variant="body2" fontWeight={600}>{readable(event.eventType)}</Typography><Typography variant="caption" color="text.secondary">{incidentDate(event.timestamp)}</Typography></Box>)}{result && result.pagination.totalPages > 1 && <Pagination size="small" count={result.pagination.totalPages} page={page} onChange={(_, value) => onPage(value)} />}</Stack>;
}

function LegacyEscalation({ incident }: { incident: Incident }) {
  const escalation = incident.escalation!;
  return <Alert severity="info">Legacy incident · Level {escalation.activeLevelOrder || "—"} · {(escalation.eligibleResolvers ?? []).map((person) => person.name || person.email).join(", ") || "No assigned resolver"} · Deadline {incidentDate(escalation.slaDeadline)}</Alert>;
}
