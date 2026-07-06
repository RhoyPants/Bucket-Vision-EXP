"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Checkbox,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { getUsers } from "@/app/lib/user.api";
import { assignManager, getUserRelations } from "@/app/lib/userRelation.api";
import { usePermissions } from "@/app/lib/usePermissions";

type RelationUser = {
  id: string;
  name?: string;
};

type UserRelationModalProps = {
  open: boolean;
  onClose: () => void;
  user?: RelationUser | null;
  refresh: () => void;
};

export default function UserRelationModal({
  open,
  onClose,
  user,
  refresh,
}: UserRelationModalProps) {
  const [users, setUsers] = useState<RelationUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { canUpdate } = usePermissions();
  const canUpdateUsers = canUpdate("settings_users");

  // =========================
  // LOAD USERS (FILTERED)
  // =========================
  const fetchUsers = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [allUsers, relations] = await Promise.all([
        getUsers(),
        getUserRelations(user.id),
      ]);

      const assignedManagerIds = relations.managers.map((m: RelationUser) => m.id);

      // 🔥 FILTER:
      // - remove self
      // - remove already assigned managers
      const filtered = allUsers.filter(
        (u: RelationUser) =>
          u.id !== user.id && !assignedManagerIds.includes(u.id)
      );

      setUsers(filtered);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      fetchUsers();
    }
  }, [fetchUsers, open, user]);

  // =========================
  // TOGGLE SELECT
  // =========================
  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  // =========================
  // SAVE (BULK)
  // =========================
  const handleSave = async () => {
    if (!user || selectedIds.length === 0 || !canUpdateUsers) return;

    try {
      setLoading(true);

      // 🔥 PARALLEL CALL (FASTER)
      await Promise.all(
        selectedIds.map((managerId) =>
          assignManager({
            userId: user.id,
            managerId,
          })
        )
      );

      refresh();
      onClose();
    } catch (err) {
      console.error("Error assigning managers:", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // RESET STATE ON CLOSE
  // =========================
  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setUsers([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Assign Managers</DialogTitle>

      <DialogContent>
        <Typography mb={2}>Select Users</Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : users.length > 0 ? (
          users.map((u) => (
            <Box
              key={u.id}
              display="flex"
              alignItems="center"
              sx={{
                p: 1,
                borderRadius: 1,
                "&:hover": { bgcolor: "#f5f5f5" },
              }}
            >
              <Checkbox
                checked={selectedIds.includes(u.id)}
                onChange={() => toggle(u.id)}
              />
              <Typography>{u.name}</Typography>
            </Box>
          ))
        ) : (
          <Typography color="textSecondary">
            No available users to assign
          </Typography>
        )}

        {/* ACTIONS */}
        <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={selectedIds.length === 0 || loading || !canUpdateUsers}
          >
            Save
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
