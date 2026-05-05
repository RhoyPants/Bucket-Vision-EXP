"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Backdrop,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { useRouter } from "next/navigation";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  getProjectFull,
  updateProject,
} from "@/app/redux/controllers/projectController";
import {
  createScope,
  updateScope,
  deleteScope,
} from "@/app/redux/controllers/scopeController";
import {
  createTask,
  updateTask,
  deleteTask,
} from "@/app/redux/controllers/taskController";
import {
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from "@/app/redux/controllers/subTaskController";
import { submitProjectForApproval } from "@/app/redux/controllers/approvalController";
import ProjectTeamPanel from "@/app/(pages)/projects/[id]/setup/components/ProjectTeamPanel";
import ScopeForm from "@/app/(pages)/projects/[id]/setup/components/ScopeForm";
import ScopeList from "@/app/(pages)/projects/[id]/setup/components/ScopeList";

const WIZARD_STEPS = ["Team Management", "Project Structure", "Review & Submit"];

interface ProjectSetupWizardProps {
  projectId: string;
  initialStep?: number;
  initialData?: any;
}

export default function ProjectSetupWizard({
  projectId,
  initialStep = 0,
  initialData,
}: ProjectSetupWizardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { members } = useAppSelector((state) => state.user);

  // WIZARD STATE
  const [activeStep, setActiveStep] = useState(initialStep);
  const [project, setProject] = useState<any>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);

  // SCOPE STATE
  const [scopeForm, setScopeForm] = useState({ name: "", budgetAllocated: "" });
  const [scopeEdit, setScopeEdit] = useState<any>(null);

  // TASK STATE
  const [taskInputs, setTaskInputs] = useState<Record<string, any>>({});

  // SUBTASK STATE
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, any>>({});

  // DIALOG STATE
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  // FETCH PROJECT
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await dispatch(getProjectFull(projectId));
        setProject(data);
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && !initialData) {
      fetchProject();
    }
  }, [projectId, dispatch]);

  // REFRESH PROJECT AFTER CHANGES
  const refreshProject = async () => {
    const data = await dispatch(getProjectFull(projectId));
    setProject(data);
  };

  // ===========================
  // SCOPE HANDLERS
  // ===========================
  const handleAddScope = async () => {
    if (!scopeForm.name.trim()) {
      alert("Scope name is required");
      return;
    }

    try {
      setSaving(true);
      const projectBudget = project?.totalBudget || 0;
      const budget = Number(scopeForm.budgetAllocated) || 0;
      const percent = projectBudget > 0 ? (budget / projectBudget) * 100 : 0;

      await dispatch(
        createScope({
          name: scopeForm.name,
          projectId,
          budgetAllocated: budget,
          budgetPercent: percent,
          order: project.scopes?.length || 0,
        })
      );

      setScopeForm({ name: "", budgetAllocated: "" });
      await refreshProject();
    } catch (error) {
      console.error("Error creating scope:", error);
      alert("Failed to create scope");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateScope = async () => {
    if (!scopeEdit?.name.trim()) {
      alert("Scope name is required");
      return;
    }

    try {
      setSaving(true);
      await dispatch(
        updateScope(scopeEdit.id, {
          name: scopeEdit.name,
          budgetAllocated: Number(scopeEdit.budgetAllocated),
        })
      );
      setScopeEdit(null);
      await refreshProject();
    } catch (error) {
      console.error("Error updating scope:", error);
      alert("Failed to update scope");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScope = async (scopeId: string) => {
    if (window.confirm("Delete this scope and all tasks?")) {
      try {
        setSaving(true);
        await dispatch(deleteScope(scopeId));
        await refreshProject();
      } catch (error) {
        console.error("Error deleting scope:", error);
        alert("Failed to delete scope");
      } finally {
        setSaving(false);
      }
    }
  };

  // ===========================
  // TASK HANDLERS
  // ===========================
  const handleAddTask = async (scopeId: string) => {
    const data = taskInputs[scopeId];
    if (!data?.title) {
      alert("Task title is required");
      return;
    }

    try {
      setSaving(true);
      const scope = project.scopes.find((s: any) => s.id === scopeId);
      const percent =
        scope?.budgetAllocated > 0
          ? (data.budgetAllocated / scope.budgetAllocated) * 100
          : 0;

      await dispatch(
        createTask({
          title: data.title,
          description: data.description || "",
          scopeId,
          budgetAllocated: Number(data.budgetAllocated) || 0,
          budgetPercent: percent,
        })
      );

      setTaskInputs((prev) => ({ ...prev, [scopeId]: {} }));
      await refreshProject();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      setSaving(true);
      const scope = project.scopes.find((s: any) =>
        s.tasks?.find((t: any) => t.id === taskId)
      );

      const percent =
        scope?.budgetAllocated > 0
          ? (updates.budgetAllocated / scope.budgetAllocated) * 100
          : 0;

      await dispatch(
        updateTask(taskId, {
          title: updates.title,
          description: updates.description || "",
          budgetAllocated: Number(updates.budgetAllocated) || 0,
          budgetPercent: percent,
        })
      );
      await refreshProject();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Delete this task and all subtasks?")) {
      try {
        setSaving(true);
        await dispatch(deleteTask(taskId));
        await refreshProject();
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task");
      } finally {
        setSaving(false);
      }
    }
  };

  // ===========================
  // SUBTASK HANDLERS
  // ===========================
  const handleAddSubtask = async (taskId: string) => {
    const data = subtaskInputs[taskId];
    if (!data?.title) {
      alert("Subtask title is required");
      return;
    }

    try {
      setSaving(true);
      const parentTask = project.scopes
        .flatMap((s: any) => s.tasks || [])
        .find((t: any) => t.id === taskId);

      const percent =
        parentTask?.budgetAllocated > 0
          ? (data.budgetAllocated / parentTask.budgetAllocated) * 100
          : 0;

      await dispatch(
        createSubtask(
          {
            title: data.title,
            description: data.description || "",
            priority: data.priority || "Medium",
            taskId,
            projectedStartDate: data.projectedStartDate || "",
            projectedEndDate: data.projectedEndDate || "",
            budgetAllocated: Number(data.budgetAllocated) || 0,
            budgetPercent: percent,
            remarks: data.remarks || "",
            userIds: data.users?.map((u: any) => u.id || u.userId) || [],
          },
          taskId
        )
      );

      setSubtaskInputs((prev) => ({ ...prev, [taskId]: {} }));
      await refreshProject();
    } catch (error) {
      console.error("Error creating subtask:", error);
      alert("Failed to create subtask");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSubtask = async (id: string, taskId: string) => {
    const data = subtaskInputs[taskId];

    try {
      setSaving(true);
      const parentTask = project.scopes
        .flatMap((s: any) => s.tasks || [])
        .find((t: any) => t.id === taskId);

      const percent =
        parentTask?.budgetAllocated > 0
          ? (data.budgetAllocated / parentTask.budgetAllocated) * 100
          : 0;

      await dispatch(
        updateSubtask(id, {
          title: data.title,
          description: data.description || "",
          priority: data.priority,
          budgetAllocated: Number(data.budgetAllocated) || 0,
          budgetPercent: percent,
          projectedStartDate: data.projectedStartDate,
          projectedEndDate: data.projectedEndDate,
          remarks: data.remarks || "",
          userIds: data.users?.map((u: any) => u.id || u.userId) || [],
        })
      );

      setSubtaskInputs((prev) => ({ ...prev, [taskId]: {} }));
      await refreshProject();
    } catch (error) {
      console.error("Error updating subtask:", error);
      alert("Failed to update subtask");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubtask = async (id: string, taskId: string) => {
    if (window.confirm("Delete this subtask?")) {
      try {
        setSaving(true);
        await dispatch(deleteSubtask(id, taskId));
        await refreshProject();
      } catch (error) {
        console.error("Error deleting subtask:", error);
        alert("Failed to delete subtask");
      } finally {
        setSaving(false);
      }
    }
  };

  // ===========================
  // WIZARD ACTIONS
  // ===========================
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      await dispatch(
        updateProject(projectId, {
          status: "DRAFT",
        })
      );
      alert("✅ Project saved as draft");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    // Validate project structure
    if (!project.scopes || project.scopes.length === 0) {
      setSubmitMessage(
        "⚠️ Project must have at least one scope to submit for approval"
      );
      return;
    }

    const hasNoTasks = project.scopes.some(
      (s: any) => !s.tasks || s.tasks.length === 0
    );
    if (hasNoTasks) {
      setSubmitMessage(
        "⚠️ All scopes must have at least one task to submit for approval"
      );
      return;
    }

    try {
      setSaving(true);

      // Submit project for approval
      await dispatch(submitProjectForApproval(projectId));

      setSubmitMessage("✅ Project submitted for approval!");
      setSubmitConfirm(false);
      setTimeout(() => {
        router.push("/projects");
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting project:", error);
      setSubmitMessage(
        `❌ Error: ${error.message || "Failed to submit project"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (activeStep === WIZARD_STEPS.length - 1) {
      // Final step - trigger submit dialog
      setSubmitConfirm(true);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "600px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Alert severity="error">
        Failed to load project. Please try again.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      {/* WIZARD STEPPER */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {WIZARD_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* PROJECT HEADER */}
      <Card sx={{ mb: 3, backgroundColor: "#f3f4f6" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Typography variant="h6" fontWeight={700}>
                {project.name}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#666", mt: 0.5 }}>
                PIN: {project.pin} | Budget: ₱{project.totalBudget?.toLocaleString()}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#666", mt: 0.5 }}>
                📅 {project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"} - {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : "N/A"}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: 12,
                px: 2,
                py: 1,
                backgroundColor: "#fef3c7",
                borderRadius: 1,
                fontWeight: 600,
                color: "#92400e",
              }}
            >
              {project.status || "DRAFT"}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* STEP CONTENT */}
      <Box sx={{ minHeight: "500px" }}>
        {/* STEP 0: TEAM MANAGEMENT */}
        {activeStep === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                👥 Team Management
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#666", mb: 3 }}>
                Add sub-owners and team members to manage this project
              </Typography>
              <ProjectTeamPanel projectId={projectId} />
            </CardContent>
          </Card>
        )}

        {/* STEP 1: PROJECT STRUCTURE */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" fontWeight={700} mb={3}>
              📊 Project Structure
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#666", mb: 3 }}>
              Create scopes, tasks, and subtasks for your project
            </Typography>

            {/* Scope Input */}
            <ScopeForm
              scopeForm={scopeForm}
              setScopeForm={setScopeForm}
              onAddScope={handleAddScope}
              projectBudget={project?.totalBudget || 0}
              existingScopes={project?.scopes || []}
            />

            <Divider sx={{ my: 3 }} />

            {/* Scope List with Tasks & Subtasks */}
            <ScopeList
              scopes={[...(project?.scopes || [])].sort((a: any, b: any) => {
                const orderA = a.order ?? 0;
                const orderB = b.order ?? 0;
                return orderA - orderB;
              })}
              scopeEdit={scopeEdit}
              setScopeEdit={setScopeEdit}
              taskInputs={taskInputs}
              setTaskInputs={setTaskInputs}
              subtaskInputs={subtaskInputs}
              setSubtaskInputs={setSubtaskInputs}
              members={members}
              projectId={projectId}
              onEditScope={(scope: any) => setScopeEdit(scope)}
              onDeleteScope={handleDeleteScope}
              onUpdateScope={handleUpdateScope}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onAddSubtask={handleAddSubtask}
              onUpdateSubtask={handleUpdateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              onEditSubtask={(sub: any, taskId: string) => {
                setSubtaskInputs((prev) => ({
                  ...prev,
                  [taskId]: {
                    editId: sub.id,
                    title: sub.title,
                    description: sub.description || "",
                    priority: sub.priority || "",
                    budgetAllocated: sub.budgetAllocated,
                    projectedStartDate: sub.projectedStartDate || "",
                    projectedEndDate: sub.projectedEndDate || "",
                    remarks: sub.remarks || "",
                    users: sub.assignees?.map((a: any) => a.user) || [],
                  },
                }));
              }}
            />
          </Box>
        )}

        {/* STEP 2: REVIEW & SUBMIT */}
        {activeStep === 2 && (
          <Stack spacing={3}>
            <Card sx={{ backgroundColor: "#f0fdf4", borderLeft: "4px solid #22c55e" }}>
              <CardContent>
                <Stack direction="row" spacing={2}>
                  <CheckCircleIcon sx={{ color: "#22c55e", fontSize: 28 }} />
                  <Box>
                    <Typography fontWeight={700}>Setup Complete!</Typography>
                    <Typography sx={{ fontSize: 13, color: "#666", mt: 0.5 }}>
                      Review your project structure and click Submit to send for approval
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* PROJECT SUMMARY */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  📋 Project Summary
                </Typography>

                <Stack spacing={2}>
                  <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: 12, color: "#666" }}>
                      NAME
                    </Typography>
                    <Typography fontWeight={600}>{project.name}</Typography>
                  </Box>

                  <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: 12, color: "#666" }}>
                      DESCRIPTION
                    </Typography>
                    <Typography>{project.description || "—"}</Typography>
                  </Box>

                  <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: 12, color: "#666" }}>
                      TOTAL BUDGET
                    </Typography>
                    <Typography fontWeight={600}>
                      ₱{project.totalBudget?.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: 12, color: "#666" }}>
                      TEAM MEMBERS
                    </Typography>
                    <Typography>
                      {project._count?.projectMembers || 0} member(s)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#666" }}>
                      SCOPES & TASKS
                    </Typography>
                    <Typography>
                      {project.scopes?.length || 0} scope(s) with{" "}
                      {project.scopes?.reduce(
                        (sum: number, s: any) => sum + (s.tasks?.length || 0),
                        0
                      ) || 0} task(s)
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* STATUS MESSAGE */}
            {submitMessage && (
              <Alert
                severity={submitMessage.includes("✅") ? "success" : "warning"}
              >
                {submitMessage}
              </Alert>
            )}
          </Stack>
        )}
      </Box>

      {/* WIZARD NAVIGATION */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 4,
          pt: 3,
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={activeStep === 0 || saving}
        >
          Back
        </Button>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSaveDraft}
            disabled={saving}
          >
            Save as Draft
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            disabled={saving}
          >
            {activeStep === WIZARD_STEPS.length - 1
              ? "Submit for Approval"
              : "Next"}
          </Button>
        </Stack>
      </Box>

      {/* SUBMIT CONFIRMATION DIALOG */}
      <Dialog
        open={submitConfirm}
        onClose={() => {
          setSubmitConfirm(false);
          setSubmitMessage("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📤 Submit Project for Approval?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Typography>
              Your project structure is complete. Once submitted, it will be reviewed by your Business Unit Head(s), then the Office of President for final approval.
            </Typography>

            <Alert severity="info">
              ℹ️ You can still edit the project while it's in review. The latest version submitted will be reviewed.
            </Alert>

            <Box sx={{ backgroundColor: "#f9fafb", p: 2, borderRadius: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1 }}>
                PROJECT DETAILS:
              </Typography>
              <Typography sx={{ fontSize: 12 }}>
                • Name: <strong>{project.name}</strong>
              </Typography>
              <Typography sx={{ fontSize: 12 }}>
                • Scopes: <strong>{project.scopes?.length}</strong>
              </Typography>
              <Typography sx={{ fontSize: 12 }}>
                • Tasks: 
                <strong>
                  {project.scopes?.reduce(
                    (sum: number, s: any) => sum + (s.tasks?.length || 0),
                    0
                  )}
                </strong>
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ pt: 2 }}>
          <Button
            onClick={() => {
              setSubmitConfirm(false);
              setSubmitMessage("");
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitForApproval}
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SUBMISSION LOADING MODAL */}
      <Backdrop
        open={saving && submitConfirm === false && (submitMessage.includes("submitted") || !submitMessage)}
        sx={{
          color: "#fff",
          zIndex: 1400,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        }}
      >
        <Stack alignItems="center" gap={3}>
          <CircularProgress color="inherit" size={60} />
          <Typography fontWeight={600} fontSize={18}>
            Submitting Project for Approval...
          </Typography>
          <Typography fontSize={14} color="rgba(255, 255, 255, 0.8)">
            Please wait while we process your submission
          </Typography>
        </Stack>
      </Backdrop>
    </Box>
  );
}
