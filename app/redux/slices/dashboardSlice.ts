import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ============ TYPES ============
export interface DashboardKPI {
  activeProjects: number;
  overallProgress: number;
  budgetUtilization: number;
  delayedProjects: number;
  highRiskProjects: number;
  forecastCompletion: string;
}

export interface HealthStatus {
  onTrack: number;
  watchlist: number;
  critical: number;
}

export interface BudgetData {
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  budgetUtilization: number;
}

export interface DisciplineProgress {
  id: string;
  name: string;
  progress: number;
  budgetAllocated: number;
  tasks: number;
  subtasks: number;
}

export interface ProjectAlert {
  projectId: string;
  projectName: string;
  type: "budget" | "schedule" | "risk";
  severity: "critical" | "warning";
  message: string;
}

export interface WeeklyReportStats {
  totalSubmitted: number;
  totalPending: number;
  totalReviewed: number;
  lateReports: number;
}

export interface ProjectRequiringAttention {
  id: string;
  name: string;
  variance: number;
  budgetUsage: number;
  status: string;
  reason: string[];
}

// ============ DASHBOARD STATE ============
interface DashboardState {
  kpi: DashboardKPI | null;
  healthStatus: HealthStatus | null;
  budgetData: BudgetData | null;
  disciplines: DisciplineProgress[];
  alerts: ProjectAlert[];
  weeklyStats: WeeklyReportStats | null;
  projectsNeedingAttention: ProjectRequiringAttention[];
  currentProjectId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  kpi: null,
  healthStatus: null,
  budgetData: null,
  disciplines: [],
  alerts: [],
  weeklyStats: null,
  projectsNeedingAttention: [],
  currentProjectId: null,
  loading: false,
  error: null,
};

// ============ SLICE ============
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setKPI(state, action: PayloadAction<DashboardKPI>) {
      state.kpi = action.payload;
    },

    setHealthStatus(state, action: PayloadAction<HealthStatus>) {
      state.healthStatus = action.payload;
    },

    setBudgetData(state, action: PayloadAction<BudgetData>) {
      state.budgetData = action.payload;
    },

    setDisciplines(state, action: PayloadAction<DisciplineProgress[]>) {
      state.disciplines = action.payload;
    },

    setAlerts(state, action: PayloadAction<ProjectAlert[]>) {
      state.alerts = action.payload;
    },

    setWeeklyStats(state, action: PayloadAction<WeeklyReportStats>) {
      state.weeklyStats = action.payload;
    },

    setProjectsNeedingAttention(
      state,
      action: PayloadAction<ProjectRequiringAttention[]>
    ) {
      state.projectsNeedingAttention = action.payload;
    },

    setCurrentProjectId(state, action: PayloadAction<string | null>) {
      state.currentProjectId = action.payload;
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    clearDashboard(state) {
      return initialState;
    },
  },
});

export const {
  setKPI,
  setHealthStatus,
  setBudgetData,
  setDisciplines,
  setAlerts,
  setWeeklyStats,
  setProjectsNeedingAttention,
  setCurrentProjectId,
  setLoading,
  setError,
  clearDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
