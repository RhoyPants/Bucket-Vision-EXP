"use client";

import {
  Autocomplete,
  TextField,
  Avatar,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Button,
} from "@mui/material";
import EmojiPeopleOutlinedIcon from "@mui/icons-material/EmojiPeopleOutlined";
import { useState, useMemo } from "react";

type User = {
  id: string;
  name: string;
  email?: string;
  role?: {
    id?: string;
    name?: string;
  };
};

type Props = {
  onSelectMultiple: (users: User[]) => void;
  members: User[];
  assignedUsers?: any[];
  loading?: boolean;
};

export default function AssignSubOwnerSelect({
  onSelectMultiple,
  members = [],
  assignedUsers = [],
  loading = false,
}: Props) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [inputValue, setInputValue] = useState("");

  // ✅ normalize assigned users
  const assignedIds = useMemo(() => {
    return new Set(
      assignedUsers.map((u) => u?.userId || u?.user?.id || u?.id)
    );
  }, [assignedUsers]);

  const isLeader = (m: User) =>
    m?.role?.name?.toLowerCase() === "leader" ||
    m?.role?.id?.toLowerCase() === "leader";

  // ✅ Filter: only leaders, not already assigned as MEMBER, not already selected
  const leaders = useMemo(() => {
    const selectedIds = new Set(selectedUsers.map((u) => u.id));
    // Get all users assigned as MEMBER (not SUB_OWNER)
    const memberAssignedIds = new Set(
      assignedUsers
        .filter((u) => u?.projectRole === "MEMBER")
        .map((u) => u?.userId || u?.user?.id || u?.id)
    );
    return members
      .filter((m) => m && m.id)
      .filter((m) => isLeader(m))
      .filter((m) => !assignedIds.has(m.id)) // Not already assigned at all
      .filter((m) => !memberAssignedIds.has(m.id)) // Not assigned as MEMBER
      .filter((m) => !selectedIds.has(m.id))
      .filter((m, i, self) => i === self.findIndex((x) => x.id === m.id));
  }, [members, assignedIds, assignedUsers, selectedUsers]);

  const handleAddSelected = () => {
    if (selectedUsers.length > 0) {
      onSelectMultiple(selectedUsers);
      setSelectedUsers([]);
      setInputValue("");
    }
  };

  const handleRemoveFromSelected = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <Box display="flex" flexDirection="column" gap={2} flex={1} minWidth={250}>
      <Autocomplete
        multiple
        options={leaders}
        value={selectedUsers}
        onChange={(e, newValue) => {
          setSelectedUsers(newValue);
        }}
        inputValue={inputValue}
        onInputChange={(e, newInputValue) => {
          setInputValue(newInputValue);
        }}
        getOptionLabel={(option) => option?.name || ""}
        isOptionEqualToValue={(o, v) => o.id === v.id}
        noOptionsText={loading ? "Loading..." : "No available leaders"}
        loading={loading}
        sx={{
          flex: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: "0 2px 8px rgba(102, 126, 234, 0.15)",
            },
            "&.Mui-focused": {
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.25)",
            },
          },
        }}
        renderOption={(props, option) => {
          const { key, ...rest } = props;

          return (
            <Box
              component="li"
              key={key}
              {...rest}
              sx={{
                p: "8px 10px",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "#f0f4ff",
                },
              }}
            >
              <Box display="flex" gap={1.2} alignItems="center" width="100%">
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 14,
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  {option?.name?.[0]?.toUpperCase()}
                </Avatar>

                <Box flex={1} minWidth={0}>
                  <Typography fontSize={13} fontWeight={500} noWrap>
                    {option.name}
                  </Typography>
                  <Typography fontSize={11} color="textSecondary" noWrap>
                    {option?.email || "Team Leader"}
                  </Typography>
                </Box>

                {assignedIds.has(option.id) && (
                  <Chip
                    label="Added"
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: 11,
                      bgcolor: "#dbeafe",
                      color: "#0284c7",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="Select Sub Owners..."
            label="Add Sub Owners"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <Box
                  component="span"
                  sx={{
                    mr: 1,
                    display: "flex",
                    alignItems: "center",
                    color: "#667eea",
                  }}
                >
                  <EmojiPeopleOutlinedIcon fontSize="small" />
                </Box>
              ),
              endAdornment: (
                <Box component="span">
                  {loading && <CircularProgress color="inherit" size={20} />}
                  {params.InputProps.endAdornment}
                </Box>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              },
            }}
          />
        )}
        componentsProps={{
          paper: {
            sx: {
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              mt: 1,
            },
          },
        }}
      />

      {/* SELECTED CHIPS */}
      {selectedUsers.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap={1}>
          {selectedUsers.map((user) => (
            <Chip
              key={user.id}
              avatar={
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  {user.name?.[0]?.toUpperCase()}
                </Avatar>
              }
              label={user.name}
              onDelete={() => handleRemoveFromSelected(user.id)}
              sx={{
                bgcolor: "#fef3c7",
                color: "#d97706",
                fontWeight: 500,
                "& .MuiChip-deleteIcon": {
                  color: "#d97706",
                  "&:hover": {
                    color: "#ea580c",
                  },
                },
              }}
            />
          ))}
        </Box>
      )}

      {/* ADD BUTTON */}
      {selectedUsers.length > 0 && (
        <Button
          variant="contained"
          onClick={handleAddSelected}
          disabled={loading || selectedUsers.length === 0}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            textTransform: "none",
            fontWeight: 600,
            fontSize: 14,
            py: 1.2,
            borderRadius: "8px",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)",
            },
          }}
        >
          Add {selectedUsers.length} Sub Owner{selectedUsers.length > 1 ? "s" : ""}
        </Button>
      )}
    </Box>
  );
}