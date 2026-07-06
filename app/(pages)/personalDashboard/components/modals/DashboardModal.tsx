"use client";

import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useAppDispatch } from "@/app/redux/hook";
import {
  createDashboard,
  updateDashboard,
} from "@/app/redux/controllers/personalDashboardController";
import { PersonalDashboard } from "@/app/api-service/personalDashboardService";
import { usePermissions } from "@/app/lib/usePermissions";

type ProjectOption = { id: string; name: string };

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function DashboardModal({
  open,
  onClose,
  onSaved,
  projects,
  dashboard,
  dashboardCount,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  projects: ProjectOption[];
  dashboard?: PersonalDashboard | null;
  dashboardCount: number;
}) {
  const dispatch = useAppDispatch();
  const { canCreate, canUpdate } = usePermissions();
  const isEdit = Boolean(dashboard?.id);
  const canSaveDashboard = isEdit
    ? canUpdate("personal_dashboard")
    : canCreate("personal_dashboard");
  const [form, setForm] = useState({ name: "", description: "", projectId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm({
      name: dashboard?.name ?? "",
      description: dashboard?.description ?? "",
      projectId: dashboard?.projectId ?? dashboard?.project?.id ?? "",
    });
  }, [dashboard, open]);

  const projectIdValue = form.projectId || "";
  const canSave = canSaveDashboard && form.name.trim().length > 0 && Boolean(projectIdValue) && (isEdit || dashboardCount < 5);

  const handleSubmit = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      setError("");
      if (isEdit && dashboard?.id) {
        await dispatch(updateDashboard(dashboard.id, {
          name: form.name.trim(),
          description: form.description.trim(),
        }));
      } else {
        await dispatch(createDashboard({
          name: form.name.trim(),
          description: form.description.trim(),
          projectId: form.projectId,
        }));
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save dashboard."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEdit ? "Edit Dashboard" : "Create Personal Dashboard"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {!isEdit && dashboardCount >= 5 && (
            <Alert severity="warning">You already have the maximum of 5 personal dashboards.</Alert>
          )}
          <TextField
            label="Dashboard Name"
            fullWidth
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <TextField
            label="Dashboard Description"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <TextField
            select
            label="Project"
            fullWidth
            required
            disabled={isEdit}
            value={projectIdValue}
            onChange={(event) => setForm((prev) => ({ ...prev, projectId: String(event.target.value) }))}
          >
            {projects.length === 0 ? (
              <MenuItem value="" disabled>
                No active accessible projects
              </MenuItem>
            ) : (
              projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))
            )}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        {canSaveDashboard && (
          <Button variant="contained" disabled={!canSave || saving} onClick={handleSubmit}>
            {saving ? "Saving..." : isEdit ? "Update Dashboard" : "Create Dashboard"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
