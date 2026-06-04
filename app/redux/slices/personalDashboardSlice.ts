import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ChartData,
  PersonalDashboard,
  PersonalDashboardKpi,
  SourceOptions,
} from "@/app/api-service/personalDashboardService";

interface PersonalDashboardState {
  dashboards: PersonalDashboard[];
  selectedDashboard: PersonalDashboard | null;
  sourceOptions: SourceOptions | null;
  chartData: ChartData | null;
  loading: boolean;
  detailLoading: boolean;
  sourceLoading: boolean;
  chartLoading: boolean;
  error: string | null;
}

const initialState: PersonalDashboardState = {
  dashboards: [],
  selectedDashboard: null,
  sourceOptions: null,
  chartData: null,
  loading: false,
  detailLoading: false,
  sourceLoading: false,
  chartLoading: false,
  error: null,
};

const personalDashboardSlice = createSlice({
  name: "personalDashboard",
  initialState,
  reducers: {
    setDashboards(state, action: PayloadAction<PersonalDashboard[]>) {
      state.dashboards = action.payload;
      state.error = null;
    },
    setSelectedDashboard(state, action: PayloadAction<PersonalDashboard | null>) {
      state.selectedDashboard = action.payload;
      state.error = null;
    },
    addDashboardLocal(state, action: PayloadAction<PersonalDashboard>) {
      state.dashboards.unshift(action.payload);
      state.error = null;
    },
    updateDashboardLocal(state, action: PayloadAction<PersonalDashboard>) {
      const index = state.dashboards.findIndex((item) => item.id === action.payload.id);
      if (index >= 0) {
        state.dashboards[index] = { ...state.dashboards[index], ...action.payload };
      }
      if (state.selectedDashboard?.id === action.payload.id) {
        state.selectedDashboard = { ...state.selectedDashboard, ...action.payload };
      }
      state.error = null;
    },
    updateDashboardChartsLocal(
      state,
      action: PayloadAction<{ dashboardId: string; charts: PersonalDashboard["charts"] }>
    ) {
      const index = state.dashboards.findIndex((item) => item.id === action.payload.dashboardId);
      if (index >= 0) {
        state.dashboards[index].charts = action.payload.charts;
      }
      if (state.selectedDashboard?.id === action.payload.dashboardId) {
        state.selectedDashboard.charts = action.payload.charts;
      }
      state.error = null;
    },
    deleteDashboardLocal(state, action: PayloadAction<string>) {
      state.dashboards = state.dashboards.filter((item) => item.id !== action.payload);
      if (state.selectedDashboard?.id === action.payload) {
        state.selectedDashboard = null;
        state.chartData = null;
      }
      state.error = null;
    },
    upsertKpiLocal(state, action: PayloadAction<PersonalDashboardKpi>) {
      if (!state.selectedDashboard) return;
      const kpis = state.selectedDashboard.kpis ?? [];
      const index = kpis.findIndex((item) => item.id === action.payload.id);
      state.selectedDashboard.kpis =
        index >= 0
          ? kpis.map((item) => (item.id === action.payload.id ? { ...item, ...action.payload } : item))
          : [action.payload, ...kpis];
      state.error = null;
    },
    deleteKpiLocal(state, action: PayloadAction<string>) {
      if (!state.selectedDashboard) return;
      state.selectedDashboard.kpis = (state.selectedDashboard.kpis ?? []).filter(
        (item) => item.id !== action.payload
      );
      state.error = null;
    },
    setSourceOptions(state, action: PayloadAction<SourceOptions | null>) {
      state.sourceOptions = action.payload;
    },
    setChartData(state, action: PayloadAction<ChartData | null>) {
      state.chartData = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setDetailLoading(state, action: PayloadAction<boolean>) {
      state.detailLoading = action.payload;
    },
    setSourceLoading(state, action: PayloadAction<boolean>) {
      state.sourceLoading = action.payload;
    },
    setChartLoading(state, action: PayloadAction<boolean>) {
      state.chartLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setDashboards,
  setSelectedDashboard,
  addDashboardLocal,
  updateDashboardLocal,
  updateDashboardChartsLocal,
  deleteDashboardLocal,
  upsertKpiLocal,
  deleteKpiLocal,
  setSourceOptions,
  setChartData,
  setLoading,
  setDetailLoading,
  setSourceLoading,
  setChartLoading,
  setError,
  clearError,
} = personalDashboardSlice.actions;

export default personalDashboardSlice.reducer;
