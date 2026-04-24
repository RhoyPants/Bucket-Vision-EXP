"use client";

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import kanbanReducer from "./slices/kanbanSlice";
import categoryReducer from "./slices/categorySlice";
import progressReducer from "./slices/progressSlice";
import scurveReducer from "./slices/scurveSlice";
import projectReducer from "./slices/projectSlice";
import projectMemberReducer from "./slices/projectMemberSlice";
import taskReducer from "./slices/taskSlice";
import userReducer from "./slices/userSlice";
// @ts-ignore
import logger from "redux-logger";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    kanban: kanbanReducer,
    category: categoryReducer,
    progress: progressReducer,
    scurve: scurveReducer,
    project: projectReducer,
    projectMembers: projectMemberReducer,
    task: taskReducer,
    user: userReducer,
  },
  middleware: (getDefault) => getDefault().concat(logger),
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
