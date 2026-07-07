import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface BusinessUnit {
  id: string;
  code: string;
  name: string;
  entity: string;
  buHead: string | null;
  buHeadUserId?: string | null;
  assistantHead: string | null;
  assistantHeadUserId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface BusinessUnitState {
  businessUnits: BusinessUnit[];
  selectedBusinessUnit: BusinessUnit | null;
  loading: boolean;
  error: string | null;
}

const initialState: BusinessUnitState = {
  businessUnits: [],
  selectedBusinessUnit: null,
  loading: false,
  error: null,
};

const businessUnitSlice = createSlice({
  name: "businessUnit",
  initialState,
  reducers: {
    // ✅ SET ALL BUSINESS UNITS
    setBusinessUnits(state, action: PayloadAction<BusinessUnit[]>) {
      state.businessUnits = action.payload;
      state.error = null;
    },

    // ✅ SET SELECTED BUSINESS UNIT
    setSelectedBusinessUnit(state, action: PayloadAction<BusinessUnit | null>) {
      state.selectedBusinessUnit = action.payload;
    },

    // ✅ ADD BUSINESS UNIT
    addBusinessUnit(state, action: PayloadAction<BusinessUnit>) {
      state.businessUnits.push(action.payload);
      state.error = null;
    },

    // ✅ UPDATE BUSINESS UNIT
    updateBusinessUnitLocal(state, action: PayloadAction<BusinessUnit>) {
      const index = state.businessUnits.findIndex((bu) => bu.id === action.payload.id);
      if (index >= 0) {
        state.businessUnits[index] = action.payload;
      }
      state.error = null;
    },

    // ✅ DELETE BUSINESS UNIT
    deleteBusinessUnitLocal(state, action: PayloadAction<string>) {
      state.businessUnits = state.businessUnits.filter((bu) => bu.id !== action.payload);
      state.error = null;
    },

    // ✅ LOADING
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    // ✅ ERROR
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    // ✅ CLEAR ERROR
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setBusinessUnits,
  setSelectedBusinessUnit,
  addBusinessUnit,
  updateBusinessUnitLocal,
  deleteBusinessUnitLocal,
  setLoading,
  setError,
  clearError,
} = businessUnitSlice.actions;

export default businessUnitSlice.reducer;
