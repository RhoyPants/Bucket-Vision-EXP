import axiosApi from "@/app/lib/axios";
import { AppDispatch } from "../store";
import { setSCurve, setLoading } from "../slices/scurveSlice";

// ✅ GET S-CURVE
export const getSCurve = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get(
        `/progress/scurve/${projectId}`
      );

      const data = res.data.data || [];
      const status = res.data.status || "ON_TRACK";

      dispatch(
        setSCurve({
          projectId,
          data,
          status,
        })
      );

      return data;
    } catch (err) {
      console.error("❌ Error fetching S-curve:", err);
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  };
};