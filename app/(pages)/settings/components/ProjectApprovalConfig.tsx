"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Stack,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import { ArrowForward as ArrowForwardIcon } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/redux/store";
import {
  getApprovalFlows,
  setProjectApprovalFlow,
} from "@/app/redux/controllers/approvalFlowController";

interface ProjectApprovalConfigProps {
  projectId: string | null;
  projectName?: string;
  projectStatus?: string;
  currentApprovalFlowId?: string | null;
  currentApprovalEnabled?: boolean;
  currentApprovalFlowName?: string;
  open: boolean;
  onClose: () => void;
}

export default function ProjectApprovalConfig({
  projectId,
  projectName,
  projectStatus,
  currentApprovalFlowId,
  currentApprovalEnabled = true,
  currentApprovalFlowName,
  open,
  onClose,
}: ProjectApprovalConfigProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { flows, loading } = useSelector(
    (state: RootState) => state.approvalFlow
  );

  const isDraft = projectStatus === "DRAFT";
  const isNonDraftProject: boolean = !!(projectStatus && !isDraft);

  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [approvalEnabled, setApprovalEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      dispatch(getApprovalFlows());
      // Pre-populate from current values
      setSelectedFlowId(currentApprovalFlowId || null);
      setApprovalEnabled(currentApprovalEnabled ?? true);
    }
  }, [open, dispatch, currentApprovalFlowId, currentApprovalEnabled]);

  const selectedFlow = selectedFlowId ? flows.find((f) => f.id === selectedFlowId) : null;

  const getApprovalRuleLabel = (requiresAll: 0 | 1) => {
    return requiresAll === 1 ? "All must approve" : "Any one approves";
  };

  const handleSave = async () => {
    if (!projectId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await dispatch(
        setProjectApprovalFlow(projectId, {
          approvalFlowId: selectedFlowId || undefined,
          approvalEnabled,
        })
      );

      setSuccessMessage(`✅ Approval workflow configured successfully!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to save approval configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>🔐 Configure Project Approval</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Warning: Project not in draft status */}
            {isNonDraftProject && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>⚠️ Project Status: {projectStatus}</strong>
                <Typography variant="body2" sx={{ mt: 0.5, mb: 1 }}>
                  Approval workflow cannot be modified once the project has left draft status.
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12, color: "#666" }}>
                  To change the approval workflow, you must <strong>reject this project</strong> to return it to draft status.
                </Typography>
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}

            {/* Project Info */}
            {projectName && (
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  Project
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {projectName}
                </Typography>
              </Box>
            )}

            {/* Current Approval Flow Info */}
            {currentApprovalEnabled && (
              <Card sx={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", p: 2 }}>
                <Stack spacing={1}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    ✓ Current Approval Flow
                  </Typography>
                  <Typography sx={{ color: "#15803d", fontSize: 13 }}>
                    <strong>
                      {currentApprovalFlowName || "Using default flow"}
                    </strong>
                  </Typography>
                </Stack>
              </Card>
            )}

            {/* Approval Enabled Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={approvalEnabled}
                  onChange={(e) => setApprovalEnabled(e.target.checked)}
                />
              }
              label="Enable approval workflow for this project"
            />

            {/* Flow Selection */}
            {approvalEnabled && (
              <>
                <FormControl fullWidth disabled={isNonDraftProject}>
                  <InputLabel>Select Approval Flow</InputLabel>
                  <Select
                    value={selectedFlowId || ""}
                    onChange={(e) => setSelectedFlowId(e.target.value || null)}
                    label="Select Approval Flow"
                    disabled={isNonDraftProject}
                  >
                    <MenuItem value="">
                      <em>Use default flow</em>
                    </MenuItem>
                    {flows.map((flow) => (
                      <MenuItem key={flow.id} value={flow.id}>
                        {flow.name}
                        {flow.isDefault ? " (default)" : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {isNonDraftProject && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ fontSize: 12 }}>
                      💡 <strong>Tip:</strong> Reject the project first to unlock approval workflow changes.
                    </Typography>
                  </Alert>
                )}

                {/* Flow Preview */}
                {selectedFlow && (
                  <Card>
                    <CardContent>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {selectedFlow.name}
                          </Typography>
                          {selectedFlow.description && (
                            <Typography variant="caption" color="textSecondary">
                              {selectedFlow.description}
                            </Typography>
                          )}
                        </Box>

                        {/* Flow visualization */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflowX: "auto", py: 1 }}>
                          {selectedFlow.steps.map((step, index) => (
                            <React.Fragment key={step.id || index}>
                              <Box
                                sx={{
                                  minWidth: 110,
                                  p: 1.5,
                                  backgroundColor: "#f5f5f5",
                                  borderRadius: 1,
                                  textAlign: "center",
                                  border: "1px solid #e0e0e0",
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#1976d2", mb: 0.5 }}>
                                  {step.role}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  {getApprovalRuleLabel(step.requiresAll)}
                                </Typography>
                                {step.canReject && (
                                  <Chip
                                    label="Can reject"
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                              {index < selectedFlow.steps.length - 1 && (
                                <ArrowForwardIcon sx={{ color: "#999", fontSize: 18 }} />
                              )}
                            </React.Fragment>
                          ))}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || loading}
          sx={{ minWidth: 120 }}
        >
          {saving ? <CircularProgress size={24} /> : "Save Configuration"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
