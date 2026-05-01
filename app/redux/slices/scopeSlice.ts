import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Scope {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  order?: number;

  budgetAllocated?: number;
  budgetPercent?: number;
}

interface ScopeState {
  scopes: Scope[];
  currentScopeId: string | null;
}

const initialState: ScopeState = {
  scopes: [],
  currentScopeId: null,
};

const scopeSlice = createSlice({
  name: "scope",
  initialState,
  reducers: {
    // ✅ SET ALL
    setScopes(state, action: PayloadAction<Scope[]>) {
      // Sort by order field (ascending)
      state.scopes = [...action.payload].sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });
    },

    // ✅ CURRENT
    setCurrentScope(state, action: PayloadAction<string>) {
      state.currentScopeId = action.payload;
    },

    // ✅ ADD
    addScope(state, action: PayloadAction<Scope>) {
      state.scopes.push(action.payload);
      // Sort by order field after adding
      state.scopes.sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });
    },

    // ✅ UPDATE
    updateScopeLocal(state, action: PayloadAction<Scope>) {
      const index = state.scopes.findIndex(
        (c) => c.id === action.payload.id
      );
      if (index !== -1) {
        state.scopes[index] = action.payload;
        // Sort after update to maintain order
        state.scopes.sort((a, b) => {
          const orderA = a.order ?? 0;
          const orderB = b.order ?? 0;
          return orderA - orderB;
        });
      }
    },

    // ✅ DELETE
    deleteScopeLocal(state, action: PayloadAction<string>) {
      state.scopes = state.scopes.filter(
        (c) => c.id !== action.payload
      );
    },

    // ✅ CLEAR
    clearScopes(state) {
      state.scopes = [];
      state.currentScopeId = null;
    },
  },
});

export const {
  setScopes,
  setCurrentScope,
  addScope,
  updateScopeLocal,
  deleteScopeLocal,
  clearScopes,
} = scopeSlice.actions;

export default scopeSlice.reducer;