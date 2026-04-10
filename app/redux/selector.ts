// import { createSelector } from "@reduxjs/toolkit";
// import type { RootState } from "./store";

// /* ===========================
//     PROJECT SELECTORS
// =========================== */

// // Raw project list
// export const selectProjects = (state: RootState) => state.project.projects;

// // Get a single project by ID
// export const selectProjectById = (projectId: number) =>
//   createSelector(
//     [selectProjects],
//     (projects) => projects.find((p) => p.project_id === projectId) || null
//   );

// // Search project by ref_no
// export const selectProjectByRef = (refNo: string) =>
//   createSelector(
//     [selectProjects],
//     (projects) => projects.find((p) => p.ref_no === refNo) || null
//   );

// /* ===========================
//     TASK SELECTORS
// =========================== */

// // Raw tasks list
// export const selectTasks = (state: RootState) => state.task.tasks;

// // Get a task by task_id
// export const selectTaskById = (taskId: number) =>
//   createSelector(
//     [selectTasks],
//     (tasks) => tasks.find((t) => t.task_id === taskId) || null
//   );

// export const selectTaskTabs = createSelector([selectTasks], (tasks) =>
//   tasks.map((t) => ({
//     task_id: t.task_id,
//     task_name: t.task_name,
//     priority: t.priority,
//     progress: t.progress,
//   }))
// );


// //subTask Selector 
// // SELECT KANBAN SUBTASKS (correct type!)
// export const selectSubtasks = (state: any) => state.kanban.subtasks;

// export const selectCurrentProject = (state: any) =>
//   state.project.currentProject;

// // user selector
// export const selectAuthUser = (state: RootState) => state.auth.user;
// export const selectAuthUserId = (state: RootState) => state.auth.user?.user_id;

