import { AppDispatch } from "../store";
import {
  DashboardChartConfig,
  KpiThreshold,
  createDashboardKpi,
  createPersonalDashboard,
  deleteDashboardKpi,
  deletePersonalDashboard,
  getDashboardChartData,
  getKpiSourceOptions,
  getPersonalDashboardDetail,
  getPersonalDashboards,
  previewKpiSource,
  updateDashboardCharts,
  updateDashboardKpi,
  updatePersonalDashboard,
} from "@/app/api-service/personalDashboardService";
import {
  addDashboardLocal,
  clearError,
  deleteDashboardLocal,
  deleteKpiLocal,
  setChartData,
  setChartLoading,
  setDashboards,
  setDetailLoading,
  setError,
  setLoading,
  setSelectedDashboard,
  setSourceLoading,
  setSourceOptions,
  updateDashboardChartsLocal,
  updateDashboardLocal,
  upsertKpiLocal,
} from "../slices/personalDashboardSlice";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
};

export const fetchPersonalDashboards = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const response = await getPersonalDashboards();
      dispatch(setDashboards(response.data));

      return response.data;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, "Failed to fetch personal dashboards");
      dispatch(setError(errorMsg));
      console.error("Error fetching personal dashboards:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchPersonalDashboardDetail = (id: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setDetailLoading(true));
      dispatch(clearError());

      const dashboard = await getPersonalDashboardDetail(id);
      dispatch(setSelectedDashboard(dashboard));

      return dashboard;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, "Failed to fetch dashboard detail");
      dispatch(setError(errorMsg));
      console.error("Error fetching dashboard detail:", err);
      throw err;
    } finally {
      dispatch(setDetailLoading(false));
    }
  };
};

export const createDashboard = (data: {
  name: string;
  description?: string;
  projectId: string;
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const dashboard = await createPersonalDashboard(data);
      dispatch(addDashboardLocal(dashboard));

      return dashboard;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, "Failed to create dashboard");
      dispatch(setError(errorMsg));
      console.error("Error creating dashboard:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateDashboard = (id: string, data: { name: string; description?: string }) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const dashboard = await updatePersonalDashboard(id, data);
      dispatch(updateDashboardLocal(dashboard));

      return dashboard;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, "Failed to update dashboard");
      dispatch(setError(errorMsg));
      console.error("Error updating dashboard:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const removeDashboard = (id: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      await deletePersonalDashboard(id);
      dispatch(deleteDashboardLocal(id));

      return true;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, "Failed to delete dashboard");
      dispatch(setError(errorMsg));
      console.error("Error deleting dashboard:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchKpiSourceOptions = (dashboardId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setSourceLoading(true));
      dispatch(clearError());

      const sourceOptions = await getKpiSourceOptions(dashboardId);
      dispatch(setSourceOptions(sourceOptions));

      return sourceOptions;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, "Failed to fetch KPI source options");
      dispatch(setError(errorMsg));
      console.error("Error fetching KPI source options:", err);
      throw err;
    } finally {
      dispatch(setSourceLoading(false));
    }
  };
};

export const fetchKpiSourcePreview = (
  dashboardId: string,
  params: { scopeId?: string; taskId?: string; subtaskId?: string }
) => {
  return async () => previewKpiSource(dashboardId, params);
};

export const createKpi = (
  dashboardId: string,
  data: {
    name: string;
    description?: string;
    scopeId?: string;
    taskId?: string;
    subtaskId?: string;
    thresholds: KpiThreshold[];
  }
) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setDetailLoading(true));
      dispatch(clearError());

      const kpi = await createDashboardKpi(dashboardId, data);
      dispatch(upsertKpiLocal(kpi));

      return kpi;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, "Failed to create KPI");
      dispatch(setError(errorMsg));
      console.error("Error creating KPI:", err);
      throw err;
    } finally {
      dispatch(setDetailLoading(false));
    }
  };
};

export const updateKpi = (
  dashboardId: string,
  kpiId: string,
  data: {
    name: string;
    description?: string;
    thresholds: KpiThreshold[];
  }
) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setDetailLoading(true));
      dispatch(clearError());

      const kpi = await updateDashboardKpi(dashboardId, kpiId, data);
      dispatch(upsertKpiLocal(kpi));

      return kpi;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, "Failed to update KPI");
      dispatch(setError(errorMsg));
      console.error("Error updating KPI:", err);
      throw err;
    } finally {
      dispatch(setDetailLoading(false));
    }
  };
};

export const removeKpi = (dashboardId: string, kpiId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setDetailLoading(true));
      dispatch(clearError());

      await deleteDashboardKpi(dashboardId, kpiId);
      dispatch(deleteKpiLocal(kpiId));

      return true;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, "Failed to delete KPI");
      dispatch(setError(errorMsg));
      console.error("Error deleting KPI:", err);
      throw err;
    } finally {
      dispatch(setDetailLoading(false));
    }
  };
};

export const saveDashboardCharts = (dashboardId: string, charts: DashboardChartConfig[]) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setChartLoading(true));
      dispatch(clearError());

      const response = await updateDashboardCharts(dashboardId, charts);
      dispatch(updateDashboardChartsLocal({ dashboardId, charts: response.charts }));

      return response;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, "Failed to update dashboard charts");
      dispatch(setError(errorMsg));
      console.error("Error updating dashboard charts:", err);
      throw err;
    } finally {
      dispatch(setChartLoading(false));
    }
  };
};

export const fetchDashboardChartData = (dashboardId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setChartLoading(true));

      const chartData = await getDashboardChartData(dashboardId);
      dispatch(setChartData(chartData));

      return chartData;
    } catch (err: unknown) {
      dispatch(setChartData(null));
      console.error("Error fetching dashboard chart data:", err);
      return null;
    } finally {
      dispatch(setChartLoading(false));
    }
  };
};
