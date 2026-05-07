"use client";

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import kanbanReducer from "./slices/kanbanSlice";
import scopeReducer from "./slices/scopeSlice";
import progressReducer from "./slices/progressSlice";
import scurveReducer from "./slices/scurveSlice";
import projectReducer from "./slices/projectSlice";
import projectMemberReducer from "./slices/projectMemberSlice";
import taskReducer from "./slices/taskSlice";
import userReducer from "./slices/userSlice";
import dashboardReducer from "./slices/dashboardSlice";
import dailyReportReducer from "./slices/dailyReportSlice";
import weeklyReportReducer from "./slices/weeklyReportSlice";
import approvalReducer from "./slices/approvalSlice";
import approvalFlowReducer from "./slices/approvalFlowSlice";
import versioningReducer from "./slices/versioningSlice";
import projectCalendarReducer from "./slices/projectCalendarSlice";
// @ts-ignore
import logger from "redux-logger";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    kanban: kanbanReducer,
    scope: scopeReducer,
    progress: progressReducer,
    scurve: scurveReducer,
    project: projectReducer,
    projectMembers: projectMemberReducer,
    task: taskReducer,
    user: userReducer,
    dashboard: dashboardReducer,
    dailyReport: dailyReportReducer,
    weeklyReport: weeklyReportReducer,
    approval: approvalReducer,
    approvalFlow: approvalFlowReducer,
    versioning: versioningReducer,
    projectCalendar: projectCalendarReducer,
  },
  middleware: (getDefault) => getDefault().concat(logger),
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
