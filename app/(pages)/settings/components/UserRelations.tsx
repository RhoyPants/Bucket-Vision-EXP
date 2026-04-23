"use client";

import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getUsers } from "@/app/lib/user.api";
import { getUserRelations, removeRelation } from "@/app/lib/userRelation.api";
import UserRelationModal from "@/app/components/shared/modals/UserRelationModal";
import OrgChartView from "./OrgChartView";

export default function UserRelations() {
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [relations, setRelations] = useState<any>({
    managers: [],
    members: [],
  });

  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // LOAD USERS
  // =========================
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError(null);
      const res = await getUsers();
      setUsers(res);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    }
  };

  // =========================
  // LOAD RELATIONS (AUTO WHEN SELECT CHANGES)
  // =========================
  useEffect(() => {
    if (!selected?.id) return;

    loadRelations(selected.id);
  }, [selected]);

  const loadRelations = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // 🔥 CLEAR OLD DATA (VERY IMPORTANT)
      setRelations({ managers: [], members: [] });

      const res = await getUserRelations(userId);

      setRelations({
        managers: res.managers || [],
        members: res.members || [],
      });
    } catch (err) {
      setError("Failed to load relations");
      console.error(err);
      setRelations({ managers: [], members: [] });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SELECT USER
  // =========================
  const handleSelectUser = (user: any) => {
    if (selected?.id === user.id) return; // prevent duplicate click
    setSelected(user);
  };

  // =========================
  // REMOVE MANAGER
  // =========================
  const handleRemove = async (managerId: string) => {
    if (!selected) return;

    try {
      setError(null);

      await removeRelation({
        userId: selected.id,
        managerId,
      });

      loadRelations(selected.id);
    } catch (err) {
      setError("Failed to remove relation");
      console.error(err);
    }
  };

  // =========================
  // REFRESH
  // =========================
  const handleRefresh = () => {
    if (selected) {
      loadRelations(selected.id);
    }
  };

  return (
    <Box display="flex" height="100%" gap={2}>
      {/* ========================= */}
      {/* LEFT USERS PANEL */}
      {/* ========================= */}
      <Paper sx={{ width: 260, p: 2, overflowY: "auto" }}>
        <Typography fontWeight={600} mb={1}>
          Users
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {users.map((u) => (
          <Box
            key={u.id}
            p={1.5}
            sx={{
              cursor: "pointer",
              borderRadius: 1,
              bgcolor: selected?.id === u.id ? "#e3f2fd" : "transparent",
              border:
                selected?.id === u.id
                  ? "1px solid #1976d2"
                  : "1px solid transparent",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: "#f5f5f5",
              },
            }}
            onClick={() => handleSelectUser(u)}
          >
            <Typography fontSize={14}>{u.name}</Typography>
            <Typography fontSize={12} color="textSecondary">
              {u.email}
            </Typography>
          </Box>
        ))}
      </Paper>

      {/* ========================= */}
      {/* RIGHT DETAIL PANEL */}
      {/* ========================= */}
      <Box flex={1} display="flex" flexDirection="column">
        {selected ? (
          <Paper sx={{ p: 3, flex: 1, overflow: "auto" }}>
            {/* HEADER */}
            <Box mb={3}>
              <Typography variant="h6" fontWeight={600}>
                {selected.name}
              </Typography>
              <Typography fontSize={12} color="textSecondary">
                {selected.email}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* TABS */}
            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
              <Tab label="Relations" />
              <Tab label="Organization Chart" />
            </Tabs>

            {/* ========================= */}
            {/* RELATIONS TAB */}
            {/* ========================= */}
            {tab === 0 && (
              <>
                {loading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {/* MANAGERS */}
                    <Box mb={4}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Typography fontWeight={600}>
                          Managers ({relations.managers.length})
                        </Typography>

                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => setOpen(true)}
                        >
                          + Assign Manager
                        </Button>
                      </Box>

                      <Divider sx={{ mb: 2 }} />

                      <Box display="flex" gap={1} flexWrap="wrap">
                        {relations.managers.length > 0 ? (
                          relations.managers.map((m: any) => (
                            <Chip
                              key={m.id}
                              label={m.name}
                              onDelete={() => handleRemove(m.id)}
                              color="primary"
                              variant="outlined"
                            />
                          ))
                        ) : (
                          <Typography fontSize={13} color="textSecondary">
                            No managers assigned
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* MEMBERS */}
                    <Box>
                      <Typography fontWeight={600} mb={2}>
                        Team Members ({relations.members.length})
                      </Typography>

                      <Divider sx={{ mb: 2 }} />

                      <Box display="flex" gap={1} flexWrap="wrap">
                        {relations.members.length > 0 ? (
                          relations.members.map((m: any) => (
                            <Chip
                              key={m.id}
                              label={m.name}
                              variant="outlined"
                            />
                          ))
                        ) : (
                          <Typography fontSize={13} color="textSecondary">
                            No team members
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </>
                )}
              </>
            )}

            {/* ========================= */}
            {/* ORG CHART TAB */}
            {/* ========================= */}
            {tab === 1 && (
              <Box
                sx={{
                  borderRadius: 1,
                  border: "1px solid #eee",
                  p: 2,
                  bgcolor: "#fafafa",
                  overflowX: "auto",
                }}
              >
                <OrgChartView userId={selected.id} />
              </Box>
            )}
          </Paper>
        ) : (
          <Paper
            sx={{
              p: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="textSecondary">
              Select a user to view relations
            </Typography>
          </Paper>
        )}
      </Box>

      {/* ========================= */}
      {/* MODAL */}
      {/* ========================= */}
      <UserRelationModal
        open={open}
        onClose={() => setOpen(false)}
        user={selected}
        refresh={handleRefresh}
      />
    </Box>
  );
}