"use client";

import {
  Autocomplete,
  TextField,
  Avatar,
  Box,
  Typography,
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
};

export default function AssignUsersSelect({
  value = [],
  onChange,
  members = [],
}: Props) {
  // =========================
  // 🔥 CLEAN + SAFE OPTIONS
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
          >
            <Avatar>{option?.name?.[0]}</Avatar>

            <Box>
              <Typography fontSize={14}>{option.name}</Typography>

              <Typography fontSize={11} color="gray">
                {option?.role?.name || "No role"}
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
          placeholder="Select members"
        />
      )}
    />
  );
}
