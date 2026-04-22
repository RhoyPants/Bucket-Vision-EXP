import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import {
  setCategories,
  addCategory,
  updateCategoryLocal,
  deleteCategoryLocal,
} from "../slices/categorySlice";

// ✅ GET CATEGORIES BY PROJECT
export const getCategoriesByProject =
  (projectId: string) => async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.get(`/categories/project/${projectId}`);

      const categories = res.data || [];

      dispatch(setCategories(categories));

      return categories;
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      return [];
    }
  };

// ✅ GET SINGLE CATEGORY
export const getCategoryById = (categoryId: string) => {
  return async () => {
    try {
      const res = await axiosApi.get(`/categories/${categoryId}`);
      return res.data;
    } catch (err) {
      console.error("❌ Error fetching category:", err);
      throw err;
    }
  };
};

// ✅ CREATE CATEGORY
export const createCategory = (data: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.post("/categories", data);

      // optional local update (safe for future)
      dispatch(addCategory(res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error creating category:", err);
      throw err;
    }
  };
};

// ✅ UPDATE CATEGORY
export const updateCategory = (categoryId: string, data: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.put(`/categories/${categoryId}`, data);

      dispatch(updateCategoryLocal(res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error updating category:", err);
      throw err;
    }
  };
};

// ✅ DELETE CATEGORY
export const deleteCategory = (categoryId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      await axiosApi.delete(`/categories/${categoryId}`);

      dispatch(deleteCategoryLocal(categoryId));
    } catch (err) {
      console.error("❌ Error deleting category:", err);
      throw err;
    }
  };
};