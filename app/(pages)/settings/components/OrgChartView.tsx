"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Avatar, CircularProgress } from "@mui/material";
import { getOrgChart } from "@/app/lib/userRelation.api";

type OrgNode = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type OrgData = {
  id: string;
  name: string;
  email: string;
  role?: string;
  managers: OrgNode[];
  members: OrgNode[];
};

export default function OrgChartView({ userId }: { userId: string }) {
  const [data, setData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusId, setFocusId] = useState(userId);

  // 🔥 SYNC SIDEBAR CLICK
  useEffect(() => {
    setFocusId(userId);
  }, [userId]);

  // 🔥 LOAD DATA
  useEffect(() => {
    if (!focusId) return;

    const load = async () => {
      try {
        setLoading(true);
        setData(null);

        const res = await getOrgChart(focusId);
        setData(res);
      } catch (err) {
        console.error("Org chart error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [focusId]);

  // =========================
  // CARD
  // =========================
  const Card = ({
    user,
    highlight = false,
  }: {
    user: OrgNode;
    highlight?: boolean;
  }) => (
    <Box
      onClick={() => setFocusId(user.id)}
      sx={{
        cursor: "pointer",
        border: highlight ? "3px solid #1976d2" : "1px solid #ccc",
        borderRadius: 2,
        p: 2,
        minWidth: 180,
        textAlign: "center",
        bgcolor: highlight ? "#e3f2fd" : "#fff",
        boxShadow: highlight ? 4 : 1,
        transition: "0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 3,
        },
      }}
    >
      <Avatar sx={{ mx: "auto", mb: 1 }}>
        {user.name?.[0]}
      </Avatar>

      <Typography fontWeight={600}>{user.name}</Typography>
      <Typography fontSize={12}>{user.email}</Typography>

      {user.role && (
        <Typography fontSize={11} color="gray">
          {user.role}
        </Typography>
      )}
    </Box>
  );

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography>No org chart data</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      
      {/* ========================= */}
      {/* MANAGERS */}
      {/* ========================= */}
      {data.managers?.length > 0 && (
        <>
          <Box display="flex" gap={4}>
            {data.managers.map((m) => (
              <Card key={m.id} user={m} />
            ))}
          </Box>

          {/* Horizontal */}
          {data.managers.length > 1 && (
            <Box
              sx={{
                height: 2,
                width: `${data.managers.length * 200}px`,
                bgcolor: "#1976d2",
                mt: 2,
              }}
            />
          )}

          {/* Vertical */}
          <Box sx={{ width: 2, height: 30, bgcolor: "#1976d2" }} />
        </>
      )}

      {/* ========================= */}
      {/* CURRENT USER */}
      {/* ========================= */}
      <Card user={data} highlight />

      {/* ========================= */}
      {/* MEMBERS */}
      {/* ========================= */}
      {data.members?.length > 0 && (
        <>
          {/* Vertical from current */}
          <Box sx={{ width: 2, height: 30, bgcolor: "#1976d2" }} />

          {/* Horizontal line */}
          <Box
            sx={{
              position: "relative",
              height: 2,
              width: `${data.members.length * 200}px`,
              bgcolor: "#1976d2",
            }}
          />

          {/* MEMBERS WITH CONNECTORS */}
          <Box display="flex" gap={4} mt={2}>
            {data.members.map((m) => (
              <Box
                key={m.id}
                display="flex"
                flexDirection="column"
                alignItems="center"
              >
                {/* 🔥 vertical drop (THIS IS YOUR MISSING LINE) */}
                <Box
                  sx={{
                    width: 2,
                    height: 20,
                    bgcolor: "#1976d2",
                  }}
                />

                <Card user={m} />
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}