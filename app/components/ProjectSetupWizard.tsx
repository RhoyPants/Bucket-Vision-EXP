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
  Slider,
  Tooltip,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { usePathname, useRouter } from "next/navigation";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
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
  moveSubtask,
} from "@/app/redux/controllers/subTaskController";
import { getEngagedUsers, getProjectMembers } from "@/app/redux/controllers/projectMemberController";
import { submitProjectForApproval } from "@/app/redux/controllers/approvalController";
import { notifyFirstApprovalStep } from "@/app/utils/approvalEmailNotification";
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
import { usePermissions } from "@/app/lib/usePermissions";
import ValidationModal from "@/app/components/shared/modals/ValidationModal";
import DeleteStructureItemDialog, { StructureItemKind } from "@/app/components/shared/modals/DeleteStructureItemDialog";
import ProjectSchedulingStep from "@/app/(pages)/projects/[id]/setup/components/ProjectSchedulingStep";


const WIZARD_STEPS = [
  "Create Project",
  "Team Management",
  "Project Structure",
  "Project Scheduling",
  "Confirmation & Summary",
];

type StructureValidationFeedback = {
  title: string;
  details: string[];
  targets?: string[];
  invalidScopeIds?: string[];
  invalidTaskIds?: string[];
};

interface ProjectSetupWizardProps {
  projectId?: string;
  initialStep?: number;
  initialData?: any;
  mode?: "create" | "edit";
  structureOnly?: boolean;
  reorderOnly?: boolean;
}

export default function ProjectSetupWizard({
  projectId,
  initialStep = 0,
  initialData,
  mode = "edit",
  structureOnly = false,
  reorderOnly = false,
}: ProjectSetupWizardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { canCreate, canUpdate } = usePermissions();
  const canCreateProject = canCreate("projects");
  const canUpdateProject = canUpdate("projects");
  const { user } = useAppSelector((state) => state.auth);
  const { members } = useAppSelector((state) => state.user);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(projectId);

  // WIZARD STATE
  const [activeStep, setActiveStep] = useState(initialStep);
  const [structureZoom, setStructureZoom] = useState(1);
  const [project, setProject] = useState<any>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData && !!projectId);
  const [saving, setSaving] = useState(false);
  const isCreatingNew = mode === "create" || !currentProjectId;
  const isVersioningContext = pathname?.includes("/versioning") ?? false;
  const canSaveProjectDetails = isCreatingNew && !currentProjectId ? canCreateProject : canUpdateProject;
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
  const [scopeForm, setScopeForm] = useState({
    name: "",
    budgetAllocated: "",
    sourceType: "" as "" | "MAINTENANCE",
    scopeMaintenanceId: "",
  });
  const [scopeEdit, setScopeEdit] = useState<any>(null);

  // TASK STATE
  const [taskInputs, setTaskInputs] = useState<Record<string, any>>({});

  // SUBTASK STATE
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, any>>({});

  // DIALOG STATE
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitSuccessOpen, setSubmitSuccessOpen] = useState(false);
  const [submittedApprovalAssignments, setSubmittedApprovalAssignments] = useState<any[]>([]);
  const [draftSuccessOpen, setDraftSuccessOpen] = useState(false);
  const [projectAttachmentFiles, setProjectAttachmentFiles] = useState<File[]>([]);
  const [projectAttachments, setProjectAttachments] = useState<any[]>([]);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [attachmentLimitDialogOpen, setAttachmentLimitDialogOpen] = useState(false);
  const [attachmentLimitDialogMessage, setAttachmentLimitDialogMessage] = useState("");
  const [structureValidationModalOpen, setStructureValidationModalOpen] = useState(false);
  const [structureItemPendingDelete, setStructureItemPendingDelete] = useState<{
    kind: StructureItemKind;
    id: string;
    name: string;
    taskId?: string;
    impactMessage: string;
  } | null>(null);
  const [structureValidationFeedback, setStructureValidationFeedback] = useState<StructureValidationFeedback>({
    title: "Project Structure Validation",
    details: [],
    targets: [],
    invalidScopeIds: [],
    invalidTaskIds: [],
  });

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
    if (activeStep !== 2) return;
    const currentInvalidScopeIds = structureValidationFeedback.invalidScopeIds || [];
    const currentInvalidTaskIds = structureValidationFeedback.invalidTaskIds || [];
    if (!currentInvalidScopeIds.length && !currentInvalidTaskIds.length) return;

    const scopes = project?.scopes || [];
    const scopeMap = new Map<string, any>(scopes.map((scope: any) => [String(scope.id), scope]));
    const taskMap = new Map(
      scopes.flatMap((scope: any) => (scope.tasks || []).map((task: any) => [String(task.id), task]))
    );

    const nextInvalidScopeIds = currentInvalidScopeIds.filter((scopeId) => {
      const scope: any = scopeMap.get(String(scopeId));
      return scope ? !scope.tasks || scope.tasks.length === 0 : false;
    });

    const nextInvalidTaskIds = currentInvalidTaskIds.filter((taskId) => {
      const task: any = taskMap.get(String(taskId));
      return task ? !task.subtasks || task.subtasks.length === 0 : false;
    });

    const scopeChanged =
      nextInvalidScopeIds.length !== currentInvalidScopeIds.length ||
      nextInvalidScopeIds.some((id, index) => id !== currentInvalidScopeIds[index]);
    const taskChanged =
      nextInvalidTaskIds.length !== currentInvalidTaskIds.length ||
      nextInvalidTaskIds.some((id, index) => id !== currentInvalidTaskIds[index]);

    if (scopeChanged || taskChanged) {
      const noInvalidTargets = !nextInvalidScopeIds.length && !nextInvalidTaskIds.length;

      setStructureValidationFeedback((prev) => ({
        ...prev,
        invalidScopeIds: nextInvalidScopeIds,
        invalidTaskIds: nextInvalidTaskIds,
        targets: noInvalidTargets ? [] : prev.targets,
        details: noInvalidTargets ? [] : prev.details,
      }));

      if (noInvalidTargets) {
        setSubmitMessage("");
      }
    }
  }, [activeStep, project?.scopes, structureValidationFeedback.invalidScopeIds, structureValidationFeedback.invalidTaskIds]);

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
        router.push("/myDrafts");
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
    if (!scopeForm.scopeMaintenanceId) {
      alert("Please select a scope from Project Maintenance");
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
          projectId: currentProjectId,
          sourceType: "MAINTENANCE",
          scopeMaintenanceId: scopeForm.scopeMaintenanceId,
          budgetAllocated: budget,
          budgetPercent: percent,
          order: project.scopes?.length || 0,
        })
      );

      setScopeForm({
        name: "",
        budgetAllocated: "",
        sourceType: "",
        scopeMaintenanceId: "",
      });
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
          sourceType: scopeEdit.sourceType,
          scopeMaintenanceId: scopeEdit.scopeMaintenanceId,
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

  const handleDeleteScope = useCallback((scopeId: string) => {
    const scope = project?.scopes?.find((item: any) => item.id === scopeId);
    const tasks = scope?.tasks || [];
    const subtaskCount = tasks.reduce((sum: number, task: any) => sum + (task.subtasks?.length || 0), 0);
    setStructureItemPendingDelete({
      kind: "scope",
      id: scopeId,
      name: scope?.name || "this scope",
      impactMessage: `${tasks.length} task(s), ${subtaskCount} subtask(s), and their checklist items will also be deleted.`,
    });
  }, [project?.scopes]);

  // ===========================
  // TASK HANDLERS
  // ===========================
  const handleAddTask = useCallback(async (scopeId: string) => {
    const data = taskInputs[scopeId];
    if (!data?.taskMaintenanceId && !data?.title?.trim()) {
      alert("Please select or enter a task");
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
          sourceType: data.taskMaintenanceId ? "MAINTENANCE" : "CUSTOM",
          ...(data.taskMaintenanceId
            ? { taskMaintenanceId: data.taskMaintenanceId }
            : { title: data.title }),
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
          sourceType: updates.taskMaintenanceId ? "MAINTENANCE" : updates.sourceType,
          taskMaintenanceId: updates.taskMaintenanceId,
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

  const handleDeleteTask = useCallback((taskId: string) => {
    const task = project?.scopes
      ?.flatMap((scope: any) => scope.tasks || [])
      .find((item: any) => item.id === taskId);
    setStructureItemPendingDelete({
      kind: "task",
      id: taskId,
      name: task?.title || "this task",
      impactMessage: task?.subtasks?.length
        ? `${task.subtasks.length} subtask(s) and their checklist items will also be deleted.`
        : "The task will be removed from this project scope.",
    });
  }, [project?.scopes]);

  // ===========================
  // SUBTASK HANDLERS
  // ===========================
  const handleAddSubtask = useCallback(async (taskId: string) => {
    const data = subtaskInputs[taskId];
    if (!data?.subtaskMaintenanceId && !data?.title?.trim()) {
      alert("Please select or enter a subtask");
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
            sourceType: data.subtaskMaintenanceId ? "MAINTENANCE" : "CUSTOM",
            ...(data.subtaskMaintenanceId
              ? { subtaskMaintenanceId: data.subtaskMaintenanceId }
              : { title: data.title }),
            description: data.description || "",
            priority: data.priority || "Medium",
            taskId,
            projectedStartDate: data.projectedStartDate || "",
            projectedEndDate: data.projectedEndDate || "",
            budgetAllocated: Number(data.budgetAllocated) || 0,
            budgetPercent: percent,
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

  const handleDeleteSubtask = useCallback((id: string, taskId: string) => {
    const subtask = project?.scopes
      ?.flatMap((scope: any) => scope.tasks || [])
      .flatMap((task: any) => task.subtasks || [])
      .find((item: any) => item.id === id);
    const checklistCount = (subtask?.checklists || subtask?.checklist || []).length;
    setStructureItemPendingDelete({
      kind: "subtask",
      id,
      taskId,
      name: subtask?.title || "this subtask",
      impactMessage: checklistCount
        ? `${checklistCount} checklist item(s) will also be deleted.`
        : "The subtask will be removed from this task.",
    });
  }, [project?.scopes]);

  const confirmStructureItemDelete = async () => {
    if (!structureItemPendingDelete) return;
    try {
      setSaving(true);
      if (structureItemPendingDelete.kind === "scope") await dispatch(deleteScope(structureItemPendingDelete.id));
      if (structureItemPendingDelete.kind === "task") await dispatch(deleteTask(structureItemPendingDelete.id));
      if (structureItemPendingDelete.kind === "subtask") {
        await dispatch(deleteSubtask(structureItemPendingDelete.id, structureItemPendingDelete.taskId!));
      }
      setStructureItemPendingDelete(null);
      await refreshProject();
    } catch (error) {
      console.error("Error deleting project structure item:", error);
      setSubmitMessage(`Failed to delete ${structureItemPendingDelete.kind}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const sortedScopes = useMemo(() => {
    return [...(project?.scopes || [])].sort(
      (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
    );
  }, [project?.scopes]);

  const handleReorderSubtasks = async (taskId: string, draggedId: string, targetId: string) => {
    const task = project?.scopes?.flatMap((scope: any) => scope.tasks || []).find((item: any) => item.id === taskId);
    const items = [...(task?.subtasks || [])];
    const from = items.findIndex((item: any) => item.id === draggedId);
    const to = items.findIndex((item: any) => item.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    await dispatch(moveSubtask({
      id: draggedId,
      order: to,
      parentTaskId: taskId,
      orderedIds: items.map((item: any) => item.id),
    }));
    await refreshProject();
  };

  const handleReorderScopes = async (orderedIds: string[]) => {
    const byId = new Map(sortedScopes.map((item: any) => [String(item.id), item]));
    const items = orderedIds.map((id) => byId.get(id)).filter(Boolean);
    await Promise.all(items.map((scope: any, order: number) => dispatch(updateScope(scope.id, {
      name: scope.name,
      sourceType: scope.sourceType,
      scopeMaintenanceId: scope.scopeMaintenanceId,
      budgetAllocated: Number(scope.budgetAllocated) || 0,
      budgetPercent: Number(scope.budgetPercent) || 0,
      order,
    }))));
    await refreshProject();
  };

  const handleReorderTasks = async (scopeId: string, orderedIds: string[]) => {
    const scope = sortedScopes.find((item: any) => item.id === scopeId);
    const byId = new Map((scope?.tasks || []).map((item: any) => [String(item.id), item]));
    const items = orderedIds.map((id) => byId.get(id)).filter(Boolean);
    await Promise.all(items.map((task: any, order: number) => dispatch(updateTask(task.id, {
      title: task.title,
      sourceType: task.sourceType,
      taskMaintenanceId: task.taskMaintenanceId,
      description: task.description || "",
      budgetAllocated: Number(task.budgetAllocated) || 0,
      budgetPercent: Number(task.budgetPercent) || 0,
      order,
    }))));
    await refreshProject();
  };

  const teamMemberCount = useMemo(() => {
    const ids = new Set<string>();

    const addMemberId = (member: any) => {
      const id = member?.user?.id || member?.id || member?.userId;
      if (id) ids.add(String(id));
    };

    (projectMembers?.owner || []).forEach(addMemberId);
    (projectMembers?.subOwners || []).forEach(addMemberId);
    (projectMembers?.members || []).forEach(addMemberId);

    if (ids.size > 0) return ids.size;

    if (Array.isArray(project?.projectMembers) && project.projectMembers.length > 0) {
      const fallbackIds = new Set<string>();
      project.projectMembers.forEach((member: any) => {
        const id = member?.user?.id || member?.id || member?.userId;
        if (id) fallbackIds.add(String(id));
      });
      if (fallbackIds.size > 0) return fallbackIds.size;
      return project.projectMembers.length;
    }

    return Number(project?._count?.projectMembers || 0);
  }, [projectMembers, project?.projectMembers, project?._count?.projectMembers]);

  const approvalFlow = project?.approvalFlow || project?.currentApprovalFlow;
  const approvalSteps = approvalFlow?.steps || [];
  const projectLocation = [
    projectForm.location?.street || project?.location?.street,
    projectForm.location?.barangayName || project?.location?.barangayName,
    projectForm.location?.cityName || project?.location?.cityName,
    projectForm.location?.provinceName || project?.location?.provinceName,
    projectForm.location?.regionName || project?.location?.regionName,
  ].filter(Boolean).join(", ") || "Not specified";
  const proposedBudget = Number(projectForm.totalBudget || project?.totalBudget || 0);
  const allocatedScopeBudget = (project?.scopes || []).reduce(
    (total: number, scope: any) => total + Number(scope?.budgetAllocated || 0),
    0
  );
  const getScopeTaskTotal = (scope: any) =>
    (scope?.tasks || []).reduce(
      (total: number, task: any) => total + Number(task?.budgetAllocated || 0),
      0
    );
  const getTaskSubtaskTotal = (task: any) =>
    (task?.subtasks || []).reduce(
      (total: number, subtask: any) => total + Number(subtask?.budgetAllocated || 0),
      0
    );
  const budgetBalance = proposedBudget - allocatedScopeBudget;
  const isBudgetBalanced = Math.abs(budgetBalance) < 0.01;
  const isBudgetOver = budgetBalance < 0;
  const allocatedBudgetPercent = proposedBudget > 0 ? (allocatedScopeBudget / proposedBudget) * 100 : 0;

  const getApproverLabel = (step: any) => {
    const assigned = step.assignedUsers || step.users || [];
    const names = assigned.map((entry: any) => entry.user?.name || entry.name).filter(Boolean);
    if (names.length) return names.join(", ");
    if (step.approverSource === "PROJECT_BU_HEAD") return "Project Business Unit Head";
    if (step.approverSource === "REQUESTER_BU_HEAD") return "Requester's Business Unit Head";
    if (step.approverSource === "ROLE") return step.role || "Configured role";
    if (step.approverSource === "SPECIFIC_USERS") return "Configured users";
    return step.role || "Approver assigned by workflow";
  };

  // SAVE PROJECT DETAILS (called from project setup step)
  const handleSaveProjectDetails = async () => {
    if (!canSaveProjectDetails) {
      setProjectErrors([
        {
          field: "submit",
          message: `You don't have access to ${isCreatingNew && !currentProjectId ? "create" : "update"} project.`,
        },
      ]);
      return false;
    }

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

        if (canUpdateProject && projectAttachmentFiles.length > 0) {
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

        if (canUpdateProject && projectAttachmentFiles.length > 0) {
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
      const submissionResult = await dispatch(submitProjectForApproval(currentProjectId) as any);
      const returnedAssignments = [
        ...(Array.isArray(submissionResult?.approvals) ? submissionResult.approvals : []),
        ...(Array.isArray(submissionResult?.reviewers) ? submissionResult.reviewers : []),
      ];
      setSubmittedApprovalAssignments(returnedAssignments);

      // Notify only the first approval step after the submission succeeds.
      try {
        await notifyFirstApprovalStep(currentProjectId, {
          name: projectForm.name || project?.name,
          pin: projectForm.pin || project?.pin,
          priority: projectForm.priority || project?.priority,
          startDate: projectForm.startDate,
          expectedEndDate: projectForm.expectedEndDate,
        }, user?.name);
      } catch (emailErr) {
        // Email failure must never block the success flow
        console.warn("Could not send approval email notifications:", emailErr);
      }

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
    if (!canUpdateProject) {
      setSubmitMessage("You don't have access to update project.");
      return;
    }

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
    if (!canUpdateProject) return;

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
    if (!canUpdateProject) return;

    setProjectAttachmentFiles((prev) =>
      prev.filter(
        (f) => !(f.name === target.name && f.size === target.size && f.lastModified === target.lastModified),
      ),
    );
  };

  const handleDeleteProjectAttachment = async (att: any) => {
    if (!canUpdateProject) {
      setSubmitMessage("You don't have access to update project attachments.");
      return;
    }

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

  const validateProjectStructureForNext = (): StructureValidationFeedback | null => {
    if (!project?.scopes || project.scopes.length === 0) {
      return {
        title: "Project Structure Incomplete",
        details: [
          "Add at least one scope before proceeding to confirmation.",
          "Each scope must include at least one task.",
          "Each task must include at least one subtask.",
        ],
        targets: ["No scope found"],
        invalidScopeIds: [],
        invalidTaskIds: [],
      };
    }

    const invalidScopeIds: string[] = [];
    const invalidTaskIds: string[] = [];
    const targetItems: string[] = [];

    for (const scope of project.scopes) {
      const scopeName = scope?.name || "Unnamed scope";
      const tasks = scope?.tasks || [];

      if (!tasks.length) {
        if (scope?.id) invalidScopeIds.push(String(scope.id));
        targetItems.push(`Scope: ${scopeName}`);
        continue;
      }

      for (const task of tasks) {
        if (!task?.subtasks || task.subtasks.length === 0) {
          if (scope?.id) invalidScopeIds.push(String(scope.id));
          if (task?.id) invalidTaskIds.push(String(task.id));
          targetItems.push(`Scope: ${scopeName} | Task: ${task?.title || "Unnamed task"}`);
        }
      }
    }

    if (invalidScopeIds.length || invalidTaskIds.length) {
      return {
        title: "Project Structure Needs Fixes",
        details: [
          `${new Set(invalidScopeIds).size} scope(s) require at least one task.`,
          `${new Set(invalidTaskIds).size} task(s) require at least one subtask.`,
          "Fix all highlighted items, then click Next again.",
        ],
        targets: Array.from(new Set(targetItems)),
        invalidScopeIds: Array.from(new Set(invalidScopeIds)),
        invalidTaskIds: Array.from(new Set(invalidTaskIds)),
      };
    }

    return null;
  };

  const handleNext = async () => {
    // Step 0 (Create Project) requires save before moving forward
    if (activeStep === 0) {
      const success = await handleSaveProjectDetails();
      if (!success) return;
    }

    // Step 2 (Project Structure) validation before moving to Step 3 (Summary)
    if (activeStep === 2) {
      const structureFeedback = validateProjectStructureForNext();
      if (structureFeedback) {
        setSubmitMessage("⚠️ Complete project structure requirements before proceeding.");
        setStructureValidationFeedback(structureFeedback);
        setStructureValidationModalOpen(true);
        return;
      }
      setSubmitMessage("");
      setStructureValidationFeedback({
        title: "Project Structure Validation",
        details: [],
        targets: [],
        invalidScopeIds: [],
        invalidTaskIds: [],
      });
    }

    if (activeStep === WIZARD_STEPS.length - 1) {
      // Final step - trigger submit dialog
      setSubmitConfirm(true);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isVersioningContext && activeStep === 0) {
      setLeaveConfirmOpen(true);
      return;
    }

    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleConfirmLeave = () => {
    setLeaveConfirmOpen(false);
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/projects");
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
    <Box sx={{ width: "100%", pb: structureOnly ? 0 : 4 }}>
      {/* WIZARD STEPPER */}
      {!structureOnly && <Stepper activeStep={activeStep} sx={{ position: "sticky", top: 4, zIndex: 20, mb: 2, p: { xs: 1.25, sm: 1.75 }, bgcolor: "rgba(255,255,255,.96)", backdropFilter: "blur(10px)", border: "1px solid #E0DAE6", borderRadius: 2.5, boxShadow: "0 5px 16px rgba(33,14,100,.08)", "& .MuiStepLabel-label": { fontSize: { xs: 11, sm: 12.5 } }, "& .MuiStepIcon-root": { fontSize: { xs: 21, sm: 24 } } }}>
        {WIZARD_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>}

      {/* PROJECT HEADER - Show if project exists */}
      {!structureOnly && (project || projectForm.name) && (
        <>
        <Card elevation={0} sx={{ mb: 2, border: "1px solid #E0DAE6", borderRadius: 2.5, overflow: "hidden", bgcolor: "#FFFFFF" }}>
          <Box sx={{ height: 4, background: "linear-gradient(90deg, #210E64, #686AF3)" }} />
          <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: { xs: 1.5, md: 2 } } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1} sx={{ mb: 1.5 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: "#686278", fontSize: 10.5, fontWeight: 750, textTransform: "uppercase", letterSpacing: ".06em" }}>Project snapshot</Typography>
                <Typography noWrap title={projectForm.name || project?.name || "New Project"} sx={{ color: "#110947", fontSize: 19, fontWeight: 750, mt: 0.15 }}>
                  {projectForm.name || project?.name || "New Project"}
                </Typography>
              </Box>
              <MuiChip label={project?.status || "DRAFT"} size="small" sx={{ height: 27, bgcolor: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 750, border: "1px solid #FDE68A" }} />
            </Stack>
            <Grid container spacing={0} sx={{ border: "1px solid #ECE9F1", borderRadius: 2, overflow: "hidden", bgcolor: "#FCFBFE" }}>
              {[
                { label: "Project PIN", value: projectForm.pin || project?.pin || "Not assigned" },
                { label: "Business Unit", value: projectForm.businessUnitName || project?.businessUnitDetails?.name || project?.businessUnitName || "Not assigned" },
                { label: "Total Budget", value: `₱${formatBudget(projectForm.totalBudget || project?.totalBudget || 0)}` },
                { label: "Timeline", value: `${projectForm.startDate ? new Date(projectForm.startDate).toLocaleDateString() : "Not set"} – ${projectForm.expectedEndDate ? new Date(projectForm.expectedEndDate).toLocaleDateString() : "Not set"}` },
              ].map((item, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={item.label}>
                  <Box sx={{ px: 1.5, py: 1.1, minHeight: 58, borderRight: { lg: index < 3 ? "1px solid #E0DAE6" : 0 }, borderBottom: { xs: index < 3 ? "1px solid #E0DAE6" : 0, sm: index < 2 ? "1px solid #E0DAE6" : 0, lg: 0 } }}>
                    <Typography sx={{ color: "#858092", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{item.label}</Typography>
                    <Typography noWrap title={item.value} sx={{ color: "#322D43", fontSize: 13, fontWeight: 600, mt: 0.3 }}>{item.value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
        <Card sx={{ display: "none", mb: 3, backgroundColor: "#f3f4f6" }}>
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
        </>
      )}

      {/* STEP CONTENT */}
      <Box sx={{ minHeight: "500px" }}>
        {/* STEP 0: CREATE PROJECT (all fields + work schedule) */}
        {activeStep === 0 && (
          <Card elevation={0} sx={{ border: "1px solid #E0DAE6", borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 1.5, md: 2.25 }, "&:last-child": { pb: { xs: 1.5, md: 2.25 } } }}>
              {projectErrors.length > 0 && projectErrors.some((e) => e.field === "submit") && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {projectErrors.find((e) => e.field === "submit")?.message}
                </Alert>
              )}
              {!canSaveProjectDetails && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  You don't have access to {isCreatingNew && !currentProjectId ? "create" : "update"} project details.
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
                      backgroundColor: "#F5F3FF",
                      border: "1px solid #E0DAE6",
                      borderRadius: 2,
                      p: 1.75,
                      mb: 0,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, mb: 1 }}>
                      Project Attachments
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                      {canUpdateProject
                        ? "Upload supporting files (max 10 files, 50MB each)"
                        : "You need project update permission to upload or remove attachments."}
                    </Typography>


                    {canUpdateProject && (
                      <>
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
                                height: 44,
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
                      </>
                    )}

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

                            {canUpdateProject && !!att?.id && (
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
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1} sx={{ mb: 2.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1, color: "#111827" }}>
                  <AssignmentIcon /> Project Structure
                </Typography>
                <Typography sx={{ mt: 0.4, fontSize: 13, color: "#666" }}>
                  {reorderOnly ? "Reorder scopes, tasks, and subtasks." : "Define your project's scopes, tasks, and subtasks."}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.25} alignItems="center" sx={{ px: 0.35, height: 32, border: "1px solid #CBD5E1", borderRadius: 1.5, bgcolor: "#fff" }}>
                <Tooltip title="Zoom out"><span><IconButton size="small" disabled={structureZoom <= 0.4} onClick={() => setStructureZoom((value) => Math.max(0.4, Number((value - 0.1).toFixed(2))))} aria-label="Zoom project structure out"><ZoomOutIcon fontSize="small" /></IconButton></span></Tooltip>
                <Slider size="small" min={0.4} max={1.25} step={0.05} value={structureZoom} onChange={(_, value) => setStructureZoom(value as number)} aria-label="Project structure zoom" sx={{ width: 72 }} />
                <Typography sx={{ width: 36, textAlign: "center", fontSize: 10, fontWeight: 800, color: "#475467" }}>{Math.round(structureZoom * 100)}%</Typography>
                <Tooltip title="Zoom in"><span><IconButton size="small" disabled={structureZoom >= 1.25} onClick={() => setStructureZoom((value) => Math.min(1.25, Number((value + 0.1).toFixed(2))))} aria-label="Zoom project structure in"><ZoomInIcon fontSize="small" /></IconButton></span></Tooltip>
                <Tooltip title="Reset to 100%"><IconButton size="small" disabled={structureZoom === 1} onClick={() => setStructureZoom(1)} aria-label="Reset project structure zoom"><RestartAltIcon fontSize="small" /></IconButton></Tooltip>
              </Stack>
            </Stack>

            {/* PLACEHOLDER so the giant old block is replaced */}
            {/* Project structure section starts here */}
            {project && (
              <Box sx={{ zoom: structureZoom, width: "100%" }}>
                {/* Scope Input */}
                {!reorderOnly && <ScopeForm
                  scopeForm={scopeForm}
                  setScopeForm={setScopeForm}
                  onAddScope={handleAddScope}
                  projectBudget={project?.totalBudget || 0}
                  existingScopes={project?.scopes || []}
                  projectId={currentProjectId!}
                />}

                {!reorderOnly && <Divider sx={{ my: 3 }} />}

                {/* Scope List with Tasks & Subtasks */}
                <ScopeList
                  scopes={sortedScopes}
                  invalidScopeIds={structureValidationFeedback.invalidScopeIds}
                  invalidTaskIds={structureValidationFeedback.invalidTaskIds}
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
                  onReorderSubtasks={handleReorderSubtasks}
                  onReorderScopes={handleReorderScopes}
                  onReorderTasks={handleReorderTasks}
                  reorderOnly={reorderOnly}
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

        {/* STEP 3: PROJECT SCHEDULING / CPM */}
        {activeStep === 3 && currentProjectId && (
          <ProjectSchedulingStep projectId={currentProjectId} canUpdate={canUpdateProject} scopes={project?.scopes || []} />
        )}

        {/* STEP 4: CONFIRMATION & SUMMARY */}
        {activeStep === 4 && (
          <Stack spacing={1.25}>
            <Card sx={{ display: "none", backgroundColor: "#f0fdf4", borderLeft: "4px solid #22c55e" }}>
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
                    <Stack
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                        gap: 1,
                        "& > .MuiBox-root": {
                          minWidth: 0,
                          p: 1.25,
                          border: "1px solid #eef2f7",
                          borderRadius: 1.25,
                          bgcolor: "#fafbfc",
                        },
                      }}
                    >
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
                        <Typography>{project?.businessUnitDetails?.name || project?.businessUnitName || "—"}</Typography>
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
                    <Stack
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                        gap: 1,
                        "& > .MuiBox-root": {
                          minWidth: 0,
                          p: 1.25,
                          border: "1px solid #eef2f7",
                          borderRadius: 1.25,
                          bgcolor: "#fafbfc",
                        },
                      }}
                    >
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
              <Grid size={{ xs: 12, md: 4 }}>
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
              <Grid size={{ xs: 12, md: 4 }}>
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
              <Grid size={{ xs: 12, md: 4 }}>
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

              {/* BUDGET RECONCILIATION CARD */}
              <Grid size={{ xs: 12 }}>
                <Card
                  sx={{
                    border: "1px solid",
                    borderColor: isBudgetBalanced ? "#86efac" : isBudgetOver ? "#fca5a5" : "#fcd34d",
                    bgcolor: isBudgetBalanced ? "#f0fdf4" : isBudgetOver ? "#fef2f2" : "#fffbeb",
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "stretch", md: "center" }}
                      gap={2}
                    >
                      <Box>
                        <Typography sx={{ color: "#111827", fontSize: 16, fontWeight: 800 }}>
                          Budget Summary
                        </Typography>
                        <Typography sx={{ mt: 0.25, color: "#64748b", fontSize: 12 }}>
                          Compare the project budget allocation against the total allocated to scopes.
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 999,
                          bgcolor: isBudgetBalanced ? "#dcfce7" : isBudgetOver ? "#fee2e2" : "#fef3c7",
                          color: isBudgetBalanced ? "#166534" : isBudgetOver ? "#991b1b" : "#92400e",
                          fontSize: 12,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                          alignSelf: { xs: "flex-start", md: "center" },
                        }}
                      >
                        {isBudgetBalanced ? "Balanced" : isBudgetOver ? "Over proposed budget" : "Under proposed budget"}
                      </Box>
                    </Stack>

                    <Box
                      sx={{
                        mt: 2,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(4, minmax(0, 1fr))" },
                        border: "1px solid #e2e8f0",
                        borderRadius: 1.5,
                        overflow: "hidden",
                        bgcolor: "#fff",
                      }}
                    >
                      {[
                        { label: "Budget allocation", value: `₱${formatBudget(proposedBudget)}` },
                        { label: "Allocated budget", value: `₱${formatBudget(allocatedScopeBudget)}` },
                        {
                          label: "Budget variance",
                          value: `₱${formatBudget(Math.abs(budgetBalance))}`,
                        },
                        { label: "Allocated", value: `${allocatedBudgetPercent.toFixed(2)}%` },
                      ].map((item, index) => (
                        <Box
                          key={item.label}
                          sx={{
                            p: 1.5,
                            minWidth: 0,
                            borderRight: { sm: index < 3 ? "1px solid #e2e8f0" : 0 },
                            borderBottom: { xs: index < 3 ? "1px solid #e2e8f0" : 0, sm: 0 },
                          }}
                        >
                          <Typography sx={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>
                            {item.label}
                          </Typography>
                          <Typography sx={{ mt: 0.35, color: "#111827", fontSize: 15, fontWeight: 800 }}>
                            {item.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
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
                      <Stack spacing={1.25}>
                        {project.scopes.map((scope: any) => (
                          <Box key={scope.id} sx={{ p: 1.5, backgroundColor: "#f8faff", borderRadius: 1, border: "1px solid #e0e7ff" }}>
                            <Typography fontWeight={700} sx={{ color: "#6366f1", mb: 1 }}>
                              {scope.name}
                            </Typography>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={{ xs: 0.75, sm: 1.5 }}
                              sx={{
                                mb: 1,
                                "& > * + *": {
                                  borderTop: { xs: "1px solid #e2e8f0", sm: 0 },
                                  borderLeft: { xs: 0, sm: "1px solid #cbd5e1" },
                                  pt: { xs: 0.75, sm: 0 },
                                  pl: { xs: 0, sm: 1.5 },
                                },
                              }}
                            >
                              <Typography sx={{ fontSize: "0.8rem", color: "#475569" }}>
                                Allocated budget: <strong>₱{formatBudget(scope.budgetAllocated || 0)}</strong>
                              </Typography>
                              <Typography sx={{ fontSize: "0.8rem", color: "#475569" }}>
                                Total tasks: <strong>₱{formatBudget(getScopeTaskTotal(scope))}</strong>
                              </Typography>
                              <Typography sx={{ fontSize: "0.8rem", color: "#475569", fontWeight: 700 }}>
                                Budget variance:{" "}
                                <Box component="span" sx={{ color: Number(scope.budgetAllocated || 0) - getScopeTaskTotal(scope) < 0 ? "#dc2626" : Number(scope.budgetAllocated || 0) - getScopeTaskTotal(scope) === 0 ? "#15803d" : "#1e3a8a" }}>
                                  {Number(scope.budgetAllocated || 0) - getScopeTaskTotal(scope) === 0
                                    ? "Balanced"
                                    : `₱${formatBudget(Math.abs(Number(scope.budgetAllocated || 0) - getScopeTaskTotal(scope)))} ${Number(scope.budgetAllocated || 0) - getScopeTaskTotal(scope) < 0 ? "over allocation" : "under allocation"}`}
                                </Box>
                              </Typography>
                            </Stack>
                            {scope.tasks && scope.tasks.length > 0 && (
                              <Box sx={{ ml: 2, mt: 1 }}>
                                <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#999", mb: 1 }}>
                                  {scope.tasks.length} task(s):
                                </Typography>
                                <Stack spacing={1} sx={{ ml: 2 }}>
                                  {scope.tasks.map((task: any) => (
                                    <Box key={task.id} sx={{ pl: 1.25, borderLeft: "2px solid #c7d2fe" }}>
                                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={0.5}>
                                        <Typography sx={{ fontSize: "0.82rem", color: "#334155", fontWeight: 700 }}>{task.title}</Typography>
                                        <Stack
                                          direction={{ xs: "column", sm: "row" }}
                                          spacing={{ xs: 0.5, sm: 1 }}
                                          sx={{
                                            "& > * + *": {
                                              borderTop: { xs: "1px solid #e2e8f0", sm: 0 },
                                              borderLeft: { xs: 0, sm: "1px solid #cbd5e1" },
                                              pt: { xs: 0.5, sm: 0 },
                                              pl: { xs: 0, sm: 1 },
                                            },
                                          }}
                                        >
                                          <Typography sx={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
                                            Allocated: ₱{formatBudget(task.budgetAllocated || 0)}
                                          </Typography>
                                          <Typography sx={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
                                            Total subtasks: ₱{formatBudget(getTaskSubtaskTotal(task))}
                                          </Typography>
                                          <Typography sx={{ fontSize: "0.75rem", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>
                                            Budget variance:{" "}
                                            <Box component="span" sx={{ color: Number(task.budgetAllocated || 0) - getTaskSubtaskTotal(task) < 0 ? "#dc2626" : Number(task.budgetAllocated || 0) - getTaskSubtaskTotal(task) === 0 ? "#15803d" : "#1e3a8a" }}>
                                              {Number(task.budgetAllocated || 0) - getTaskSubtaskTotal(task) === 0
                                                ? "Balanced"
                                                : `₱${formatBudget(Math.abs(Number(task.budgetAllocated || 0) - getTaskSubtaskTotal(task)))} ${Number(task.budgetAllocated || 0) - getTaskSubtaskTotal(task) < 0 ? "over allocation" : "under allocation"}`}
                                            </Box>
                                          </Typography>
                                        </Stack>
                                      </Stack>
                                      {task.description && <Typography sx={{ mt: 0.25, fontSize: "0.75rem", color: "#64748b" }}>{task.description}</Typography>}
                                      {task.subtasks?.length > 0 ? (
                                        <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                                          {task.subtasks.map((subtask: any) => {
                                            const checklistItems = subtask.checklists || subtask.checklist || [];
                                            return (
                                              <Box key={subtask.id} sx={{ p: 1, bgcolor: "#fff", border: "1px solid #e2e8f0", borderRadius: 1 }}>
                                                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={0.5}>
                                                  <Typography sx={{ fontSize: "0.78rem", color: "#475569", fontWeight: 600 }}>{subtask.title}</Typography>
                                                  <Typography sx={{ fontSize: "0.72rem", color: "#64748b", whiteSpace: "nowrap" }}>{subtask.priority || "No priority"} · ₱{formatBudget(subtask.budgetAllocated || 0)}</Typography>
                                                </Stack>
                                                {subtask.description && <Typography sx={{ mt: 0.25, fontSize: "0.73rem", color: "#64748b" }}>{subtask.description}</Typography>}
                                                {checklistItems.length > 0 && (
                                                  <Box sx={{ mt: 0.75 }}>
                                                    <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>Checklist ({checklistItems.length})</Typography>
                                                    <Stack spacing={0.25} sx={{ mt: 0.35 }}>
                                                      {checklistItems.map((item: any) => (
                                                        <Typography key={item.id || item.title} sx={{ fontSize: "0.72rem", color: "#475569" }}>{item.isCompleted ? "✓" : "○"} {item.title}</Typography>
                                                      ))}
                                                    </Stack>
                                                  </Box>
                                                )}
                                              </Box>
                                            );
                                          })}
                                        </Stack>
                                      ) : <Typography sx={{ mt: 0.5, fontSize: "0.72rem", color: "#94a3b8" }}>No subtasks</Typography>}
                                    </Box>
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
      {!structureOnly && <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
          p: 1.5,
          border: "1px solid #E0DAE6",
          borderRadius: 2.5,
          bgcolor: "#FFFFFF",
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={saving || (isVersioningContext && activeStep === 0)}
        >
          Back
        </Button>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSaveDraft}
            disabled={saving || !canUpdateProject || !currentProjectId}
          >
            Save as Draft
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            disabled={saving || (activeStep === 0 && !canSaveProjectDetails) || (activeStep === 2 && !project)}
          >
            {activeStep === WIZARD_STEPS.length - 1 ? "Submit for Approval" : "Next"}
          </Button>
        </Stack>
      </Box>}

      <DeleteStructureItemDialog
        open={Boolean(structureItemPendingDelete)}
        kind={structureItemPendingDelete?.kind || "task"}
        name={structureItemPendingDelete?.name || "this item"}
        impactMessage={structureItemPendingDelete?.impactMessage || "This item will be permanently deleted."}
        loading={saving}
        onClose={() => setStructureItemPendingDelete(null)}
        onConfirm={() => void confirmStructureItemDelete()}
      />

      <Dialog
        open={leaveConfirmOpen}
        onClose={() => setLeaveConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Leave Project Setup?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            Leaving this page will discard your current unsaved form data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleConfirmLeave}>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* SUBMIT CONFIRMATION DIALOG */}
      <Dialog
        open={submitConfirm}
        onClose={() => {
          setSubmitConfirm(false);
          setSubmitMessage("");
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
          <Typography sx={{ color: "#1e293b", fontSize: 20, fontWeight: 700 }}>Submit project for approval?</Typography>
          <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13, fontWeight: 400 }}>
            Review the project snapshot and approval route below. Submission will notify the first assigned approver.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
              <Typography sx={{ color: "#475569", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", mb: 1.5 }}>Project snapshot</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                {[
                  ["Project name", projectForm.name || project?.name || "Not specified"],
                  ["Project PIN", projectForm.pin || project?.pin || "Not assigned"],
                  ["Location", projectLocation],
                  ["Business unit", projectForm.businessUnitName || project?.businessUnitDetails?.name || project?.businessUnitName || "Not assigned"],
                  ["Timeline", `${projectForm.startDate ? new Date(projectForm.startDate).toLocaleDateString() : "Not set"} – ${projectForm.expectedEndDate ? new Date(projectForm.expectedEndDate).toLocaleDateString() : "Not set"}`],
                  ["Budget", `₱${formatBudget(projectForm.totalBudget || project?.totalBudget || 0)}`],
                  ["Project team", `${teamMemberCount} member(s)`],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography sx={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>{label}</Typography>
                    <Typography sx={{ mt: 0.25, color: "#1e293b", fontSize: 13, fontWeight: 600 }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
              <Typography sx={{ color: "#475569", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", mb: 1.25 }}>Project structure</Typography>
              <Stack spacing={1} sx={{ maxHeight: 220, overflowY: "auto", pr: 0.5 }}>
                {(project?.scopes || []).map((scope: any) => (
                  <Box key={scope.id} sx={{ p: 1.25, bgcolor: "#f8fafc", borderRadius: 1.5 }}>
                    <Typography sx={{ color: "#1e293b", fontSize: 13, fontWeight: 700 }}>{scope.name}</Typography>
                    {(scope.tasks || []).map((task: any) => (
                      <Box key={task.id} sx={{ mt: 0.75, pl: 1.25, borderLeft: "2px solid #cbd5e1" }}>
                        <Typography sx={{ color: "#334155", fontSize: 12.5, fontWeight: 600 }}>{task.title}</Typography>
                        <Typography sx={{ color: "#64748b", fontSize: 11.5 }}>
                          {(task.subtasks || []).map((subtask: any) => `${subtask.title}${(subtask.checklists || subtask.checklist || []).length ? ` (${(subtask.checklists || subtask.checklist).length} checklist)` : ""}`).join(" · ") || "No subtasks"}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
              <Typography sx={{ color: "#475569", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" }}>Approval route</Typography>
              <Typography sx={{ mt: 0.5, color: "#1e293b", fontSize: 14, fontWeight: 700 }}>{approvalFlow?.name || "Default approval flow"}</Typography>
              <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                {approvalSteps.length ? approvalSteps.map((step: any, index: number) => (
                  <Stack key={step.id || index} direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: "#ede9fe", color: "#4c1d95", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800 }}>{index + 1}</Box>
                    <Box>
                      <Typography sx={{ color: "#334155", fontSize: 12.5, fontWeight: 650 }}>{getApproverLabel(step)}</Typography>
                      <Typography sx={{ color: "#64748b", fontSize: 11 }}>{step.stepExecutionMode === "PARALLEL" ? "Parallel review" : "Sequential review"}{step.requiresAll ? " · All must approve" : ""}</Typography>
                    </Box>
                  </Stack>
                )) : <Typography sx={{ color: "#64748b", fontSize: 12.5 }}>Approvers will be assigned from the default workflow when submitted.</Typography>}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e2e8f0" }}>
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
            Project was successfully saved as draft. Redirecting to My Drafts...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setDraftSuccessOpen(false);
              router.push("/myDrafts");
            }}
          >
            Go to My Drafts
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
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1, fontWeight: 800, color: "#065f46" }}>
          Project submitted successfully
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CheckCircleIcon sx={{ fontSize: 48, color: "#10b981", flexShrink: 0 }} />
              <Box>
                <Typography sx={{ color: "#1e293b", fontWeight: 700 }}>Your project request is now in review.</Typography>
                <Typography sx={{ mt: 0.25, color: "#64748b", fontSize: 13 }}>Track its progress and approval status in My Requests.</Typography>
              </Box>
            </Stack>

            <Box sx={{ p: 1.75, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 1.5 }}>
              <Typography sx={{ color: "#64748b", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>Project Identification Number</Typography>
              <Typography sx={{ mt: 0.35, color: "#210e64", fontSize: 18, fontWeight: 800 }}>{projectForm.pin || project?.pin || "Not assigned"}</Typography>
              <Typography sx={{ mt: 0.25, color: "#475569", fontSize: 12.5 }}>{projectForm.name || project?.name}</Typography>
            </Box>

            <Box>
              <Typography sx={{ color: "#475569", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", mb: 1 }}>Review and approval route</Typography>
              {submittedApprovalAssignments.length > 0 ? (
                <Stack spacing={0.75}>
                  {submittedApprovalAssignments.map((assignment: any, index: number) => {
                    const person = assignment.approver || assignment.reviewer || assignment.user || assignment.assignedUser;
                    const name = assignment.approverName || assignment.reviewerName || person?.name || assignment.name || "Assigned approver";
                    const email = assignment.approverEmail || assignment.reviewerEmail || person?.email || assignment.email;
                    const role = assignment.level || assignment.role || assignment.step?.role || (index === 0 ? "Reviewer" : "Approver");
                    return (
                      <Stack key={assignment.id || `${name}-${index}`} direction="row" spacing={1.25} alignItems="center" sx={{ p: 1.25, border: "1px solid #e2e8f0", borderRadius: 1.5 }}>
                        <Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: "#ede9fe", color: "#4c1d95", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{assignment.order || assignment.levelOrder || index + 1}</Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: "#1e293b", fontSize: 13, fontWeight: 700 }}>{name}</Typography>
                          <Typography noWrap sx={{ color: "#64748b", fontSize: 11.5 }}>{role}{email ? ` · ${email}` : ""}</Typography>
                        </Box>
                      </Stack>
                    );
                  })}
                </Stack>
              ) : (
                <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 1.5 }}>
                  <Typography sx={{ color: "#64748b", fontSize: 12.5 }}>The backend did not return named assignments. Approvers can be viewed in My Requests once assigned.</Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e2e8f0" }}>
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

      <ValidationModal
        open={structureValidationModalOpen}
        title={structureValidationFeedback.title}
        details={structureValidationFeedback.details}
        targets={structureValidationFeedback.targets}
        onClose={() => setStructureValidationModalOpen(false)}
        actionLabel="Back to Structure"
      />

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
