"use client";

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import kanbanReducer from "./slices/kanbanSlice";
import projectReducer from "./slices/projectSlice";
import taskReducer from "./slices/taskSlice";
// @ts-ignore
import logger from "redux-logger";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    kanban: kanbanReducer,
    project: projectReducer,
    task: taskReducer,
  },
  middleware: (getDefault) => getDefault().concat(logger),
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
