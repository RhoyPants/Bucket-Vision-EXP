import axiosApi from "@/app/lib/axios";
import { AppDispatch } from "../store";
import {
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
} from "../slices/dashboardSlice";
import {
  DashboardKPI,
  HealthStatus,
  BudgetData,
  DisciplineProgress,
  ProjectAlert,
  WeeklyReportStats,
  ProjectRequiringAttention,
} from "../slices/dashboardSlice";

// ============ LOAD COMPLETE DASHBOARD ============
export const loadCompleteDashboard = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setCurrentProjectId(projectId));
      dispatch(setError(null));

      // Load all data in parallel
      const [
        projectDashboardRes,
        projectFullRes,
        timelineVarianceRes,
        weeklyReportRes,
      ] = await Promise.all([
        axiosApi.get(`/projects/${projectId}/dashboard`),
        axiosApi.get(`/projects/${projectId}/full`),
        axiosApi.get(`/timeline/${projectId}/variance`),
        axiosApi.get("/weekly-reports/summary"),
      ]);

      // Calculate KPI data
      const dashboardData = projectDashboardRes.data.data || {};
      const kpi: DashboardKPI = {
        activeProjects: dashboardData.activeProjects || 1,
        overallProgress: dashboardData.progress || 0,
        budgetUtilization: dashboardData.totalBudget
          ? (dashboardData.usedBudget / dashboardData.totalBudget) * 100
          : 0,
        delayedProjects: dashboardData.delayedCount || 0,
        highRiskProjects: dashboardData.highRiskCount || 0,
        forecastCompletion: dashboardData.forecastDate || "",
      };

      dispatch(setKPI(kpi));

      // Calculate health status
      const variance = timelineVarianceRes.data.data?.variance || 0;
      const budgetVariance =
        dashboardData.totalBudget > 0
          ? (dashboardData.usedBudget / dashboardData.totalBudget) * 100
          : 0;

      const healthStatus: HealthStatus = {
        onTrack: variance > -5 && variance <= 5 && budgetVariance <= 85 ? 1 : 0,
        watchlist:
          (variance < -5 || variance > 10 || budgetVariance > 85) &&
          !(variance < -10 || budgetVariance > 90)
            ? 1
            : 0,
        critical: variance < -10 || budgetVariance > 90 ? 1 : 0,
      };

      dispatch(setHealthStatus(healthStatus));

      // Set budget data
      const budgetData: BudgetData = {
        totalBudget: dashboardData.totalBudget || 0,
        usedBudget: dashboardData.usedBudget || 0,
        remainingBudget: dashboardData.remainingBudget || 0,
        budgetUtilization: budgetVariance,
      };

      dispatch(setBudgetData(budgetData));

      // Set disciplines
      const fullProject = projectFullRes.data.data || {};
      const disciplines: DisciplineProgress[] =
        fullProject.scopes?.map(
          (scope: any): DisciplineProgress => ({
            id: scope.id,
            name: scope.name,
            progress: scope.progress || 0,
            budgetAllocated: scope.budgetAllocated || 0,
            tasks: scope.tasks || 0,
            subtasks: scope.subtasks || 0,
          })
        ) || [];

      dispatch(setDisciplines(disciplines));

      // Generate alerts
      const alerts: ProjectAlert[] = [];

      if (variance < -10) {
        alerts.push({
          projectId,
          projectName: fullProject.name || "Project",
          type: "schedule",
          severity: "critical",
          message: `Project is ${Math.abs(variance).toFixed(1)}% behind schedule`,
        });
      }

      if (budgetVariance > 90) {
        alerts.push({
          projectId,
          projectName: fullProject.name || "Project",
          type: "budget",
          severity: "critical",
          message: `Budget is ${budgetVariance.toFixed(1)}% utilized - nearly exhausted`,
        });
      }

      if (variance < -5 && variance >= -10) {
        alerts.push({
          projectId,
          projectName: fullProject.name || "Project",
          type: "schedule",
          severity: "warning",
          message: `Project is ${Math.abs(variance).toFixed(1)}% behind schedule (watchlist)`,
        });
      }

      if (budgetVariance > 85 && budgetVariance <= 90) {
        alerts.push({
          projectId,
          projectName: fullProject.name || "Project",
          type: "budget",
          severity: "warning",
          message: `Budget is ${budgetVariance.toFixed(1)}% utilized (watchlist)`,
        });
      }

      dispatch(setAlerts(alerts));

      // Set weekly stats
      const weeklyStats: WeeklyReportStats = {
        totalSubmitted: weeklyReportRes.data.data?.totalSubmitted || 0,
        totalPending: weeklyReportRes.data.data?.totalPending || 0,
        totalReviewed: weeklyReportRes.data.data?.totalReviewed || 0,
        lateReports: weeklyReportRes.data.data?.lateReports || 0,
      };

      dispatch(setWeeklyStats(weeklyStats));

      // Set projects needing attention
      const projectsNeedingAttention: ProjectRequiringAttention[] = [
        {
          id: projectId,
          name: fullProject.name || "Project",
          variance,
          budgetUsage: budgetVariance,
          status: variance < -10 ? "CRITICAL" : variance < -5 ? "WATCHLIST" : "ON_TRACK",
          reason: [],
        },
      ];

      if (variance < -5) {
        projectsNeedingAttention[0].reason.push(
          `${Math.abs(variance).toFixed(1)}% behind schedule`
        );
      }
      if (budgetVariance > 85) {
        projectsNeedingAttention[0].reason.push(
          `${budgetVariance.toFixed(1)}% budget utilized`
        );
      }

      dispatch(setProjectsNeedingAttention(projectsNeedingAttention));
    } catch (err: any) {
      console.error("❌ Error loading dashboard:", err);
      dispatch(
        setError(err.response?.data?.message || "Failed to load dashboard")
      );
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ============ GET KPI DATA ============
export const getDashboardKPI = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get(`/projects/${projectId}/dashboard`);
      const dashboardData = res.data.data || {};

      const kpi: DashboardKPI = {
        activeProjects: 1,
        overallProgress: dashboardData.progress || 0,
        budgetUtilization: dashboardData.totalBudget
          ? (dashboardData.usedBudget / dashboardData.totalBudget) * 100
          : 0,
        delayedProjects: dashboardData.delayedCount || 0,
        highRiskProjects: dashboardData.highRiskCount || 0,
        forecastCompletion: dashboardData.forecastDate || "",
      };

      dispatch(setKPI(kpi));
      return kpi;
    } catch (err) {
      console.error("❌ Error fetching dashboard KPI:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ============ GET BUDGET DATA ============
export const getDashboardBudget = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get(`/projects/${projectId}/dashboard`);
      const dashboardData = res.data.data || {};

      const budgetData: BudgetData = {
        totalBudget: dashboardData.totalBudget || 0,
        usedBudget: dashboardData.usedBudget || 0,
        remainingBudget: dashboardData.remainingBudget || 0,
        budgetUtilization: dashboardData.totalBudget
          ? (dashboardData.usedBudget / dashboardData.totalBudget) * 100
          : 0,
      };

      dispatch(setBudgetData(budgetData));
      return budgetData;
    } catch (err) {
      console.error("❌ Error fetching budget data:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ============ GET DISCIPLINES ============
export const getDashboardDisciplines = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get(`/projects/${projectId}/full`);
      const fullProject = res.data.data || {};

      const disciplines: DisciplineProgress[] =
        fullProject.scopes?.map(
          (cat: any): DisciplineProgress => ({
            id: cat.id,
            name: cat.name,
            progress: cat.progress || 0,
            budgetAllocated: cat.budgetAllocated || 0,
            tasks: cat.tasks || 0,
            subtasks: cat.subtasks || 0,
          })
        ) || [];

      dispatch(setDisciplines(disciplines));
      return disciplines;
    } catch (err) {
      console.error("❌ Error fetching disciplines:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ============ GET WEEKLY REPORTS SUMMARY ============
export const getWeeklyReportsSummary = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get("/weekly-reports/summary");
      const data = res.data.data || {};

      const weeklyStats: WeeklyReportStats = {
        totalSubmitted: data.totalSubmitted || 0,
        totalPending: data.totalPending || 0,
        totalReviewed: data.totalReviewed || 0,
        lateReports: data.lateReports || 0,
      };

      dispatch(setWeeklyStats(weeklyStats));
      return weeklyStats;
    } catch (err) {
      console.error("❌ Error fetching weekly reports:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
