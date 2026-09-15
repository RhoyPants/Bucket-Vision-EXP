"use client";

import { useEffect, useState } from "react";
import {
  Alert, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { Incident, incidentService } from "@/app/api-service/incidentService";
import { incidentCaseService, ResolutionReadiness } from "@/app/api-service/incidentCaseService";
import { workflowError } from "@/app/api-service/incidentManagementService";
import IncidentEvidence from "./IncidentEvidence";

export default function IncidentResolution({ incident, onClose, onChanged, onCompleted }: {
  incident: Incident;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onCompleted: (incident: Incident) => void;
}) {
  const workflow = incident.workflow;
  const isLegacy = !workflow;
  const isFinal = workflow?.isFinal ?? true;
  const [readiness, setReadiness] = useState<ResolutionReadiness | null>(null);
  const [loading, setLoading] = useState(isFinal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remarks, setRemarks] = useState("");
  const [classification, setClassification] = useState("");
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!isFinal) {
      setLoading(false);
      return;
    }
    setLoading(true);
    incidentCaseService.readiness(incident.id)
      .then((value) => { if (alive) setReadiness(value); })
      .catch((err) => { if (alive) setError(workflowError(err).message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [incident.id, isFinal]);

  const submit = async () => {
    const activeLevelId = workflow?.activeLevelId || incident.escalation?.activeLevelId;
    if (!activeLevelId || !remarks.trim() || stale) return;
    setBusy(true);
    setError("");
    try {
      const finalFields = isFinal ? {
        resolutionClassification: classification,
        finalEvidenceIds: evidenceIds.filter((id) => incident.attachments?.some((file) => file.id === id && file.section === "RESOLUTION")),
        confirmRequiredActionsCompleted: confirmed,
      } : {};
      const updated = isLegacy
        ? await incidentService.resolve(incident.id, { activeLevelId, remarks: remarks.trim(), ...finalFields })
        : await incidentService.completeWorkflowLevel(incident.id, { activeLevelId, remarks: remarks.trim(), ...finalFields });
      const merged = {
        ...incident,
        ...updated,
        workflow: updated.workflow ? { ...incident.workflow, ...updated.workflow } : incident.workflow,
        overallSla: updated.overallSla ? { ...incident.overallSla, ...updated.overallSla } : incident.overallSla,
        notificationEscalation: updated.notificationEscalation ? { ...incident.notificationEscalation, ...updated.notificationEscalation } : incident.notificationEscalation,
        permissions: updated.permissions ? { ...incident.permissions, ...updated.permissions } : incident.permissions,
      } as Incident;
      try {
        onCompleted(await incidentService.get(incident.id));
      } catch {
        // Completion already succeeded. Fall back to the mutation response but
        // remove stale action authority until the next scheduled detail refresh.
        onCompleted({ ...merged, permissions: merged.permissions ? { ...merged.permissions, canCompleteLevel: false, canCompleteCurrentLevel: false, canResolve: false } : merged.permissions });
      }
    } catch (err) {
      const failure = workflowError(err);
      setError(failure.message);
      if (["STALE_LEVEL", "INCIDENT_NOT_PENDING", "REQUIRED_ACTIONS_INCOMPLETE", "USE_WORKFLOW_COMPLETION_ENDPOINT"].includes(failure.code || "")) {
        setStale(true);
        await onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = isLegacy ? Boolean(incident.permissions?.canResolve) : Boolean(incident.permissions?.canCompleteLevel ?? incident.permissions?.canCompleteCurrentLevel);
  const readinessAllows = !isFinal || Boolean(readiness?.canResolve);

  return <Dialog open fullWidth maxWidth="md" onClose={() => !busy && onClose()}>
    <DialogTitle>{isFinal ? "Complete final level and resolve" : "Complete workflow level"}</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {stale && <Alert severity="warning">The active workflow level changed. Close this dialog and review the refreshed incident before submitting again.</Alert>}
      <Alert severity="info">{isFinal ? "Completing the final workflow level resolves the incident and stops all timers." : "Completing this level activates the next workflow level. An SLA breach alone does not advance responsibility."}</Alert>
      {workflow && <Typography variant="body2">Level {workflow.activeLevelOrder} · {workflow.responsiblePartyLabel} · {workflow.completionRule === "ALL" ? `${workflow.confirmationCount ?? workflow.confirmedResolverIds?.length ?? 0} confirmations recorded; all eligible resolvers must confirm.` : "Any one eligible resolver may complete this level."}</Typography>}
      {loading ? <CircularProgress size={24} /> : isFinal && readiness && <>
        {readiness.blockers.map((blocker) => <Alert severity="warning" key={blocker.code}>{blocker.message}</Alert>)}
        {!readiness.canResolve && !readiness.blockers.length && <Alert severity="warning">Final completion is not ready.</Alert>}
      </>}
      <TextField required label={isFinal ? "Final completion remarks" : "Level completion remarks"} multiline minRows={3} value={remarks} disabled={busy || stale || loading} onChange={(e) => setRemarks(e.target.value)} />
      {isFinal && readiness?.canResolve && <>
        <TextField required select label="Resolution classification" value={classification} disabled={busy || stale} onChange={(e) => setClassification(e.target.value)}>
          {readiness.classificationOptions?.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
        </TextField>
        <Typography fontWeight={600}>Final evidence</Typography>
        <IncidentEvidence incidentId={incident.id} section="RESOLUTION" attachments={incident.attachments || []} canManage={!busy && !stale && Boolean(incident.permissions?.canManageEvidence)} onChanged={onChanged} />
        {incident.attachments?.filter((file) => file.section === "RESOLUTION").map((file) => <FormControlLabel key={file.id} label={`Include ${file.fileName}`} control={<Checkbox checked={evidenceIds.includes(file.id)} onChange={(_, checked) => setEvidenceIds((ids) => checked ? [...ids, file.id] : ids.filter((id) => id !== file.id))} />} />)}
        <FormControlLabel label="I confirm that required corrective actions are completed." control={<Checkbox checked={confirmed} onChange={(_, checked) => setConfirmed(checked)} />} />
      </>}
    </Stack></DialogContent>
    <DialogActions><Button disabled={busy} onClick={onClose}>Cancel</Button><Button variant="contained" disabled={loading || busy || stale || !canSubmit || !readinessAllows || !remarks.trim() || (isFinal && (!classification || !confirmed))} onClick={submit}>{busy ? "Saving…" : isFinal ? "Complete and Resolve" : "Complete Level"}</Button></DialogActions>
  </Dialog>;
}
