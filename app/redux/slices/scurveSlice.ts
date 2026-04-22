import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SCurvePoint {
  date: string;
  planned: number;
  actual: number;
}

interface SCurveState {
  dataByProject: Record<string, SCurvePoint[]>;
  statusByProject: Record<string, string>;
  loading: boolean;
}

const initialState: SCurveState = {
  dataByProject: {},
  statusByProject: {},
  loading: false,
};

const scurveSlice = createSlice({
  name: "scurve",
  initialState,
  reducers: {
    setSCurve(
      state,
      action: PayloadAction<{
        projectId: string;
        data: SCurvePoint[];
        status: string;
      }>
    ) {
      // 🔥 FORCE NEW REFERENCE
      state.dataByProject[action.payload.projectId] = [
        ...action.payload.data,
      ];

      // 🔥 SAFE STRING
      state.statusByProject[action.payload.projectId] =
        `${action.payload.status}`;
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    clearSCurve(state, action: PayloadAction<string>) {
      delete state.dataByProject[action.payload];
      delete state.statusByProject[action.payload];
    },
  },
});

export const { setSCurve, setLoading, clearSCurve } =
  scurveSlice.actions;

export default scurveSlice.reducer;