# Incident Management frontend

Open **Settings → Incident Management** at
`/settings?tab=incidentManagement`. The page uses the confirmed
`settings_incident_management` permission key.

## Configuration model

The Settings page contains three independent libraries:

1. **Incident Report Workflows** define sequential processing responsibility.
   Each level has a completion rule and SLA, including the final level. An SLA
   breach marks the active level overdue and does not activate the next level.
2. **Incident Types** select an active workflow, overall resolution SLA, and
   active Escalation Notification Matrix. The backend may return an informational
   warning when the workflow SLA total differs from the overall SLA.
3. **Escalation Notification Matrices** define notification-only recipients and
   delays after the overall SLA is breached. Notification recipients never gain
   workflow completion or incident resolution authority.

All libraries support server pagination, search, active status, version-aware
updates, and protected deletion. Dropdowns fetch all pages. Configuration
payloads preserve existing level IDs while stripping response-only metadata.

## Runtime behavior

- Incident creation sends only the selected `incidentTypeId`; workflow, overall
  SLA, notification matrix, and project calendar are chosen and snapshotted by
  the backend.
- Incident detail displays current workflow responsibility, level deadline,
  overdue state, overall SLA, notification status, notified recipients, and the
  separate workflow and notification histories.
- Ordinary users see only recipients returned for completed/current workflow
  levels. The frontend never resolves future workflow assignments.
- Pending details poll every 15 seconds because the backend worker may mark a
  level or overall SLA overdue and send notification escalations.
- New workflow incidents use
  `PATCH /api/incidents/:id/workflow/complete-level`. Intermediate completion
  activates the next level; completing the final level resolves the incident.
  `ALL` confirmations keep the current level active until complete.
- Legacy incidents without `workflow` continue using
  `PATCH /api/incidents/:id/resolve`.
- Investigation, evidence, corrective actions, unified history, and PDF export
  continue operating while an incident is pending.

## Assumptions applied from the accepted flow

- Notification matrices support role and specific-user recipients. Incident
  Report Workflows additionally support the contextual requester BU Head,
  project BU Head, and project owner assignments.
- Every notification level accepts zero for immediate notification when it
  becomes eligible or a positive delay. Level 1 is measured from the overall SLA
  breach; later levels are measured from the previous notification.
- A missing workflow resolver appears as an assignment exception and is not
  automatically skipped by the frontend.
- Final workflow completion uses the existing resolution-readiness endpoint to
  validate required actions and obtain resolution classifications before calling
  the workflow completion endpoint.

## Verification

```powershell
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --test tests/incidentManagement.test.cjs
```

Regression tests cover API paths, workflow and notification level serialization,
final-level SLA requirements, notification delay rules, pagination, version
preconditions, new and legacy completion endpoints, incident submission, and
Asia/Manila conversion.
