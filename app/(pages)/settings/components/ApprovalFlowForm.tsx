"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/redux/store";
import {
  createFlow,
  updateFlow,
  getFlowById,
} from "@/app/redux/controllers/approvalFlowController";
import { ApprovalStep } from "@/app/api-service/approvalFlowService";

const AVAILABLE_ROLES = [
  "BU_HEAD",
  "OP",
  "DIRECTOR",
  "FINANCE",
  "MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
];

interface ApprovalFlowFormProps {
  flowId?: string | null;
  onClose: () => void;
}

export default function ApprovalFlowForm({ flowId, onClose }: ApprovalFlowFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedFlow, loading } = useSelector(
    (state: RootState) => state.approvalFlow
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isDefault: false,
    steps: [] as ApprovalStep[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (flowId) {
      dispatch(getFlowById(flowId));
    }
  }, [flowId, dispatch]);

  useEffect(() => {
    if (selectedFlow) {
      setFormData({
        name: selectedFlow.name,
        description: selectedFlow.description || "",
        isDefault: selectedFlow.isDefault,
        steps: [...selectedFlow.steps],
      });
    }
  }, [selectedFlow]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Flow name is required";
    }

    if (formData.steps.length === 0) {
      newErrors.steps = "At least one step is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddStep = () => {
    const newStep: ApprovalStep = {
      order: formData.steps.length + 1,
      role: "BU_HEAD",
      requiresAll: 0,
      canReject: true,
    };
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep],
    });
  };

  const handleRemoveStep = (index: number) => {
    const updatedSteps = formData.steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, order: i + 1 }));
    setFormData({ ...formData, steps: updatedSteps });
  };

  const handleUpdateStep = (index: number, updates: Partial<ApprovalStep>) => {
    const updatedSteps = [...formData.steps];
    updatedSteps[index] = { ...updatedSteps[index], ...updates };
    setFormData({ ...formData, steps: updatedSteps });
  };

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.steps.length) return;

    const updatedSteps = [...formData.steps];
    [updatedSteps[index], updatedSteps[newIndex]] = [
      updatedSteps[newIndex],
      updatedSteps[index],
    ];
    updatedSteps.forEach((step, i) => {
      step.order = i + 1;
    });
    setFormData({ ...formData, steps: updatedSteps });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setSubmitError(null);

      if (flowId && selectedFlow) {
        await dispatch(
          updateFlow(flowId, {
            name: formData.name,
            description: formData.description,
            isDefault: formData.isDefault,
            steps: formData.steps,
          })
        );
      } else {
        await dispatch(
          createFlow({
            name: formData.name,
            description: formData.description,
            isDefault: formData.isDefault,
            steps: formData.steps,
          })
        );
      }

      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to save flow");
    } finally {
      setSaving(false);
    }
  };

  const isLoading = loading && flowId;
  const isDisabled = saving || !!isLoading;

  return (
    <Dialog open maxWidth="md" fullWidth>
      <DialogTitle>
        {flowId ? "Edit Approval Flow" : "Create New Approval Flow"}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            <TextField
              fullWidth
              label="Flow Name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="e.g., BU_HEAD → OP"
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              placeholder="Optional: Describe the purpose of this flow"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                />
              }
              label="Set as default approval flow"
            />

            <Divider />

            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Approval Steps
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddStep}
                >
                  Add Step
                </Button>
              </Box>

              {errors.steps && <Alert severity="error">{errors.steps}</Alert>}

              {formData.steps.length === 0 ? (
                <Alert severity="info">Add at least one step to define the approval flow.</Alert>
              ) : (
                <Stack spacing={2}>
                  {formData.steps.map((step, index) => (
                    <Card key={index}>
                      <CardContent>
                        <Stack spacing={2}>
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                backgroundColor: "#e3f2fd",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 600,
                                color: "#1976d2",
                              }}
                            >
                              {step.order}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select
                                  value={step.role}
                                  onChange={(e) =>
                                    handleUpdateStep(index, { role: e.target.value })
                                  }
                                  label="Role"
                                >
                                  {AVAILABLE_ROLES.map((role) => (
                                    <MenuItem key={role} value={role}>
                                      {role}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>

                            <IconButton
                              size="small"
                              onClick={() => handleMoveStep(index, "up")}
                              disabled={index === 0}
                            >
                              <ArrowUpIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleMoveStep(index, "down")}
                              disabled={index === formData.steps.length - 1}
                            >
                              <ArrowDownIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                              size="small"
                              onClick={() => handleRemoveStep(index)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          <Box sx={{ pl: 5 }}>
                            <FormControl fullWidth>
                              <InputLabel>Approval Rule</InputLabel>
                              <Select
                                value={step.requiresAll}
                                onChange={(e) =>
                                  handleUpdateStep(index, {
                                    requiresAll: e.target.value as 0 | 1,
                                  })
                                }
                                label="Approval Rule"
                              >
                                <MenuItem value={0}>Any one approver</MenuItem>
                                <MenuItem value={1}>All approvers must approve</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>

                          <Box sx={{ pl: 5 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={step.canReject}
                                  onChange={(e) =>
                                    handleUpdateStep(index, {
                                      canReject: e.target.checked,
                                    })
                                  }
                                />
                              }
                              label="Approver can reject project"
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isDisabled}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isDisabled}
        >
          {saving ? <CircularProgress size={24} /> : "Save Flow"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
