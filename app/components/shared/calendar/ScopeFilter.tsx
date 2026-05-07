"use client";

import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";

interface ScopeFilterProps {
  scopes: Array<{ id: string; name: string }>;
  selectedScopeId: string | null;
  onScopeChange: (scopeId: string | null) => void;
  loading?: boolean;
}

export default function ScopeFilter({
  scopes,
  selectedScopeId,
  onScopeChange,
  loading = false,
}: ScopeFilterProps) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CircularProgress size={20} />
        <span>Loading scopes...</span>
      </Box>
    );
  }

  return (
    <FormControl sx={{ minWidth: 200 }}>
      <InputLabel>Filter by Scope</InputLabel>
      <Select
        value={selectedScopeId || ""}
        label="Filter by Scope"
        onChange={(e) => onScopeChange(e.target.value || null)}
      >
        <MenuItem value="">
          <em>All Scopes</em>
        </MenuItem>
        {scopes.map((scope) => (
          <MenuItem key={scope.id} value={scope.id}>
            {scope.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
