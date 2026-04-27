import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Category {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  order?: number;

  budgetAllocated?: number;
  budgetPercent?: number;
}

interface CategoryState {
  categories: Category[];
  currentCategoryId: string | null;
}

const initialState: CategoryState = {
  categories: [],
  currentCategoryId: null,
};

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    // ✅ SET ALL
    setCategories(state, action: PayloadAction<Category[]>) {
      // Sort by order field (ascending)
      state.categories = [...action.payload].sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });
    },

    // ✅ CURRENT
    setCurrentCategory(state, action: PayloadAction<string>) {
      state.currentCategoryId = action.payload;
    },

    // ✅ ADD
    addCategory(state, action: PayloadAction<Category>) {
      state.categories.push(action.payload);
      // Sort by order field after adding
      state.categories.sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });
    },

    // ✅ UPDATE
    updateCategoryLocal(state, action: PayloadAction<Category>) {
      const index = state.categories.findIndex(
        (c) => c.id === action.payload.id
      );
      if (index !== -1) {
        state.categories[index] = action.payload;
        // Sort after update to maintain order
        state.categories.sort((a, b) => {
          const orderA = a.order ?? 0;
          const orderB = b.order ?? 0;
          return orderA - orderB;
        });
      }
    },

    // ✅ DELETE
    deleteCategoryLocal(state, action: PayloadAction<string>) {
      state.categories = state.categories.filter(
        (c) => c.id !== action.payload
      );
    },

    // ✅ CLEAR
    clearCategories(state) {
      state.categories = [];
      state.currentCategoryId = null;
    },
  },
});

export const {
  setCategories,
  setCurrentCategory,
  addCategory,
  updateCategoryLocal,
  deleteCategoryLocal,
  clearCategories,
} = categorySlice.actions;

export default categorySlice.reducer;