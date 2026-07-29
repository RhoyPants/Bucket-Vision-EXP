"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  FormLabel,
  FormHelperText,
  Radio,
  RadioGroup,
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
  ArrowForward as ArrowForwardIcon,
  PersonOutline as PersonIcon,
  CheckCircleOutline as ActiveIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/redux/store";
import {
  createFlow,
  updateFlow,
  getFlowById,
} from "@/app/redux/controllers/approvalFlowController";
import { setSelectedFlow } from "@/app/redux/slices/approvalFlowSlice";
import {
  ApprovalStep,
  ApproverSource,
  SelfApprovalMode,
} from "@/app/api-service/approvalFlowService";
import { getRoles } from "@/app/lib/role.api";
import { getUsersByRole } from "@/app/api-service/approvalStepUserService";
import { usePermissions } from "@/app/lib/usePermissions";

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
  role?: { id?: string; name?: string };
}

interface AssignedUserSource extends Partial<RoleUserOption> {
  userId?: string;
  user?: RoleUserOption;
}

const isRoleOption = (role: unknown): role is RoleOption => {
  return (
    typeof role === "object" &&
    role !== null &&
    "id" in role &&
    "name" in role &&
    typeof (role as { id: unknown }).id === "string" &&
    typeof (role as { name: unknown }).name === "string"
  );
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const normalizeAssignedUsers = (assignedUsers: unknown[] = []): RoleUserOption[] =>
  (assignedUsers as AssignedUserSource[]).reduce<RoleUserOption[]>(
    (users, assignedUser) => {
      const user = assignedUser.user || assignedUser;
      const id = user.id || assignedUser.userId;
      if (id) {
        users.push({
          id,
          name: user.name,
          email: user.email,
          role: user.role,
        });
      }
      return users;
    },
    []
  );

const approverSourceOptions: Array<{
  label: string;
  value: Exclude<ApproverSource, "SPECIFIC_USERS">;
  description: string;
}> = [
  {
    label: "Project Business Unit Head",
    value: "PROJECT_BU_HEAD",
    description: "Automatically assigns the Head linked to the project's Business Unit.",
  },
  {
    label: "Requester’s Business Unit Head",
    value: "REQUESTER_BU_HEAD",
    description:
      "Automatically assigns the active Head linked to the project requester's Business Unit.",
  },
  {
    label: "Selected Role",
    value: "ROLE",
    description: "Assigns active users belonging to the selected role.",
  },
];

const selfApprovalOptions: Array<{
  label: string;
  value: SelfApprovalMode;
  description: string;
}> = [
  {
    label: "Approve through highest step",
    value: "THROUGH_HIGHEST_STEP",
    description: "Automatically approves the requester's step and all preceding steps.",
  },
  {
    label: "Approve own step only",
    value: "OWN_STEP",
    description: "Only the step assigned to the requester is automatically approved.",
  },
];

const getStepPreview = (step: ApprovalStep) => {
  if (step.approverSource === "PROJECT_BU_HEAD") {
    return {
      title: "Project BU Head",
      detail: "Reviews the request",
    };
  }
  if (step.approverSource === "REQUESTER_BU_HEAD") {
    return {
      title: "Requester’s BU Head",
      detail: "Reviews the request",
    };
  }
  if (step.approverSource === "SPECIFIC_USERS") {
    const users = (step.assignedUsers || []) as RoleUserOption[];
    return {
      title: step.role || "Selected Role",
      detail:
        users.length > 0
          ? users.map((user) => user.name || user.email).join(", ")
          : "Select specific approvers",
    };
  }
  return {
    title: step.role || "Selected Role",
    detail: step.role ? "Role members approve" : "Select an approver role",
  };
};

function ApprovalFlowPreview({ steps }: { steps: ApprovalStep[] }) {
  const nodes = [
    {
      key: "requester",
      eyebrow: "START",
      title: "Requester",
      detail: "Creates and submits the project",
      color: "#4B2E83",
      background: "#F5F0FF",
      icon: <PersonIcon fontSize="small" />,
    },
    ...steps.map((step) => {
      const preview = getStepPreview(step);
      return {
        key: `step-${step.order}`,
        eyebrow: `STEP ${step.order}`,
        title: preview.title,
        detail: preview.detail,
        color: "#1D4ED8",
        background: "#EFF6FF",
        icon: <PersonIcon fontSize="small" />,
      };
    }),
    {
      key: "active",
      eyebrow: "COMPLETE",
      title: "Project Active",
      detail: "All required approvals completed",
      color: "#047857",
      background: "#ECFDF5",
      icon: <ActiveIcon fontSize="small" />,
    },
  ];

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid #E2E8F0",
        borderRadius: 2,
        backgroundColor: "#F8FAFC",
      }}
    >
      <Typography variant="subtitle1" fontWeight={700}>
        Approval Flow Preview
      </Typography>
      <Typography variant="caption" color="text.secondary">
        A simplified presentation of how this project request moves through approval.
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          gap: { xs: 0.75, md: 1 },
          mt: 2,
          overflowX: { md: "auto" },
          pb: { md: 0.5 },
        }}
      >
        {nodes.map((node, index) => (
          <React.Fragment key={node.key}>
            <Box
              sx={{
                minWidth: { md: 150 },
                flex: { md: 1 },
                p: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${node.color}33`,
                backgroundColor: node.background,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Box sx={{ color: node.color, display: "flex", pt: 0.25 }}>
                  {node.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontSize: 9, fontWeight: 800, color: node.color, letterSpacing: 0.7 }}
                  >
                    {node.eyebrow}
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                    {node.title}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: "#475569", mt: 0.25 }}>
                    {node.detail}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            {index < nodes.length - 1 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94A3B8",
                  minWidth: { md: 20 },
                  height: { xs: 20, md: "auto" },
                }}
              >
                <ArrowForwardIcon
                  sx={{
                    fontSize: 20,
                    transform: { xs: "rotate(90deg)", md: "none" },
                  }}
                />
              </Box>
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
}

export default function ApprovalFlowForm({ flowId, onClose }: ApprovalFlowFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedFlow, loading } = useSelector(
    (state: RootState) => state.approvalFlow
  );
  const { canCreate, canUpdate } = usePermissions();
  const isEditMode = Boolean(flowId);
  const canSaveApprovalFlow = isEditMode
    ? canUpdate("settings_approval_flows")
    : canCreate("settings_approval_flows");

  const getInitialFormData = useCallback(() => ({
    name: "",
    description: "",
    isDefault: false,
    selfApprovalMode: "THROUGH_HIGHEST_STEP" as SelfApprovalMode,
    steps: [] as ApprovalStep[],
  }), []);

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
      roles.reduce((result, role) => {
        result[role.name] = role.id;
        return result;
      }, {} as Record<string, string>),
    [roles]
  );

  const getRoleOptionsForStep = (selectedRole: string) => {
    if (!selectedRole || roles.some((role) => role.name === selectedRole)) {
      return roles;
    }

    return [{ id: selectedRole, name: selectedRole }, ...roles];
  };

  const resetLocalState = useCallback(() => {
    setFormData(getInitialFormData());
    setErrors({});
    setSubmitError(null);
    setUsersByStepIndex({});
    setLoadingUsersByStepIndex({});
  }, [getInitialFormData]);

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
  }, [flowId, dispatch, resetLocalState]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles();
        const roleList: unknown[] = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];

        setRoles(
          roleList
            .filter(isRoleOption)
            .map((role) => ({ id: role.id, name: role.name }))
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
        approverSource: step.approverSource || "ROLE",
        stepExecutionMode: step.stepExecutionMode || "SEQUENTIAL",
        useSpecificUsers:
          step.approverSource === "SPECIFIC_USERS" || step.useSpecificUsers,
        assignedUsers: normalizeAssignedUsers(step.assignedUsers),
      }));

      setFormData({
        name: selectedFlow.name,
        description: selectedFlow.description || "",
        isDefault: selectedFlow.isDefault,
        selfApprovalMode:
          selectedFlow.selfApprovalMode || "THROUGH_HIGHEST_STEP",
        steps: normalizedSteps,
      });

      const preloadedUsers: Record<number, RoleUserOption[]> = {};
      normalizedSteps.forEach((step, index) => {
        if (step.useSpecificUsers && step.assignedUsers.length > 0) {
          preloadedUsers[index] = step.assignedUsers;
        }
      });
      setUsersByStepIndex(preloadedUsers);
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

    if (!formData.selfApprovalMode) {
      newErrors.selfApprovalMode = "Select how self-approval should be handled";
    }

    if (formData.steps.some((step) => !step.approverSource)) {
      newErrors.steps = "Select an approver assignment method for every step";
    } else if (
      formData.steps.some(
        (step) =>
          ["ROLE", "SPECIFIC_USERS"].includes(step.approverSource) && !step.role
      )
    ) {
      newErrors.steps = "Select an approver role for every Selected Role step";
    } else if (
      formData.steps.some(
        (step) =>
          step.approverSource === "SPECIFIC_USERS" &&
          (!step.assignedUsers || step.assignedUsers.length === 0)
      )
    ) {
      newErrors.steps = "Select at least one specific approver";
    } else if (
      new Set(formData.steps.map((step) => step.order)).size !==
      formData.steps.length
    ) {
      newErrors.steps = "Step orders must be unique";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddStep = () => {
    const newStep: ApprovalStep = {
      order: formData.steps.length + 1,
      approverSource: "PROJECT_BU_HEAD",
      role: "BU_HEAD",
      stepExecutionMode: "PARALLEL",
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

  const fetchUsersForStepRole = async (stepIndex: number, roleName?: string) => {
    const roleId = roleName ? roleIdByName[roleName] : undefined;
    if (!roleId) {
      setUsersByStepIndex((previous) => ({ ...previous, [stepIndex]: [] }));
      return;
    }

    setLoadingUsersByStepIndex((previous) => ({ ...previous, [stepIndex]: true }));
    try {
      const response = await getUsersByRole(roleId);
      setUsersByStepIndex((previous) => ({
        ...previous,
        [stepIndex]: Array.isArray(response?.data) ? response.data : [],
      }));
    } catch (error) {
      console.error("Failed to load users by role:", error);
      setUsersByStepIndex((previous) => ({ ...previous, [stepIndex]: [] }));
    } finally {
      setLoadingUsersByStepIndex((previous) => ({ ...previous, [stepIndex]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!canSaveApprovalFlow) return;
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
            selfApprovalMode: formData.selfApprovalMode,
            steps: formData.steps,
          })
        );
      } else {
        await dispatch(
          createFlow({
            name: formData.name,
            description: formData.description,
            isDefault: formData.isDefault,
            selfApprovalMode: formData.selfApprovalMode,
            steps: formData.steps,
          })
        );
      }

      handleCloseModal();
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err, "Failed to save flow"));
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
              placeholder="e.g., Business Unit Approval"
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

            <FormControl error={!!errors.selfApprovalMode}>
              <FormLabel sx={{ fontWeight: 700, color: "text.primary", mb: 0.75 }}>
                When the requester is also an approver
              </FormLabel>
              <RadioGroup
                value={formData.selfApprovalMode}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    selfApprovalMode: event.target.value as SelfApprovalMode,
                  })
                }
              >
                {selfApprovalOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: "flex-start", mb: 0.5 }}
                  />
                ))}
              </RadioGroup>
              {errors.selfApprovalMode && (
                <Typography variant="caption" color="error">
                  {errors.selfApprovalMode}
                </Typography>
              )}
            </FormControl>

            <ApprovalFlowPreview steps={formData.steps} />

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
                            <Typography sx={{ flex: 1, fontWeight: 700 }}>
                              Step {step.order}
                            </Typography>

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
                              <FormLabel sx={{ fontWeight: 700, color: "text.primary", mb: 0.75 }}>
                                Approver Assignment
                              </FormLabel>
                              <RadioGroup
                                value={
                                  step.approverSource === "SPECIFIC_USERS"
                                    ? "ROLE"
                                    : step.approverSource
                                }
                                onChange={(event) => {
                                  const source = event.target.value as Exclude<
                                    ApproverSource,
                                    "SPECIFIC_USERS"
                                  >;
                                  handleUpdateStep(index, {
                                    approverSource: source,
                                    role:
                                      source === "PROJECT_BU_HEAD"
                                        ? "BU_HEAD"
                                        : source === "ROLE"
                                          ? step.role === "BU_HEAD"
                                            ? undefined
                                            : step.role
                                          : undefined,
                                    useSpecificUsers: false,
                                    assignedUsers: [],
                                  });
                                }}
                              >
                                {approverSourceOptions.map((option) => (
                                  <FormControlLabel
                                    key={option.value}
                                    value={option.value}
                                    control={<Radio />}
                                    label={
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {option.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {option.description}
                                        </Typography>
                                      </Box>
                                    }
                                    sx={{ alignItems: "flex-start" }}
                                  />
                                ))}
                              </RadioGroup>
                            </FormControl>

                            {step.approverSource === "PROJECT_BU_HEAD" && (
                              <Alert severity="info" sx={{ mt: 1 }}>
                                The approver will be determined when the project is submitted.
                              </Alert>
                            )}

                            {step.approverSource === "REQUESTER_BU_HEAD" && (
                              <Alert severity="info" sx={{ mt: 1 }}>
                                The approver will be determined from the project requester&apos;s Business Unit when the project is submitted.
                              </Alert>
                            )}

                            {["ROLE", "SPECIFIC_USERS"].includes(step.approverSource) && (
                              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                                <FormControl fullWidth>
                                  <InputLabel>Role</InputLabel>
                                  <Select
                                    value={step.role || ""}
                                    onChange={(event) => {
                                      handleUpdateStep(index, {
                                        role: event.target.value,
                                        assignedUsers: [],
                                      });
                                      if (step.approverSource === "SPECIFIC_USERS") {
                                        fetchUsersForStepRole(index, event.target.value);
                                      }
                                    }}
                                    label="Role"
                                  >
                                    {roles.length === 0 ? (
                                      <MenuItem disabled>No roles available</MenuItem>
                                    ) : (
                                      getRoleOptionsForStep(step.role || "").map((role) => (
                                        <MenuItem key={role.id} value={role.name}>
                                          {role.name}
                                        </MenuItem>
                                      ))
                                    )}
                                  </Select>
                                </FormControl>

                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={step.approverSource === "SPECIFIC_USERS"}
                                      onChange={(event) => {
                                        const specific = event.target.checked;
                                        handleUpdateStep(index, {
                                          approverSource: specific ? "SPECIFIC_USERS" : "ROLE",
                                          useSpecificUsers: specific,
                                          assignedUsers: [],
                                        });
                                        if (specific) {
                                          fetchUsersForStepRole(index, step.role);
                                        }
                                      }}
                                    />
                                  }
                                  label="Select specific approvers from this role"
                                />

                                {step.approverSource === "SPECIFIC_USERS" && (
                                  <FormControl fullWidth size="small">
                                    <InputLabel id={`step-users-label-${index}`}>
                                      Specific Approvers
                                    </InputLabel>
                                    <Select
                                      labelId={`step-users-label-${index}`}
                                      multiple
                                      label="Specific Approvers"
                                      value={(step.assignedUsers || []).map(
                                        (user) => (user as RoleUserOption).id
                                      )}
                                      onOpen={() => fetchUsersForStepRole(index, step.role)}
                                      onChange={(event) => {
                                        const ids = event.target.value as string[];
                                        const availableUsers = usersByStepIndex[index] || [];
                                        handleUpdateStep(index, {
                                          assignedUsers: ids
                                            .map((id) =>
                                              availableUsers.find((user) => user.id === id)
                                            )
                                            .filter(Boolean) as RoleUserOption[],
                                        });
                                      }}
                                      renderValue={(selected) =>
                                        (selected as string[])
                                          .map((id) => {
                                            const selectedUsers =
                                              (step.assignedUsers || []) as RoleUserOption[];
                                            const user =
                                              (usersByStepIndex[index] || []).find(
                                                (candidate) => candidate.id === id
                                              ) ||
                                              selectedUsers.find(
                                                (candidate) => candidate.id === id
                                              );
                                            return user?.name || user?.email || id;
                                          })
                                          .join(", ")
                                      }
                                    >
                                      {loadingUsersByStepIndex[index] ? (
                                        <MenuItem disabled>
                                          <CircularProgress size={16} sx={{ mr: 1 }} />
                                          Loading users...
                                        </MenuItem>
                                      ) : (usersByStepIndex[index] || []).length === 0 ? (
                                        <MenuItem disabled>
                                          No active users found for this role
                                        </MenuItem>
                                      ) : (
                                        (usersByStepIndex[index] || []).map((user) => (
                                          <MenuItem key={user.id} value={user.id}>
                                            <MuiCheckbox
                                              checked={(
                                                (step.assignedUsers || []) as RoleUserOption[]
                                              ).some((selectedUser) => selectedUser.id === user.id)}
                                            />
                                            <Box>
                                              <Typography variant="body2" fontWeight={600}>
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
                                      Only selected active users from {step.role || "this role"} will approve.
                                    </FormHelperText>
                                  </FormControl>
                                )}

                                {step.approverSource === "SPECIFIC_USERS" &&
                                  ((step.assignedUsers || []) as RoleUserOption[]).length > 0 && (
                                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                      {((step.assignedUsers || []) as RoleUserOption[]).map((user) => (
                                        <Chip
                                          key={user.id}
                                          label={user.name || user.email || user.id}
                                          size="small"
                                          onDelete={() =>
                                            handleUpdateStep(index, {
                                              assignedUsers: (
                                                (step.assignedUsers || []) as RoleUserOption[]
                                              ).filter((selectedUser) => selectedUser.id !== user.id),
                                            })
                                          }
                                        />
                                      ))}
                                    </Box>
                                  )}
                              </Stack>
                            )}
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
        {canSaveApprovalFlow && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isDisabled}
          >
            {saving ? <CircularProgress size={24} /> : "Save Flow"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
