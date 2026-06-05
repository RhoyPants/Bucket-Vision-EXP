"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox as MuiCheckbox,
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
  FormHelperText,
  Divider,
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
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
import { setSelectedFlow } from "@/app/redux/slices/approvalFlowSlice";
import { ApprovalStep } from "@/app/api-service/approvalFlowService";
import { getRoles } from "@/app/lib/role.api";
import { getUsersByRole } from "@/app/api-service/approvalStepUserService";

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

interface RoleOption {
  id: string;
  name: string;
}

interface RoleUserOption {
  id: string;
  name?: string;
  email?: string;
  role?: {
    id?: string;
    name?: string;
  };
}

const normalizeAssignedUsers = (assignedUsers: any[] = []): RoleUserOption[] => {
  return assignedUsers
    .map((assignedUser) => {
      if (assignedUser?.user?.id) {
        return {
          id: assignedUser.user.id,
          name: assignedUser.user.name,
          email: assignedUser.user.email,
          role: assignedUser.user.role,
        };
      }

      return {
        id: assignedUser?.id || assignedUser?.userId,
        name: assignedUser?.name,
        email: assignedUser?.email,
        role: assignedUser?.role,
      };
    })
    .filter((user) => Boolean(user?.id)) as RoleUserOption[];
};

export default function ApprovalFlowForm({ flowId, onClose }: ApprovalFlowFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedFlow, loading } = useSelector(
    (state: RootState) => state.approvalFlow
  );

  const getInitialFormData = () => ({
    name: "",
    description: "",
    isDefault: false,
    steps: [] as ApprovalStep[],
  });

  const [formData, setFormData] = useState({
    ...getInitialFormData(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [usersByStepIndex, setUsersByStepIndex] = useState<Record<number, RoleUserOption[]>>({});
  const [loadingUsersByStepIndex, setLoadingUsersByStepIndex] = useState<Record<number, boolean>>({});

  const roleIdByName = React.useMemo(
    () =>
      roles.reduce((acc, role) => {
        acc[role.name] = role.id;
        return acc;
      }, {} as Record<string, string>),
    [roles]
  );

  const resetLocalState = () => {
    setFormData(getInitialFormData());
    setErrors({});
    setSubmitError(null);
    setUsersByStepIndex({});
    setLoadingUsersByStepIndex({});
  };

  const handleCloseModal = () => {
    resetLocalState();
    dispatch(setSelectedFlow(null));
    onClose();
  };

  useEffect(() => {
    if (flowId) {
      dispatch(getFlowById(flowId));
      return;
    }

    // Create mode: ensure no stale edit data survives modal reopen.
    resetLocalState();
    dispatch(setSelectedFlow(null));
  }, [flowId, dispatch]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles();
        const roleList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];

        setRoles(
          roleList
            .filter((role: any) => role?.id && role?.name)
            .map((role: any) => ({ id: role.id, name: role.name }))
        );
      } catch (error) {
        console.error("Failed to load roles for approval step user dropdown:", error);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    if (flowId && selectedFlow) {
      const normalizedSteps = selectedFlow.steps.map((step) => ({
        ...step,
        stepExecutionMode: step.stepExecutionMode || "SEQUENTIAL",
        assignedUsers: normalizeAssignedUsers(step.assignedUsers || []),
      }));

      setFormData({
        name: selectedFlow.name,
        description: selectedFlow.description || "",
        isDefault: selectedFlow.isDefault,
        steps: normalizedSteps,
      });

      const preloadedUsersByStepIndex: Record<number, RoleUserOption[]> = {};
      normalizedSteps.forEach((step, stepIndex) => {
        if (step.useSpecificUsers && (step.assignedUsers || []).length > 0) {
          preloadedUsersByStepIndex[stepIndex] = step.assignedUsers as RoleUserOption[];
        }
      });
      setUsersByStepIndex((prev) => ({ ...prev, ...preloadedUsersByStepIndex }));
    }
  }, [flowId, selectedFlow]);

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
      stepExecutionMode: "SEQUENTIAL",
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

  const fetchUsersForStepRole = async (stepIndex: number, roleName: string) => {
    const roleId = roleIdByName[roleName];
    if (!roleId) {
      setUsersByStepIndex((prev) => ({ ...prev, [stepIndex]: [] }));
      return;
    }

    setLoadingUsersByStepIndex((prev) => ({ ...prev, [stepIndex]: true }));

    try {
      const response = await getUsersByRole(roleId);
      const users = Array.isArray(response?.data) ? response.data : [];
      setUsersByStepIndex((prev) => ({ ...prev, [stepIndex]: users }));
    } catch (error) {
      console.error("Failed to load users by role:", error);
      setUsersByStepIndex((prev) => ({ ...prev, [stepIndex]: [] }));
    } finally {
      setLoadingUsersByStepIndex((prev) => ({ ...prev, [stepIndex]: false }));
    }
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

      handleCloseModal();
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
                                  onChange={(e) => {
                                    const nextRole = e.target.value;
                                    const roleChanged = nextRole !== step.role;

                                    handleUpdateStep(index, {
                                      role: nextRole,
                                      assignedUsers: roleChanged ? [] : step.assignedUsers,
                                    });

                                    if (step.useSpecificUsers) {
                                      fetchUsersForStepRole(index, nextRole);
                                    }
                                  }}
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
                            <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                              Step Execution Mode
                            </Typography>
                            <ToggleButtonGroup
                              value={step.stepExecutionMode || "SEQUENTIAL"}
                              exclusive
                              onChange={(_, newMode) => {
                                if (newMode) {
                                  handleUpdateStep(index, {
                                    stepExecutionMode: newMode,
                                  });
                                }
                              }}
                              size="small"
                              sx={{ display: "flex", gap: 1, mb: 2 }}
                            >
                              <ToggleButton value="SEQUENTIAL" sx={{ flex: 1 }}>
                                Sequential
                              </ToggleButton>
                              <ToggleButton value="PARALLEL" sx={{ flex: 1 }}>
                                Parallel
                              </ToggleButton>
                            </ToggleButtonGroup>

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

                          {/* Specific User Assignment */}
                          <Box sx={{ pl: 5, pt: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={step.useSpecificUsers || false}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;

                                    handleUpdateStep(index, {
                                      useSpecificUsers: isChecked,
                                      assignedUsers: isChecked ? step.assignedUsers : [],
                                    });

                                    if (isChecked) {
                                      fetchUsersForStepRole(index, step.role);
                                    }
                                  }}
                                />
                              }
                              label="Assign to specific users only (instead of all with this role)"
                            />
                          </Box>

                          {step.useSpecificUsers && (
                            <Box sx={{ pl: 5, pt: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 1 }}>
                                Select Users ({AVAILABLE_ROLES.indexOf(step.role) !== -1 ? step.role : ""})
                              </Typography>
                              <FormControl fullWidth size="small">
                                <InputLabel id={`step-users-label-${index}`}>Users</InputLabel>
                                <Select
                                  labelId={`step-users-label-${index}`}
                                  multiple
                                  label="Users"
                                  value={(step.assignedUsers || []).map((user: any) => user.id)}
                                  onOpen={() => fetchUsersForStepRole(index, step.role)}
                                  onChange={(e) => {
                                    const selectedUserIds = e.target.value as string[];
                                    const stepUsers = usersByStepIndex[index] || [];
                                    const selectedUsers = selectedUserIds
                                      .map((userId) => stepUsers.find((u) => u.id === userId))
                                      .filter(Boolean) as RoleUserOption[];

                                    handleUpdateStep(index, { assignedUsers: selectedUsers as any[] });
                                  }}
                                  renderValue={(selected) => {
                                    const selectedIds = selected as string[];
                                    const stepUsers = usersByStepIndex[index] || [];
                                    const selectedUsers = (step.assignedUsers || []) as RoleUserOption[];
                                    if (selectedIds.length === 0) return "No users selected";

                                    return selectedIds
                                      .map((id) => {
                                        const user =
                                          stepUsers.find((u) => u.id === id) ||
                                          selectedUsers.find((u) => u.id === id);
                                        return user?.name || user?.email || id;
                                      })
                                      .join(", ");
                                  }}
                                >
                                  {loadingUsersByStepIndex[index] ? (
                                    <MenuItem disabled>
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <CircularProgress size={16} />
                                        Loading users...
                                      </Box>
                                    </MenuItem>
                                  ) : (usersByStepIndex[index] || []).length === 0 ? (
                                    <MenuItem disabled>No active users found for this role</MenuItem>
                                  ) : (
                                    (usersByStepIndex[index] || []).map((user) => (
                                      <MenuItem key={user.id} value={user.id}>
                                        <MuiCheckbox
                                          checked={(step.assignedUsers || []).some((u: any) => u.id === user.id)}
                                        />
                                        <Box>
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {user.name || "Unnamed user"}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {user.email || "No email"}
                                          </Typography>
                                        </Box>
                                      </MenuItem>
                                    ))
                                  )}
                                </Select>
                                <FormHelperText>
                                  Users are loaded from the selected role via backend endpoint.
                                </FormHelperText>
                              </FormControl>
                              {step.assignedUsers && step.assignedUsers.length > 0 && (
                                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
                                  {step.assignedUsers.map((user: any) => (
                                    <Chip
                                      key={user.id}
                                      label={user.name || user.email || user.id}
                                      onDelete={() => {
                                        const filtered = step.assignedUsers!.filter((u: any) => u.id !== user.id);
                                        handleUpdateStep(index, { assignedUsers: filtered });
                                      }}
                                      size="small"
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          )}
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
        <Button onClick={handleCloseModal} disabled={isDisabled}>
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
