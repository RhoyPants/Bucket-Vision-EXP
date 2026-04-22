"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getSCurve } from "@/app/redux/controllers/scurveController";
import { RootState } from "@/app/redux/store";

export default function SCurveChart({ projectId }: any) {
  const dispatch = useDispatch<any>();

  const data =
    useSelector((state: RootState) => state.scurve.dataByProject[projectId]) ||
    [];

  const status =
    useSelector(
      (state: RootState) => state.scurve.statusByProject[projectId],
    ) || "ON_TRACK";

  const loading = useSelector((state: RootState) => state.scurve.loading);

  useEffect(() => {
    if (!projectId) return;
    dispatch(getSCurve(projectId));
  }, [projectId]);

  return (
    <div style={{ width: "100%", height: 400 }}>
      <h3
        style={{
          color:
            status === "DELAYED"
              ? "#E53935"
              : status === "AHEAD"
              ? "#8E24AA"
              : "#43A047",
        }}
      >
        S-Curve ({status})
      </h3>

      {loading && <p>Loading...</p>}

      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />

          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey="planned"
            stroke="#2196F3"
            strokeWidth={3}
            dot={false}
            name="Planned"
          />

          <Line
            type="monotone"
            dataKey="actual"
            stroke="#4CAF50"
            strokeWidth={3}
            dot={{ r: 3 }}
            name="Actual"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}