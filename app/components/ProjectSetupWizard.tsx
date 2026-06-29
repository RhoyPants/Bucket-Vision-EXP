"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Grid,
  Chip as MuiChip,
  IconButton,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { useRouter } from "next/navigation";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import {
  getProjectFull,
  updateProject,
  createProject,
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
import { getEngagedUsers, getProjectMembers } from "@/app/redux/controllers/projectMemberController";
import { submitProjectForApproval } from "@/app/redux/controllers/approvalController";
import {
  validateProjectForm,
  hasFieldError,
  getFieldError,
} from "@/app/utils/projectValidation";
import { formatBudget } from "@/app/utils/formatters";
import ProjectTeamPanel from "@/app/(pages)/projects/[id]/setup/components/ProjectTeamPanel";
import ScopeForm from "@/app/(pages)/projects/[id]/setup/components/ScopeForm";
import ScopeList from "@/app/(pages)/projects/[id]/setup/components/ScopeList";
import CreateProject from "@/app/(pages)/projects/components/CreateProject";
import {
  getAllRegions,
  getProvincesByRegion,
  getCitiesByProvince,
  getBarangaysByCity,
} from "@/app/api-service/geographicalService";
import {
  getBusinessUnitsDropdown,
} from "@/app/api-service/businessUnitService";
import {
  deleteAttachment,
  getAttachmentFileName,
  getAttachmentFileUrl,
  getProjectAttachments,
  uploadAttachments,
} from "@/app/api-service/attachmentService";


const WIZARD_STEPS = ["Create Project", "Team Management", "Project Structure", "Confirmation & Summary"];

interface ProjectSetupWizardProps {
  projectId?: string;
  initialStep?: number;
  initialData?: any;
  mode?: "create" | "edit";
}

export default function ProjectSetupWizard({
  projectId,
  initialStep = 0,
  initialData,
  mode = "edit",
}: ProjectSetupWizardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { members } = useAppSelector((state) => state.user);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(projectId);

  // WIZARD STATE
  const [activeStep, setActiveStep] = useState(initialStep);
  const [project, setProject] = useState<any>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData && !!projectId);
  const [saving, setSaving] = useState(false);
  const isCreatingNew = mode === "create" || !currentProjectId;
  const activeStepRef = useRef(initialStep);

  // ===== PROJECT FORM STATE =====
  const [projectForm, setProjectForm] = useState<any>({
    name: "",
    description: "",
    location: {
      regionCode: "",
      regionName: "",
      provinceCode: "",
      provinceName: "",
      cityCode: "",
      cityName: "",
      barangayCode: "",
      barangayName: "",
      street: "",
    },
    businessUnit: "",
    entity: "",
    startDate: "",
    expectedEndDate: "",
    pin: "",
    priority: "Medium",
    totalBudget: 0,
  });
  const [projectErrors, setProjectErrors] = useState<any[]>([]);
  const [projectTouched, setProjectTouched] = useState<Record<string, boolean>>({});
  const [regions, setRegions] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);
  const [businessUnits, setBusinessUnits] = useState<any[]>([]);
  const [entities, setEntities] = useState<string[]>(["GVI", "GVE", "HULMA"]);
  const isHydratingLocationRef = useRef(false);

  // ===== WORK SCHEDULE STATE =====
  const [workSchedule, setWorkSchedule] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    includeGlobalHolidays: true,
  });

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
  const [submitSuccessOpen, setSubmitSuccessOpen] = useState(false);
  const [draftSuccessOpen, setDraftSuccessOpen] = useState(false);
  const [projectAttachmentFiles, setProjectAttachmentFiles] = useState<File[]>([]);
  const [projectAttachments, setProjectAttachments] = useState<any[]>([]);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [attachmentLimitDialogOpen, setAttachmentLimitDialogOpen] = useState(false);
  const [attachmentLimitDialogMessage, setAttachmentLimitDialogMessage] = useState("");

  // GET PROJECT MEMBERS FROM REDUX
  const { projectMembers } = useAppSelector((state) => state.projectMembers);

  // FETCH PROJECT (if editing)
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await dispatch(getProjectFull(currentProjectId!));
        setProject(data);
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentProjectId && !initialData) {
      fetchProject();
    }
  }, [currentProjectId, initialData, dispatch]);

  useEffect(() => {
    setCurrentProjectId(projectId);
  }, [projectId]);

  // FETCH PROJECT MEMBERS FROM REDUX
  useEffect(() => {
    if (currentProjectId) {
      dispatch(getProjectMembers(currentProjectId) as any);
    }
  }, [currentProjectId, dispatch]);

  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  useEffect(() => {
    if (!project) return;

    isHydratingLocationRef.current = true;

    setProjectForm({
      name: project.name || "",
      description: project.description || "",
      location: {
        regionCode: project.location?.regionCode || "",
        regionName: project.location?.regionName || "",
        provinceCode: project.location?.provinceCode || "",
        provinceName: project.location?.provinceName || "",
        cityCode: project.location?.cityCode || "",
        cityName: project.location?.cityName || "",
        barangayCode: project.location?.barangayCode || "",
        barangayName: project.location?.barangayName || "",
        street: project.location?.street || "",
      },
      businessUnit: project.businessUnit || "",
      entity: project.entity || "",
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      expectedEndDate: project.expectedEndDate
        ? project.expectedEndDate.split("T")[0]
        : "",
      pin: project.pin || "",
      priority: project.priority || "Medium",
      totalBudget: project.totalBudget || 0,
    });

    setWorkSchedule({
      monday: project.monday ?? true,
      tuesday: project.tuesday ?? true,
      wednesday: project.wednesday ?? true,
      thursday: project.thursday ?? true,
      friday: project.friday ?? true,
      saturday: project.saturday ?? false,
      sunday: project.sunday ?? false,
      includeGlobalHolidays:
        project.includeHolidays ?? project.includeGlobalHolidays ?? false,
    });

    const hydrateLocationHierarchy = async () => {
      try {
        // Location dropdown hierarchy is only needed on Step 0 (Create Project).
        if (activeStepRef.current !== 0) return;

        if (project.location?.regionCode) {
          const provinceRes = await getProvincesByRegion(project.location.regionCode);
          setProvinces(provinceRes || []);
        }

        if (project.location?.provinceCode) {
          const cityRes = await getCitiesByProvince(project.location.provinceCode);
          setCities(cityRes || []);
        }

        if (project.location?.cityCode) {
          const brgyRes = await getBarangaysByCity(project.location.cityCode);
          setBarangays(brgyRes || []);
        }
      } catch (err) {
        console.error("Failed location hydration", err);
      } finally {
        isHydratingLocationRef.current = false;
      }
    };

    hydrateLocationHierarchy();
  }, [project]);

  const refreshProjectAttachments = useCallback(async (projectIdArg?: string) => {
    const id = projectIdArg || currentProjectId;
    if (!id) return;

    try {
      const attachments = await getProjectAttachments(id);
      setProjectAttachments(Array.isArray(attachments) ? attachments : []);
    } catch (error) {
      console.error("Error loading project attachments:", error);
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (!currentProjectId) return;
    void refreshProjectAttachments(currentProjectId);
  }, [currentProjectId, refreshProjectAttachments]);

  // Load regions from backend
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const data = await getAllRegions();
        setRegions(data);
      } catch (err) {
        console.error("Failed to load regions:", err);
      }
    };
    loadRegions();
  }, []);

  // Load business units from backend
  useEffect(() => {
    const loadBusinessUnits = async () => {
      try {
        const data = await getBusinessUnitsDropdown();
        setBusinessUnits(data);
      } catch (err) {
        console.error("Failed to load business units:", err);
      }
    };
    loadBusinessUnits();
  }, []);

  // Load provinces when region code changes
  useEffect(() => {
    if (activeStep !== 0) return;
    if (isHydratingLocationRef.current) return;
    if (!projectForm.location.regionCode) return;
    const loadProvinces = async () => {
      try {
        const data = await getProvincesByRegion(projectForm.location.regionCode);
        setProvinces(data);
        setCities([]);
        setBarangays([]);
      } catch (err) {
        console.error("Failed to load provinces:", err);
      }
    };
    loadProvinces();
  }, [activeStep, projectForm.location.regionCode]);

  // Load cities when province changes
  useEffect(() => {
    if (activeStep !== 0) return;
    if (isHydratingLocationRef.current) return;
    if (!projectForm.location.provinceCode) return;
    const loadCities = async () => {
      try {
        const data = await getCitiesByProvince(projectForm.location.provinceCode);
        setCities(data);
        setBarangays([]);
      } catch (err) {
        console.error("Failed to load cities:", err);
      }
    };
    loadCities();
  }, [activeStep, projectForm.location.provinceCode]);

  // Load barangays when city changes
  useEffect(() => {
    if (activeStep !== 0) return;
    if (isHydratingLocationRef.current) return;
    if (!projectForm.location.cityCode) return;
    const loadBarangays = async () => {
      try {
        const data = await getBarangaysByCity(projectForm.location.cityCode);
        setBarangays(data);
      } catch (err) {
        console.error("Failed to load barangays:", err);
      }
    };
    loadBarangays();
  }, [activeStep, projectForm.location.cityCode]);

  // Load engaged users once when entering Project Structure step.
  useEffect(() => {
    if (activeStep === 2 && currentProjectId) {
      dispatch(getEngagedUsers(currentProjectId) as any);
    }
  }, [activeStep, currentProjectId, dispatch]);

  // Auto-redirect when draft is saved
  useEffect(() => {
    if (draftSuccessOpen) {
      const timer = setTimeout(() => {
        router.push("/projects");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [draftSuccessOpen, router]);

  // REFRESH PROJECT AFTER CHANGES
  const refreshProject = useCallback(async () => {
    if (!currentProjectId) return;
    const data = await dispatch(getProjectFull(currentProjectId));
    setProject(data);
  }, [currentProjectId, dispatch]);

  // Field blur handler for project form
  const handleProjectFieldBlur = (fieldName: string) => {
    setProjectTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  // ===========================
  // SCOPE HANDLERS
  // ===========================
  const handleAddScope = useCallback(async () => {
    if (!scopeForm.name.trim()) {
      alert("Scope name is required");
      return;
    }

    if (!currentProjectId) {
      alert("Project must be saved first");
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
          projectId: currentProjectId,
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
  }, [scopeForm, currentProjectId, project, dispatch, refreshProject]);

  const handleUpdateScope = useCallback(async () => {
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
  }, [scopeEdit, dispatch, refreshProject]);

  const handleDeleteScope = useCallback(async (scopeId: string) => {
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
  }, [dispatch, refreshProject]);

  // ===========================
  // TASK HANDLERS
  // ===========================
  const handleAddTask = useCallback(async (scopeId: string) => {
    const data = taskInputs[scopeId];
    if (!data?.title) {
      alert("Task title is required");
      return;
    }

    if (!currentProjectId) return;

    try {
      setSaving(true);
      const scope = project?.scopes.find((s: any) => s.id === scopeId);
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
          order: scope?.tasks?.length || 0,
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
  }, [taskInputs, currentProjectId, project, dispatch, refreshProject]);

  const handleUpdateTask = useCallback(async (taskId: string, updates: any) => {
    try {
      setSaving(true);
      const scope = project?.scopes.find((s: any) => 
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
  }, [project, dispatch, refreshProject]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
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
  }, [dispatch, refreshProject]);

  // ===========================
  // SUBTASK HANDLERS
  // ===========================
  const handleAddSubtask = useCallback(async (taskId: string) => {
    const data = subtaskInputs[taskId];
    if (!data?.title) {
      alert("Subtask title is required");
      return;
    }

    if (!currentProjectId) return;

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
  }, [subtaskInputs, currentProjectId, project, dispatch, refreshProject]);

  const handleUpdateSubtask = useCallback(async (id: string, taskId: string) => {
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
  }, [subtaskInputs, project, dispatch, refreshProject]);

  const handleDeleteSubtask = useCallback(async (id: string, taskId: string) => {
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
  }, [dispatch, refreshProject]);

  const sortedScopes = useMemo(() => {
    return [...(project?.scopes || [])].sort(
      (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
    );
  }, [project?.scopes]);

  // SAVE PROJECT DETAILS (called from project setup step)
  const handleSaveProjectDetails = async () => {
    const validation = validateProjectForm(projectForm);
    
    if (!validation.isValid) {
      setProjectErrors(validation.errors);
      const allTouched: Record<string, boolean> = {};
      validation.errors.forEach((err) => {
        allTouched[err.field] = true;
      });
      setProjectTouched(allTouched);
      return false;
    }

    try {
      setSaving(true);
      const payload = {
        ...projectForm,
        ...workSchedule,
      };
      delete (payload as any).attachments;

      if (isCreatingNew && !currentProjectId) {
        // Create new project
        const created = await dispatch(createProject(payload));
        const createdProject = created?.data ?? created;
        const createdId = createdProject?.id;

        if (!createdId) {
          throw new Error("Project was created but no ID was returned");
        }

        setCurrentProjectId(createdId);
        window.history.replaceState({}, "", `/projects/${createdId}/setup`);
        setProject(createdProject);

        if (projectAttachmentFiles.length > 0) {
          setAttachmentBusy(true);
          try {
            await uploadAttachments("projects", createdId, projectAttachmentFiles);
            setProjectAttachmentFiles([]);
          } finally {
            setAttachmentBusy(false);
          }
        }

        await refreshProjectAttachments(createdId);
      } else if (currentProjectId) {
        // Update existing project
        const updated = await dispatch(updateProject(currentProjectId, payload));
        if (updated) {
          setProject((prev: any) => ({
            ...(prev || {}),
            ...(updated || {}),
            attachments:
              updated?.attachments !== undefined
                ? updated.attachments
                : prev?.attachments,
          }));
        }

        if (projectAttachmentFiles.length > 0) {
          setAttachmentBusy(true);
          try {
            await uploadAttachments("projects", currentProjectId, projectAttachmentFiles);
            setProjectAttachmentFiles([]);
          } finally {
            setAttachmentBusy(false);
          }
        }

        // Do not block step transition on full refresh; run it in background.
        void refreshProject();
        void refreshProjectAttachments(currentProjectId);
      }
      
      setProjectErrors([]);
      return true;
    } catch (err: any) {
      setProjectErrors([
        {
          field: "submit",
          message: err?.message || "Failed to save project details",
        },
      ]);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!currentProjectId) {
      setSubmitMessage("❌ Error: Project not found");
      return;
    }

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
      await dispatch(submitProjectForApproval(currentProjectId));

      setSubmitMessage("");
      setSubmitConfirm(false);
      setSubmitSuccessOpen(true);
    } catch (error: any) {
      console.error("Error submitting project:", error);
      setSubmitMessage(
        `❌ Error: ${error.message || "Failed to submit project"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      if (currentProjectId) {
        await dispatch(updateProject(currentProjectId, { status: "DRAFT" }));
        setDraftSuccessOpen(true);
        setSaving(false);
      } else {
        setSubmitMessage("⚠️ Please save project details first");
        setSaving(false);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      setSubmitMessage("❌ Failed to save draft");
      setSaving(false);
    }
  };

  const handleProjectAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const selected = Array.from(inputEl.files || []);
    if (!selected.length) return;

    const MAX_ATTACHMENTS = 10;
    const uploadedCount = projectAttachments.length;
    let exceededLimit = false;

    const merged = [...projectAttachmentFiles];

    selected.forEach((f) => {
      const exists = merged.some(
        (m) => m.name === f.name && m.size === f.size && m.lastModified === f.lastModified,
      );
      if (!exists && uploadedCount + merged.length < MAX_ATTACHMENTS) {
        merged.push(f);
      } else if (!exists) {
        exceededLimit = true;
      }
    });

    setProjectAttachmentFiles(merged);

    if (exceededLimit) {
      const currentTotal = uploadedCount + merged.length;
      if (currentTotal >= MAX_ATTACHMENTS) {
        setAttachmentLimitDialogMessage("You already reached the maximum of 10 attachments for this project.");
      } else {
        setAttachmentLimitDialogMessage("Maximum 10 attachments allowed. Extra selected files were not added.");
      }
      setAttachmentLimitDialogOpen(true);
    }

    inputEl.value = "";
  };

  const removePendingProjectAttachment = (target: File) => {
    setProjectAttachmentFiles((prev) =>
      prev.filter(
        (f) => !(f.name === target.name && f.size === target.size && f.lastModified === target.lastModified),
      ),
    );
  };

  const handleDeleteProjectAttachment = async (att: any) => {
    if (!att?.id) return;

    try {
      setAttachmentBusy(true);
      await deleteAttachment("projects", att.id);
      await refreshProjectAttachments();
    } catch (error: any) {
      console.error("Error deleting project attachment:", error);
      setSubmitMessage(`❌ ${error?.response?.data?.message || "Failed to delete attachment"}`);
    } finally {
      setAttachmentBusy(false);
    }
  };

  const handleNext = async () => {
    // Step 0 (Create Project) requires save before moving forward
    if (activeStep === 0) {
      const success = await handleSaveProjectDetails();
      if (!success) return;
    }

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

  if (loading && currentProjectId) {
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

  if (loading === false && currentProjectId && !project && !isCreatingNew) {
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

      {/* PROJECT HEADER - Show if project exists */}
      {(project || projectForm.name) && (
        <Card sx={{ mb: 3, backgroundColor: "#f3f4f6" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Typography variant="h6" fontWeight={700}>
                  {projectForm.name || project?.name || "New Project"}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#666", mt: 0.5 }}>
                  PIN: {projectForm.pin || project?.pin || "—"} | Budget: ₱{formatBudget(projectForm.totalBudget || project?.totalBudget || 0)}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#666", mt: 0.5 }}>
                  📅 {projectForm.startDate ? new Date(projectForm.startDate).toLocaleDateString() : "—"} - {projectForm.expectedEndDate ? new Date(projectForm.expectedEndDate).toLocaleDateString() : "—"}
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
                {project?.status || "DRAFT"}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* STEP CONTENT */}
      <Box sx={{ minHeight: "500px" }}>
        {/* STEP 0: CREATE PROJECT (all fields + work schedule) */}
        {activeStep === 0 && (
          <Card>
            <CardContent>
              {projectErrors.length > 0 && projectErrors.some((e) => e.field === "submit") && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {projectErrors.find((e) => e.field === "submit")?.message}
                </Alert>
              )}
              <CreateProject
                form={projectForm}
                setForm={setProjectForm}
                workSchedule={workSchedule}
                setWorkSchedule={setWorkSchedule}
                errors={projectErrors}
                touched={projectTouched}
                onFieldBlur={handleProjectFieldBlur}
                regions={regions}
                provinces={provinces}
                cities={cities}
                barangays={barangays}
                businessUnits={businessUnits}
                entities={entities}
                attachmentsSection={
                  <Box
                    sx={{
                      backgroundColor: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: 2,
                      p: 2,
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, mb: 1 }}>
                      Project Attachments
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                      Upload supporting files (max 10 files, 50MB each)
                    </Typography>


                    <input
                      id="project-attachments-input"
                      type="file"
                      multiple
                      accept="*/*"
                      onChange={handleProjectAttachmentChange}
                      style={{ display: "none" }}
                      disabled={attachmentBusy}
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
                      <label htmlFor="project-attachments-input" style={{ width: "100%" }}>
                        <Button
                          component="span"
                          variant="outlined"
                          fullWidth
                          endIcon={<CloudUploadIcon />}
                          disabled={attachmentBusy}
                          sx={{
                            height: 56,
                            borderStyle: "dashed",
                            borderColor: "#cbd5e1",
                            color: "#374151",
                            justifyContent: "space-between",
                            px: 2,
                            textTransform: "none",
                            fontWeight: 500,
                            backgroundColor: "#fff",
                          }}
                        >
                          Select files to attach
                        </Button>
                      </label>
                    </Stack>

                    {projectAttachmentFiles.length > 0 && (
                      <Box
                        sx={{
                          mb: 2,
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                            md: "repeat(3, minmax(0, 1fr))",
                          },
                          gap: 1,
                          maxHeight: 220,
                          overflowY: "auto",
                          pr: 0.5,
                        }}
                      >
                        {projectAttachmentFiles.map((f) => (
                          <Box
                            key={`${f.name}-${f.size}-${f.lastModified}`}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              border: "1px solid #e5e7eb",
                              borderRadius: 1,
                              px: 1.25,
                              py: 1.25,
                              minHeight: 52,
                              gap: 1,
                            }}
                          >
                            <Typography sx={{ fontSize: 12, lineHeight: 1.3, wordBreak: "break-word" }}>
                              {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={attachmentBusy}
                              onClick={() => removePendingProjectAttachment(f)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {projectAttachments.length > 0 && (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                            md: "repeat(3, minmax(0, 1fr))",
                            lg: "repeat(4, minmax(0, 1fr))",
                          },
                          gap: 1,
                          maxHeight: 260,
                          overflowY: "auto",
                          pr: 0.5,
                        }}
                      >
                        {projectAttachments.map((att: any, idx: number) => (
                          <Box
                            key={att?.id || `${att?.fileName || "attachment"}-${idx}`}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              border: "1px solid #e5e7eb",
                              borderRadius: 1,
                              px: 1.25,
                              py: 1.25,
                              minHeight: 52,
                              backgroundColor: "#fff",
                            }}
                          >
                            <Button
                              variant="text"
                              startIcon={<DownloadIcon />}
                              href={getAttachmentFileUrl("projects", att)}
                              target="_blank"
                              sx={{
                                textTransform: "none",
                                justifyContent: "flex-start",
                                flex: 1,
                                minWidth: 0,
                                fontSize: 12,
                              }}
                            >
                              {getAttachmentFileName(att, `Attachment ${idx + 1}`)}
                            </Button>

                            {!!att?.id && (
                              <IconButton
                                color="error"
                                size="small"
                                disabled={attachmentBusy}
                                onClick={() => handleDeleteProjectAttachment(att)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                }
              />
            </CardContent>
          </Card>
        )}

        {/* STEP 1: TEAM MANAGEMENT */}
        {activeStep === 1 && (
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <PeopleIcon sx={{ color: "#6366f1" }} />
                <Typography variant="h6" fontWeight={700}>
                  Team Management
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 13, color: "#666", mb: 3 }}>
                Add sub-owners and team members to manage this project
              </Typography>
              {currentProjectId && <ProjectTeamPanel projectId={currentProjectId} />}
              {!currentProjectId && (
                <Alert severity="info">
                  Team members will be available to add after project details are saved.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: PROJECT STRUCTURE (scopes / tasks / subtasks) */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" fontWeight={700} mb={3} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AssignmentIcon /> Project Structure
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#666", mb: 3 }}>
              Define your project's scopes, tasks, and subtasks.
            </Typography>

            {/* PLACEHOLDER so the giant old block is replaced */}
            {/* Project structure section starts here */}
            {project && (
              <Box>
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
                  scopes={sortedScopes}
                  scopeEdit={scopeEdit}
                  setScopeEdit={setScopeEdit}
                  taskInputs={taskInputs}
                  setTaskInputs={setTaskInputs}
                  subtaskInputs={subtaskInputs}
                  setSubtaskInputs={setSubtaskInputs}
                  members={members}
                  projectId={currentProjectId!}
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

            {!project && (
              <Alert severity="info">
                Save project details in step 1 to proceed with defining the structure.
              </Alert>
            )}
          </Box>
        )}

        {/* STEP 3: CONFIRMATION & SUMMARY */}
        {activeStep === 3 && (
          <Stack spacing={2}>
            <Card sx={{ backgroundColor: "#f0fdf4", borderLeft: "4px solid #22c55e" }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" spacing={2}>
                  <CheckCircleIcon sx={{ color: "#22c55e", fontSize: 28 }} />
                  <Box>
                    <Typography fontWeight={700}>Setup Complete!</Typography>
                    <Typography sx={{ fontSize: 13, color: "#666", mt: 0.5 }}>
                      Review all your project details before submission for approval
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* COMPREHENSIVE SUMMARY */}
            <Grid container spacing={1.5}>
              {/* PROJECT DETAILS CARD */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                      📋 Project Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                          Name
                        </Typography>
                        <Typography fontWeight={600}>{projectForm.name || project?.name || "—"}</Typography>
                      </Box>

                      <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                          Code (PIN)
                        </Typography>
                        <Typography fontWeight={600}>{projectForm.pin || project?.pin || "—"}</Typography>
                      </Box>

                      <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                          Business Unit
                        </Typography>
                        <Typography>{projectForm.businessUnit || project?.businessUnit || "—"}</Typography>
                      </Box>

                      <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                          Entity
                        </Typography>
                        <Typography>{projectForm.entity || project?.entity || "—"}</Typography>
                      </Box>

                      <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                          Priority
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              bgcolor:
                                projectForm.priority === "High"
                                  ? "#ef4444"
                                  : projectForm.priority === "Medium"
                                    ? "#f59e0b"
                                    : "#10b981",
                            }}
                          />
                          <Typography fontWeight={600}>{projectForm.priority || project?.priority || "—"}</Typography>
                        </Box>
                      </Box>

                      <Box>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                          Total Budget
                        </Typography>
                        <Typography fontWeight={600}>
                          ₱{formatBudget(projectForm.totalBudget || project?.totalBudget || 0)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* TIMELINE & LOCATION CARD */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                      📍 Timeline & Location
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                          Start - End Date
                        </Typography>
                        <Typography fontWeight={600}>
                          {projectForm.startDate ? new Date(projectForm.startDate).toLocaleDateString() : "—"} →{" "}
                          {projectForm.expectedEndDate ? new Date(projectForm.expectedEndDate).toLocaleDateString() : "—"}
                        </Typography>
                      </Box>

                      <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                          Province
                        </Typography>
                        <Typography>{projectForm.location.provinceName || "—"}</Typography>
                      </Box>

                      <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                          City / Municipality
                        </Typography>
                        <Typography>{projectForm.location.cityName || "—"}</Typography>
                      </Box>

                      <Box sx={{ pb: 2, borderBottom: "1px solid #e5e7eb" }}>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                          Barangay
                        </Typography>
                        <Typography>{projectForm.location.barangayName || "—"}</Typography>
                      </Box>

                      <Box>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>
                          Street Address
                        </Typography>
                        <Typography>{projectForm.location.street || "—"}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* WORK SCHEDULE CARD */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                      📅 Work Schedule
                    </Typography>
                    <Stack spacing={2}>
                      {/* Day circles */}
                      <Box>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", mb: 1 }}>
                          Working Days
                        </Typography>
                        <Box display="flex" gap={0.75}>
                          {[
                            { key: "monday", label: "M" },
                            { key: "tuesday", label: "T" },
                            { key: "wednesday", label: "W" },
                            { key: "thursday", label: "T" },
                            { key: "friday", label: "F" },
                            { key: "saturday", label: "S" },
                            { key: "sunday", label: "S" },
                          ].map((d) => {
                            const active = workSchedule[d.key as keyof typeof workSchedule] as boolean;
                            return (
                              <Box
                                key={d.key}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  backgroundColor: active ? "#6366f1" : "#e5e7eb",
                                  color: active ? "#fff" : "#9ca3af",
                                }}
                              >
                                {d.label}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>

                      {/* Global holidays toggle */}
                      <Box sx={{ pt: 2, borderTop: "1px solid #e5e7eb" }}>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", mb: 1 }}>
                          Global Holidays
                        </Typography>
                        <MuiChip
                          label={workSchedule.includeGlobalHolidays ? "✓ Included in calculations" : "✗ Not included"}
                          color={workSchedule.includeGlobalHolidays ? "success" : "default"}
                          variant="outlined"
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* TEAM MEMBERS CARD */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                      👥 Team Members
                    </Typography>

                    <Box sx={{ maxHeight: 310, overflowY: "auto", pr: 0.5 }}>

                    {/* OWNERS */}
                    {projectMembers?.owner && projectMembers.owner.length > 0 && (
                      <Box mb={2.5}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#dc2626", mb: 1 }}>
                          Owner
                        </Typography>
                        <Stack spacing={1}>
                          {projectMembers.owner.map((member: any) => (
                            <Box key={member.id} sx={{ p: 1.5, backgroundColor: "#fee2e2", borderRadius: 1, borderLeft: "3px solid #dc2626" }}>
                              <Typography fontWeight={600} sx={{ fontSize: "0.9rem" }}>
                                {member.user?.name || member.name || "Unknown"}
                              </Typography>
                              <Typography sx={{ fontSize: "0.75rem", color: "#666" }}>
                                {member.projectRole || member.role} • {member.user?.email || member.email || "—"}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* SUB-OWNERS */}
                    {projectMembers?.subOwners && projectMembers.subOwners.length > 0 && (
                      <Box mb={2.5}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#ea580c", mb: 1 }}>
                          Sub-Owners
                        </Typography>
                        <Stack spacing={1}>
                          {projectMembers.subOwners.map((member: any) => (
                            <Box key={member.id} sx={{ p: 1.5, backgroundColor: "#fed7aa", borderRadius: 1, borderLeft: "3px solid #ea580c" }}>
                              <Typography fontWeight={600} sx={{ fontSize: "0.9rem" }}>
                                {member.user?.name || member.name || "Unknown"}
                              </Typography>
                              <Typography sx={{ fontSize: "0.75rem", color: "#666" }}>
                                {member.projectRole || member.role} • {member.user?.email || member.email || "—"}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* MEMBERS */}
                    {projectMembers?.members && projectMembers.members.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0369a1", mb: 1 }}>
                          Members ({projectMembers.members.length})
                        </Typography>
                        <Stack spacing={1}>
                          {projectMembers.members.map((member: any) => (
                            <Box key={member.id} sx={{ p: 1.5, backgroundColor: "#e0f2fe", borderRadius: 1, borderLeft: "3px solid #0369a1" }}>
                              <Typography fontWeight={600} sx={{ fontSize: "0.9rem" }}>
                                {member.user?.name || member.name || "Unknown"}
                              </Typography>
                              <Typography sx={{ fontSize: "0.75rem", color: "#666" }}>
                                {member.projectRole || member.role} • {member.user?.email || member.email || "—"}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {!projectMembers?.owner?.length && !projectMembers?.subOwners?.length && !projectMembers?.members?.length && (
                      <Typography sx={{ color: "#999", fontSize: "0.9rem" }}>
                        No team members assigned yet
                      </Typography>
                    )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* ATTACHMENTS CARD */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                      📎 Attachments
                    </Typography>

                    <Grid container spacing={1.25}>
                      <Grid size={{ xs: 12 }}>
                        <Box sx={{ p: 1.25, border: "1px solid #e5e7eb", borderRadius: 1, backgroundColor: "#fafafa" }}>
                        <Typography sx={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", mb: 1 }}>
                          Uploaded ({projectAttachments.length})
                        </Typography>
                        {projectAttachments.length > 0 ? (
                          <Stack spacing={0.5} sx={{ maxHeight: 155, overflowY: "auto", pr: 0.5 }}>
                            {projectAttachments.map((att: any, idx: number) => (
                              <Button
                                key={att?.id || `${att?.fileName || "attachment"}-${idx}`}
                                variant="text"
                                startIcon={<DownloadIcon />}
                                href={getAttachmentFileUrl("projects", att)}
                                target="_blank"
                                sx={{
                                  justifyContent: "flex-start",
                                  textTransform: "none",
                                  px: 0,
                                  minHeight: 28,
                                  fontSize: 12,
                                }}
                              >
                                {getAttachmentFileName(att, `Attachment ${idx + 1}`)}
                              </Button>
                            ))}
                          </Stack>
                        ) : (
                          <Typography sx={{ color: "#999", fontSize: "0.9rem" }}>
                            No uploaded attachments yet
                          </Typography>
                        )}
                        </Box>
                      </Grid>
                    </Grid>

                  </CardContent>
                </Card>
              </Grid>

              {/* PROJECT STRUCTURE CARD */}
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                      📊 Project Structure
                    </Typography>
                    {project?.scopes && project.scopes.length > 0 ? (
                      <Stack spacing={1.25} sx={{ maxHeight: 320, overflowY: "auto", pr: 0.5 }}>
                        {project.scopes.map((scope: any) => (
                          <Box key={scope.id} sx={{ p: 1.5, backgroundColor: "#f8faff", borderRadius: 1, border: "1px solid #e0e7ff" }}>
                            <Typography fontWeight={700} sx={{ color: "#6366f1", mb: 1 }}>
                              {scope.name}
                            </Typography>
                            <Typography sx={{ fontSize: "0.85rem", color: "#666", mb: 1 }}>
                              Budget: ₱{formatBudget(scope.budgetAllocated)} ({scope.budgetPercent.toFixed(1)}%)
                            </Typography>
                            {scope.tasks && scope.tasks.length > 0 && (
                              <Box sx={{ ml: 2, mt: 1 }}>
                                <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#999", mb: 1 }}>
                                  {scope.tasks.length} task(s):
                                </Typography>
                                <Stack spacing={0.5} sx={{ ml: 2 }}>
                                  {scope.tasks.map((task: any) => (
                                    <Typography
                                      key={task.id}
                                      sx={{ fontSize: "0.8rem", color: "#666", pl: 1, borderLeft: "2px solid #e5e7eb", ml: 0.5 }}
                                    >
                                      • {task.title} {task.subtasks?.length ? `(${task.subtasks.length} subtask${task.subtasks.length !== 1 ? "s" : ""})` : ""}
                                    </Typography>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography sx={{ color: "#999" }}>No scopes defined yet</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* STATUS MESSAGE */}
            {submitMessage && (
              <Alert severity={submitMessage.includes("✅") ? "success" : "warning"}>
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
            disabled={saving || (activeStep === 2 && !project)}
          >
            {activeStep === WIZARD_STEPS.length - 1 ? "Submit for Approval" : "Next"}
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
              Your project is ready for review. Once submitted, it will be reviewed by your Business Unit Head(s), then forwarded to the Office of President for final approval.
            </Typography>

            <Alert severity="info">
              ℹ️ You can continue editing the project while it's in review. The latest version will be reviewed.
            </Alert>

            <Box sx={{ backgroundColor: "#f9fafb", p: 2, borderRadius: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 2 }}>
                📋 PROJECT SNAPSHOT:
              </Typography>
              <Stack spacing={1}>
                <Typography sx={{ fontSize: 12 }}>
                  • <strong>Name:</strong> {projectForm.name || project?.name}
                </Typography>
                <Typography sx={{ fontSize: 12 }}>
                  • <strong>Code:</strong> {projectForm.pin || project?.pin}
                </Typography>
                <Typography sx={{ fontSize: 12 }}>
                  • <strong>Timeline:</strong> {projectForm.startDate ? new Date(projectForm.startDate).toLocaleDateString() : "—"} • {projectForm.expectedEndDate ? new Date(projectForm.expectedEndDate).toLocaleDateString() : "—"}
                </Typography>
                <Typography sx={{ fontSize: 12 }}>
                  • <strong>Budget:</strong> ₱{formatBudget(projectForm.totalBudget || project?.totalBudget || 0)}
                </Typography>
                <Typography sx={{ fontSize: 12 }}>
                  • <strong>Team:</strong> {project?._count?.projectMembers || 0} member(s)
                </Typography>
                <Typography sx={{ fontSize: 12 }}>
                  • <strong>Structure:</strong> {project?.scopes?.length || 0} scope(s), {project?.scopes?.reduce((sum: number, s: any) => sum + (s.tasks?.length || 0), 0) || 0} task(s)
                </Typography>
              </Stack>
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

      {/* SAVE DRAFT SUCCESS DIALOG */}
      <Dialog
        open={draftSuccessOpen}
        onClose={() => setDraftSuccessOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>✅ Draft Saved</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            Project was successfully saved as draft. Redirecting to Projects...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setDraftSuccessOpen(false);
              router.push("/projects");
            }}
          >
            Go to Projects
          </Button>
        </DialogActions>
      </Dialog>

      {/* SUBMIT SUCCESS DIALOG */}
      <Dialog
        open={submitSuccessOpen}
        onClose={() => {
          setSubmitSuccessOpen(false);
          router.push("/myRequests");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#065f46" }}>
          Project Request Submitted
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} alignItems="center" sx={{ py: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: "#10b981" }} />
            <Typography sx={{ textAlign: "center", fontWeight: 700 }}>
              Project request was successfully submitted.
            </Typography>
            <Typography sx={{ textAlign: "center", color: "#6b7280", fontSize: 14 }}>
              You can track its review and approval status in My Requests.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2.5 }}>
          <Button
            variant="contained"
            onClick={() => {
              setSubmitSuccessOpen(false);
              router.push("/myRequests");
            }}
            sx={{ bgcolor: "#210e64", "&:hover": { bgcolor: "#1a0b4f" } }}
          >
            Go to My Requests
          </Button>
        </DialogActions>
      </Dialog>

      {/* ATTACHMENT LIMIT WARNING DIALOG */}
      <Dialog
        open={attachmentLimitDialogOpen}
        onClose={() => setAttachmentLimitDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Attachment Limit Reached</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            {attachmentLimitDialogMessage || "Maximum 10 attachments allowed for this project."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setAttachmentLimitDialogOpen(false)}>
            OK
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
          <Typography fontSize={14} color="rgba(255, 255, 255, 0.8)">
            Please wait while we process your submission
          </Typography>
        </Stack>
      </Backdrop>
    </Box>
  );
}
