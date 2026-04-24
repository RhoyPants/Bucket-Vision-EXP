"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { useParams } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";

import { getProjectFull } from "@/app/redux/controllers/projectController";
import { getEngagedUsers } from "@/app/redux/controllers/projectMemberController";
import Layout from "@/app/components/shared/Layout";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/redux/controllers/categoryController";
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

import CategoryForm from "./components/CategoryForm";
import CategoryList from "./components/CategoryList";
import ProjectTeamPanel from "./components/ProjectTeamPanel";

export default function ProjectSetupPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();

  const [project, setProject] = useState<any>(null);
  const [tab, setTab] = useState(0);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    budgetAllocated: "",
  });

  const [categoryEdit, setCategoryEdit] = useState<any>(null);
  const [taskEdit, setTaskEdit] = useState<any>(null);

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
  // CATEGORY
  // =========================
  const handleAddCategory = async () => {
    const projectBudget = project?.totalBudget || 0;
    const budget = Number(categoryForm.budgetAllocated);

    const percent = projectBudget > 0 ? (budget / projectBudget) * 100 : 0;

    await dispatch(
      createCategory({
        name: categoryForm.name,
        projectId: id,
        budgetAllocated: budget,
        budgetPercent: percent,
      }),
    );

    setCategoryForm({ name: "", budgetAllocated: "" });
    fetchProject();
  };

  const handleUpdateCategory = async () => {
    await dispatch(
      updateCategory(categoryEdit.id, {
        name: categoryEdit.name,
        budgetAllocated: Number(categoryEdit.budgetAllocated),
      }),
    );
    setCategoryEdit(null);
    fetchProject();
  };

  const handleDeleteCategory = async (id: string) => {
    await dispatch(deleteCategory(id));
    fetchProject();
  };

  // =========================
  // TASK
  // =========================
  const handleAddTask = async (categoryId: string) => {
    const data = taskInputs[categoryId];
    if (!data?.title) return;

    const category = project.categories.find((c: any) => c.id === categoryId);

    const percent =
      category?.budgetAllocated > 0
        ? (data.budgetAllocated / category.budgetAllocated) * 100
        : 0;

    await dispatch(
      createTask({
        title: data.title,
        categoryId,
        budgetAllocated: Number(data.budgetAllocated),
        budgetPercent: percent,
      }),
    );

    setTaskInputs((prev) => ({ ...prev, [categoryId]: {} }));
    fetchProject();
  };

  const handleUpdateTask = async () => {
    await dispatch(
      updateTask(taskEdit.id, {
        title: taskEdit.title,
        budgetAllocated: Number(taskEdit.budgetAllocated),
      }),
    );
    setTaskEdit(null);
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

    await dispatch(
      updateSubtask(id, {
        title: data.title,
        budgetAllocated: Number(data.budgetAllocated),
        projectedStartDate: data.projectedStartDate,
        projectedEndDate: data.projectedEndDate,
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

    project.categories.forEach((cat: any) => {
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
          taskId,
          projectedStartDate: data.projectedStartDate,
          projectedEndDate: data.projectedEndDate,
          budgetAllocated: Number(data.budgetAllocated),
          budgetPercent: percent,
          userIds: data.users?.map((u: any) => u.id) || [],
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
          {/* CATEGORY INPUT */}
          <CategoryForm
            categoryForm={categoryForm}
            setCategoryForm={setCategoryForm}
            onAddCategory={handleAddCategory}
          />

          {/* CATEGORY LIST */}
          <CategoryList
            categories={project?.categories || []}
            categoryEdit={categoryEdit}
            setCategoryEdit={setCategoryEdit}
            taskEdit={taskEdit}
            setTaskEdit={setTaskEdit}
            taskInputs={taskInputs}
            setTaskInputs={setTaskInputs}
            subtaskInputs={subtaskInputs}
            setSubtaskInputs={setSubtaskInputs}
            members={members}
            projectId={id as string}
            onEditCategory={(cat: any) => setCategoryEdit(cat)}
            onDeleteCategory={handleDeleteCategory}
            onUpdateCategory={handleUpdateCategory}
            onAddTask={handleAddTask}
            onEditTask={(task: any) => setTaskEdit(task)}
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
                  budgetAllocated: sub.budgetAllocated,
                  projectedStartDate: sub.projectedStartDate,
                  projectedEndDate: sub.projectedEndDate,
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
