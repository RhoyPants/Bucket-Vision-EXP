"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { useParams } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";

import { getProjectFull } from "@/app/redux/controllers/projectController";
import { getEngagedUsers } from "@/app/redux/controllers/projectMemberController";
import Layout from "@/app/components/shared/Layout";
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
  deleteSubtask,
  updateSubtask,
} from "@/app/redux/controllers/subTaskController";
import { getMyMembers } from "@/app/redux/controllers/userController";

import ScopeForm from "./components/ScopeForm";
import ScopeList from "./components/ScopeList";
import ProjectTeamPanel from "./components/ProjectTeamPanel";

export default function ProjectSetupPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();

  const [project, setProject] = useState<any>(null);
  const [tab, setTab] = useState(0);

  const [scopeForm, setScopeForm] = useState({
    name: "",
    budgetAllocated: "",
  });

  const [scopeEdit, setScopeEdit] = useState<any>(null);

  const [taskInputs, setTaskInputs] = useState<Record<string, any>>({});
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, any>>({});

  const fetchProject = async () => {
    const data = await dispatch(getProjectFull(id as string));
    setProject(data);
  };
  const { members } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (id) {
      fetchProject();
      // Load engaged users for subtask assignment
      dispatch(getEngagedUsers(id as string) as any);
    }
  }, [id, dispatch]);
  
  useEffect(() => {
    dispatch(getMyMembers());
  }, [dispatch]);

  // =========================
  // Scope
  // =========================
  const handleAddScope = async () => {
    const projectBudget = project?.totalBudget || 0;
    const budget = Number(scopeForm.budgetAllocated);

    const percent = projectBudget > 0 ? (budget / projectBudget) * 100 : 0;

    await dispatch(
      createScope({
        name: scopeForm.name,
        projectId: id,
        budgetAllocated: budget,
        budgetPercent: percent,
        order: project.scopes?.length || 0,
      }),
    );

    setScopeForm({ name: "", budgetAllocated: "" });
    fetchProject();
  };

  const handleUpdateScope = async () => {
    await dispatch(
      updateScope(scopeEdit.id, {
        name: scopeEdit.name,
        budgetAllocated: Number(scopeEdit.budgetAllocated),
      }),
    );
    setScopeEdit(null);
    fetchProject();
  };

  const handleDeleteScope = async (id: string) => {
    await dispatch(deleteScope(id));
    fetchProject();
  };

  // =========================
  // TASK
  // =========================
  const handleAddTask = async (scopeId: string) => {
    const data = taskInputs[scopeId];
    if (!data?.title) return;

    const scope = project.scopes.find((c: any) => c.id === scopeId);

    const percent =
      scope?.budgetAllocated > 0
        ? (data.budgetAllocated / scope.budgetAllocated) * 100
        : 0;

    await dispatch(
      createTask({
        title: data.title,
        description: data.description || "",
        scopeId,
        budgetAllocated: Number(data.budgetAllocated),
        budgetPercent: percent,
      }),
    );

    setTaskInputs((prev) => ({ ...prev, [scopeId]: {} }));
    fetchProject();
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    const scope = project.scopes.find((c: any) =>
      c.tasks?.find((t: any) => t.id === taskId)
    );

    const percent =
      scope?.budgetAllocated > 0
        ? (updates.budgetAllocated / scope.budgetAllocated) * 100
        : 0;

    await dispatch(
      updateTask(taskId, {
        title: updates.title,
        description: updates.description || "",
        budgetAllocated: Number(updates.budgetAllocated),
        budgetPercent: percent,
      }),
    );
    fetchProject();
  };

  const handleDeleteTask = async (id: string) => {
    await dispatch(deleteTask(id));
    fetchProject();
  };

  // =========================
  // SUBTASK
  // =========================
  const handleUpdateSubtask = async (id: string, taskId: string) => {
    const data = subtaskInputs[taskId];

    let parentTask: any = null;
    project.scopes.forEach((cat: any) => {
      const found = cat.tasks?.find((t: any) => t.id === taskId);
      if (found) parentTask = found;
    });

    const percent =
      parentTask?.budgetAllocated > 0
        ? (data.budgetAllocated / parentTask.budgetAllocated) * 100
        : 0;

    await dispatch(
      updateSubtask(id, {
        title: data.title,
        description: data.description || "",
        priority: data.priority,
        budgetAllocated: Number(data.budgetAllocated),
        budgetPercent: percent,
        projectedStartDate: data.projectedStartDate,
        projectedEndDate: data.projectedEndDate,
        remarks: data.remarks || "",
        userIds: data.users?.map((u: any) => u.id || u.userId) || [],
      }),
    );

    setSubtaskInputs((prev) => ({
      ...prev,
      [taskId]: {},
    }));

    fetchProject();
  };

  const handleDeleteSubtask = async (id: string, taskId: string) => {
    await dispatch(deleteSubtask(id, taskId));
    fetchProject();
  };

  const handleAddSubtask = async (taskId: string) => {
    const data = subtaskInputs[taskId];
    if (!data?.title) return;

    let parentTask: any = null;

    project.scopes.forEach((cat: any) => {
      const found = cat.tasks?.find((t: any) => t.id === taskId);
      if (found) parentTask = found;
    });

    const percent =
      parentTask?.budgetAllocated > 0
        ? (data.budgetAllocated / parentTask.budgetAllocated) * 100
        : 0;

    await dispatch(
      createSubtask(
        {
          title: data.title,
          description: data.description || "",
          priority: data.priority,
          taskId,
          projectedStartDate: data.projectedStartDate,
          projectedEndDate: data.projectedEndDate,
          budgetAllocated: Number(data.budgetAllocated),
          budgetPercent: percent,
          remarks: data.remarks || "",
          userIds: data.users?.map((u: any) => u.id || u.userId) || [],
        },
        taskId,
      ),
    );

    setSubtaskInputs((prev) => ({ ...prev, [taskId]: {} }));
    fetchProject();
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
    <Box p={4}>
      <Typography variant="h4" fontWeight={600}>
        Project Setup
      </Typography>

      <Typography mb={3}>
        {project?.name} (₱{project?.totalBudget})
      </Typography>

      {/* TABS */}
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Project Structure" />
        <Tab label="Team Management" />
      </Tabs>

      {/* TAB 1: PROJECT STRUCTURE */}
      {tab === 0 && (
        <>
          {/* Scope INPUT */}
          <ScopeForm
            scopeForm={scopeForm}
            setScopeForm={setScopeForm}
            onAddScope={handleAddScope}
            projectBudget={project?.totalBudget || 0}
            existingScopes={project?.scopes || []}
          />

          {/* Scope LIST */}
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
            projectId={id as string}
            onEditScope={(scope: any) => setScopeEdit(scope)}
            onDeleteScope={handleDeleteScope}
            onUpdateScope={handleUpdateScope}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
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
            onAddSubtask={handleAddSubtask}
          />
        </>
      )}

      {/* TAB 2: TEAM MANAGEMENT */}
      {tab === 1 && (
        <ProjectTeamPanel
          projectId={id as string}
        />
      )}
    </Box>
    </Layout>
  );
}
