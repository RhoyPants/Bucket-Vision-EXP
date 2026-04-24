"use client";

import {
  Autocomplete,
  TextField,
  Avatar,
  Box,
  Typography,
  Alert,
} from "@mui/material";

type User = {
  id: string;
  name: string;
  role?: {
    name?: string;
  };
};

type Props = {
  value: User[];
  onChange: (val: User[]) => void;
  members: User[];
  projectId?: string;
};

export default function AssignUsersSelect({
  value = [],
  onChange,
  members = [],
  projectId,
}: Props) {
  // =========================
  // 🔥 CLEAN + SAFE OPTIONS (from project team only)
  // =========================
  const uniqueMembers = members
    .filter((m) => m && m.id) // remove invalid
    .filter(
      (member, index, self) =>
        index === self.findIndex((m) => m.id === member.id),
    );

  const uniqueValue = value
    .filter((m) => m && m.id)
    .filter(
      (member, index, self) =>
        index === self.findIndex((m) => m.id === member.id),
    );

  // 🔥 EMPTY STATE CHECK
  if (uniqueMembers.length === 0) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 1 }}>
        <Typography fontSize={12} fontWeight={500}>
          ⚠️ No team members assigned to this project
        </Typography>
        <Typography fontSize={11} color="textSecondary" sx={{ mt: 0.5 }}>
          Please complete project team management first to assign members to subtasks.
        </Typography>
      </Alert>
    );
  }

  return (
    <Autocomplete
      multiple
      options={uniqueMembers}
      value={uniqueValue}
      onChange={(e, newValue) => onChange(newValue)}
      // 🔥 IMPORTANT
      filterSelectedOptions
      getOptionLabel={(option) => option?.name || ""}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      // =========================
      // 🔥 FIX KEY WARNING (CORRECT WAY)
      // =========================
      renderOption={(props, option) => {
        const { key, ...rest } = props;

        return (
          <Box
            component="li"
            key={key} // ✅ USE MUI KEY
            {...rest}
            display="flex"
            gap={1}
            alignItems="center"
            sx={{
              p: "8px 10px",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "#f0f4ff",
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 13,
                fontWeight: 600,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              {option?.name?.[0]?.toUpperCase()}
            </Avatar>

            <Box>
              <Typography fontSize={13} fontWeight={500}>
                {option.name}
              </Typography>

              <Typography fontSize={11} color="textSecondary">
                {option?.role?.name || "Team Member"}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label="Assign Users"
          placeholder="Select team members"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: "0 2px 8px rgba(102, 126, 234, 0.15)",
              },
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
  );
}
