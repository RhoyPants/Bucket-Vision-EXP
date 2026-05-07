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
  Checkbox,
} from "@mui/material";
import EmojiPeopleOutlinedIcon from "@mui/icons-material/EmojiPeopleOutlined";
import CheckIcon from "@mui/icons-material/Check";
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
  onSelectionChange?: (users: User[]) => void;
  members: User[];
  assignedUsers?: any[];
  excludedUserIds?: string[];
  loading?: boolean;
};

export default function AssignSubOwnerSelect({
  onSelectMultiple,
  onSelectionChange,
  members = [],
  assignedUsers = [],
  excludedUserIds = [],
  loading = false,
}: Props) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [inputValue, setInputValue] = useState("");

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === leaders.length) {
      setSelectedUsers([]);
      onSelectionChange?.([]);
    } else {
      setSelectedUsers(leaders);
      onSelectionChange?.(leaders);
    }
  };

  // ✅ normalize assigned users
  const assignedIds = useMemo(() => {
    return new Set(
      assignedUsers.map((u) => u?.userId || u?.user?.id || u?.id)
    );
  }, [assignedUsers]);

  const isLeader = (m: User) =>
    m?.role?.name?.toLowerCase() === "leader" ||
    m?.role?.id?.toLowerCase() === "leader";

  // ✅ Filter: only leaders, not already assigned as MEMBER, not already selected, not pending as member
  const leaders = useMemo(() => {
    const selectedIds = new Set(selectedUsers.map((u) => u.id));
    const excludedIds = new Set(excludedUserIds);
    // Get all users assigned as MEMBER (not SUB_OWNER)
    const memberAssignedIds = new Set(
      assignedUsers
        .filter((u) => u?.projectRole === "MEMBER")
        .map((u) => u?.userId || u?.user?.id || u?.id)
    );
    const filtered = members
      .filter((m) => m && m.id)
      .filter((m) => isLeader(m))
      .filter((m) => !assignedIds.has(m.id)) // Not already assigned at all
      .filter((m) => !memberAssignedIds.has(m.id)) // Not assigned as MEMBER
      .filter((m) => !selectedIds.has(m.id))
      .filter((m) => !excludedIds.has(m.id)) // Not pending as member in MemberSelect
      .filter((m, i, self) => i === self.findIndex((x) => x.id === m.id));
    return filtered;
  }, [members, assignedIds, assignedUsers, selectedUsers, excludedUserIds]);

  const handleAddSelected = () => {
    if (selectedUsers.length > 0) {
      onSelectMultiple(selectedUsers);
      setSelectedUsers([]);
      setInputValue("");
    }
  };

  const handleRemoveFromSelected = (userId: string) => {
    const updated = selectedUsers.filter((u) => u.id !== userId);
    setSelectedUsers(updated);
    onSelectionChange?.(updated);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2} flex={1} minWidth={250}>
      <Autocomplete
        multiple
        options={leaders}
        value={selectedUsers}
        onChange={(e, newValue) => {
          setSelectedUsers(newValue);
          onSelectionChange?.(newValue);
        }}
        inputValue={inputValue}
        onInputChange={(e, newInputValue) => {
          setInputValue(newInputValue);
        }}
        getOptionLabel={(option) => option?.name || ""}
        isOptionEqualToValue={(o, v) => o.id === v.id}
        noOptionsText={loading ? "Loading..." : "No available leaders"}
        loading={loading}
        disableCloseOnSelect
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
          const isSelected = selectedUsers.some((u) => u.id === option.id);

          return (
            <Box
              component="li"
              key={key}
              {...rest}
              sx={{
                p: "8px 10px !important",
                transition: "all 0.2s ease",
                backgroundColor: isSelected ? "rgba(102, 126, 234, 0.08)" : "transparent",
                "&:hover": {
                  bgcolor: "#f0f4ff",
                },
              }}
            >
              <Checkbox
                checked={isSelected}
                size="small"
                sx={{
                  mr: 1,
                  color: "#667eea",
                  "&.Mui-checked": {
                    color: "#667eea",
                  },
                }}
              />
              <Box display="flex" gap={1.2} alignItems="center" flex={1}>
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

                {isSelected && (
                  <CheckIcon
                    sx={{
                      fontSize: 18,
                      color: "#667eea",
                      fontWeight: 700,
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
            helperText={selectedUsers.length > 0 ? `${selectedUsers.length} selected` : ""}
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
        ListboxProps={{
          sx: {
            p: 0,
          },
        }}
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

      {/* SELECT ALL BUTTON */}
      {leaders.length > 0 && (
        <Button
          size="small"
          onClick={handleSelectAll}
          variant="outlined"
          sx={{
            textTransform: "none",
            fontSize: 12,
            color: selectedUsers.length === leaders.length ? "#667eea" : "#6b7280",
            borderColor: selectedUsers.length === leaders.length ? "#667eea" : "#d1d5db",
            "&:hover": {
              borderColor: "#667eea",
              bgcolor: "rgba(102, 126, 234, 0.05)",
            },
          }}
        >
          {selectedUsers.length === leaders.length ? "Deselect All" : "Select All"}
        </Button>
      )}

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