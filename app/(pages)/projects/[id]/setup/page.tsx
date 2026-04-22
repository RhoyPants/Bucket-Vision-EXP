"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, Button, TextField } from "@mui/material";

import { useAppDispatch } from "@/app/redux/hook";

import { getProjectFull } from "@/app/redux/controllers/projectController";
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

export default function ProjectSetupPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();

  const [project, setProject] = useState<any>(null);

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

  useEffect(() => {
    fetchProject();
  }, []);

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
      createSubtask({
        title: data.title,
        taskId,
        projectedStartDate: data.projectedStartDate,
        projectedEndDate: data.projectedEndDate,
        budgetAllocated: Number(data.budgetAllocated),
        budgetPercent: percent,
      }, taskId),
    );

    setSubtaskInputs((prev) => ({ ...prev, [taskId]: {} }));
    fetchProject();
  };

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight={600}>
        Project Setup
      </Typography>

      <Typography mb={3}>
        {project?.name} (₱{project?.totalBudget})
      </Typography>

      {/* CATEGORY INPUT */}
      <Box display="flex" gap={2}>
        <TextField
          label="Category"
          value={categoryForm.name}
          onChange={(e) =>
            setCategoryForm({ ...categoryForm, name: e.target.value })
          }
        />

        <TextField
          label="Budget"
          type="number"
          value={categoryForm.budgetAllocated}
          onChange={(e) =>
            setCategoryForm({
              ...categoryForm,
              budgetAllocated: e.target.value,
            })
          }
        />

        <Button variant="contained" onClick={handleAddCategory}>
          + Category
        </Button>
      </Box>

      {/* CATEGORY LIST */}
      <Box mt={4}>
        {project?.categories?.map((cat: any) => (
          <Box
            key={cat.id}
            sx={{
              backgroundColor: "#f5f5f5",
              p: 3,
              mb: 3,
              border: "2px solid #00b7ff",
              borderRadius: 3,
              position: "relative",
              "&:hover .cat-actions": { opacity: 1 },
            }}
          >
            {/* CATEGORY HEADER */}
            <Box position="relative">
              {categoryEdit?.id === cat.id ? (
                <Box display="flex" gap={1}>
                  <TextField
                    size="small"
                    value={categoryEdit.name}
                    onChange={(e) =>
                      setCategoryEdit({
                        ...categoryEdit,
                        name: e.target.value,
                      })
                    }
                  />
                  <TextField
                    size="small"
                    type="number"
                    value={categoryEdit.budgetAllocated}
                    onChange={(e) =>
                      setCategoryEdit({
                        ...categoryEdit,
                        budgetAllocated: e.target.value,
                      })
                    }
                  />
                  <Button onClick={handleUpdateCategory}>Save</Button>
                </Box>
              ) : (
                <Typography fontWeight={600}>
                  {cat.name} — ₱{cat.budgetAllocated} (
                  {cat.budgetPercent?.toFixed(2)}%)
                </Typography>
              )}

              <Box
                className="cat-actions"
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  display: "flex",
                  gap: 1,
                  opacity: 0,
                }}
              >
                <Button size="small" onClick={() => setCategoryEdit(cat)}>
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDeleteCategory(cat.id)}
                >
                  Delete
                </Button>
              </Box>
            </Box>

            {/* TASK INPUT */}
            <Box mt={2} display="flex" gap={2}>
              <TextField
                size="small"
                label="Task"
                value={taskInputs[cat.id]?.title || ""}
                onChange={(e) =>
                  setTaskInputs((prev) => ({
                    ...prev,
                    [cat.id]: {
                      ...prev[cat.id],
                      title: e.target.value,
                    },
                  }))
                }
              />

              <TextField
                size="small"
                label="Budget"
                type="number"
                value={taskInputs[cat.id]?.budgetAllocated || ""}
                onChange={(e) =>
                  setTaskInputs((prev) => ({
                    ...prev,
                    [cat.id]: {
                      ...prev[cat.id],
                      budgetAllocated: e.target.value,
                    },
                  }))
                }
              />

              <Button onClick={() => handleAddTask(cat.id)}>+ Task</Button>
            </Box>

            {/* TASK LIST */}
            <Box mt={3}>
              {cat.tasks?.map((task: any) => (
                <Box
                  key={task.id}
                  sx={{
                    backgroundColor: "#ffffff",
                    p: 3,
                    mt: 2,
                    borderRadius: 3,
                    position: "relative",
                    "&:hover .task-actions": { opacity: 1 },
                  }}
                >
                  <Box position="relative">
                    {taskEdit?.id === task.id ? (
                      <Box display="flex" gap={1}>
                        <TextField
                          size="small"
                          value={taskEdit.title}
                          onChange={(e) =>
                            setTaskEdit({
                              ...taskEdit,
                              title: e.target.value,
                            })
                          }
                        />
                        <TextField
                          size="small"
                          type="number"
                          value={taskEdit.budgetAllocated}
                          onChange={(e) =>
                            setTaskEdit({
                              ...taskEdit,
                              budgetAllocated: e.target.value,
                            })
                          }
                        />
                        <Button onClick={handleUpdateTask}>Save</Button>
                      </Box>
                    ) : (
                      <Typography fontWeight={500}>
                        {task.title} — ₱{task.budgetAllocated} (
                        {task.budgetPercent?.toFixed(2)}%)
                      </Typography>
                    )}

                    <Box
                      className="task-actions"
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        display: "flex",
                        gap: 1,
                        opacity: 0,
                      }}
                    >
                      <Button size="small" onClick={() => setTaskEdit(task)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                  {/* SUBTASK SECTION */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      overflowX: "auto",
                      pb: 1,
                    }}
                  >
                    {/* SUBTASK CARDS */}
                    {task.subtasks?.map((sub: any) => {
                      const isEditing =
                        subtaskInputs[task.id]?.editId === sub.id;

                      return (
                        <Box
                          key={sub.id}
                          sx={{
                            minWidth: 220,
                            borderRadius: "20px",
                            p: 2,
                            backgroundColor: "#f9f9f9",
                            border: "2px solid #2b6f89",
                            flexShrink: 0,
                          }}
                        >
                          {!isEditing ? (
                            <>
                              <Typography fontWeight={600}>
                                {sub.title}
                              </Typography>

                              <Typography fontSize={13}>
                                ₱{sub.budgetAllocated} (
                                {sub.budgetPercent?.toFixed(2)}%)
                              </Typography>

                              <Box fontSize={12} color="gray" mt={1}>
                                Start:{" "}
                                {sub.projectedStartDate
                                  ? new Date(
                                      sub.projectedStartDate,
                                    ).toLocaleDateString()
                                  : "-"}
                                <br />
                                End:{" "}
                                {sub.projectedEndDate
                                  ? new Date(
                                      sub.projectedEndDate,
                                    ).toLocaleDateString()
                                  : "-"}
                              </Box>

                              {/* ACTIONS */}
                              <Box mt={1} display="flex" gap={1}>
                                <Button
                                  size="small"
                                  onClick={() =>
                                    setSubtaskInputs((prev) => ({
                                      ...prev,
                                      [task.id]: {
                                        editId: sub.id,
                                        title: sub.title,
                                        budgetAllocated: sub.budgetAllocated,
                                        projectedStartDate:
                                          sub.projectedStartDate,
                                        projectedEndDate: sub.projectedEndDate,
                                      },
                                    }))
                                  }
                                >
                                  Edit
                                </Button>

                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteSubtask(sub.id, task.id)}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </>
                          ) : (
                            <>
                              {/* EDIT FORM */}
                              <Box
                                display="flex"
                                flexDirection="column"
                                gap={1}
                                width="100%"
                              >
                                <TextField
                                  size="small"
                                  placeholder="Title"
                                  value={subtaskInputs[task.id]?.title || ""}
                                  onChange={(e) =>
                                    setSubtaskInputs((prev) => ({
                                      ...prev,
                                      [task.id]: {
                                        ...prev[task.id],
                                        title: e.target.value,
                                      },
                                    }))
                                  }
                                />

                                <TextField
                                  size="small"
                                  placeholder="Budget"
                                  type="number"
                                  value={
                                    subtaskInputs[task.id]?.budgetAllocated ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setSubtaskInputs((prev) => ({
                                      ...prev,
                                      [task.id]: {
                                        ...prev[task.id],
                                        budgetAllocated: e.target.value,
                                      },
                                    }))
                                  }
                                />

                                <TextField
                                  size="small"
                                  type="date"
                                  value={
                                    subtaskInputs[task.id]
                                      ?.projectedStartDate || ""
                                  }
                                  onChange={(e) =>
                                    setSubtaskInputs((prev) => ({
                                      ...prev,
                                      [task.id]: {
                                        ...prev[task.id],
                                        projectedStartDate: e.target.value,
                                      },
                                    }))
                                  }
                                />

                                <TextField
                                  size="small"
                                  type="date"
                                  value={
                                    subtaskInputs[task.id]?.projectedEndDate ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setSubtaskInputs((prev) => ({
                                      ...prev,
                                      [task.id]: {
                                        ...prev[task.id],
                                        projectedEndDate: e.target.value,
                                      },
                                    }))
                                  }
                                />

                                <Box display="flex" gap={1}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() =>
                                      handleUpdateSubtask(sub.id, task.id)
                                    }
                                  >
                                    Save
                                  </Button>

                                  <Button
                                    size="small"
                                    onClick={() =>
                                      setSubtaskInputs((prev) => ({
                                        ...prev,
                                        [task.id]: {},
                                      }))
                                    }
                                  >
                                    Cancel
                                  </Button>
                                </Box>
                              </Box>
                            </>
                          )}
                        </Box>
                      );
                    })}

                    {/* ADD / FORM CARD */}
                    <Box
                      sx={{
                        minWidth: 220,
                        borderRadius: "20px",
                        border: "2px dashed #2b6f89",
                        p: 2,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      {!subtaskInputs[task.id]?.open ? (
                        <Box
                          textAlign="center"
                          sx={{ cursor: "pointer" }}
                          onClick={() =>
                            setSubtaskInputs((prev) => ({
                              ...prev,
                              [task.id]: { open: true },
                            }))
                          }
                        >
                          <Typography fontSize={30}>+</Typography>
                          <Typography fontSize={12}>Add Subtask</Typography>
                        </Box>
                      ) : (
                        <Box
                          display="flex"
                          flexDirection="column"
                          gap={1}
                          width="100%"
                        >
                          <TextField
                            size="small"
                            placeholder="Title"
                            value={subtaskInputs[task.id]?.title || ""}
                            onChange={(e) =>
                              setSubtaskInputs((prev) => ({
                                ...prev,
                                [task.id]: {
                                  ...prev[task.id],
                                  title: e.target.value,
                                },
                              }))
                            }
                          />

                          <TextField
                            size="small"
                            placeholder="Budget"
                            type="number"
                            value={
                              subtaskInputs[task.id]?.budgetAllocated || ""
                            }
                            onChange={(e) =>
                              setSubtaskInputs((prev) => ({
                                ...prev,
                                [task.id]: {
                                  ...prev[task.id],
                                  budgetAllocated: e.target.value,
                                },
                              }))
                            }
                          />

                          <TextField
                            size="small"
                            type="date"
                            value={
                              subtaskInputs[task.id]?.projectedStartDate || ""
                            }
                            onChange={(e) =>
                              setSubtaskInputs((prev) => ({
                                ...prev,
                                [task.id]: {
                                  ...prev[task.id],
                                  projectedStartDate: e.target.value,
                                },
                              }))
                            }
                          />

                          <TextField
                            size="small"
                            type="date"
                            value={
                              subtaskInputs[task.id]?.projectedEndDate || ""
                            }
                            onChange={(e) =>
                              setSubtaskInputs((prev) => ({
                                ...prev,
                                [task.id]: {
                                  ...prev[task.id],
                                  projectedEndDate: e.target.value,
                                },
                              }))
                            }
                          />

                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleAddSubtask(task.id)}
                            >
                              Save
                            </Button>

                            <Button
                              size="small"
                              onClick={() =>
                                setSubtaskInputs((prev) => ({
                                  ...prev,
                                  [task.id]: {},
                                }))
                              }
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  {/* KEEP YOUR EXISTING SUBTASK UI BELOW (UNCHANGED) */}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
