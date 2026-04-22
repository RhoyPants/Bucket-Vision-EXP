"use client";

import { Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  currentCategoryId: string | null;
  onChange: (id: string) => void;
}

export default function CategorySelector({
  categories,
  currentCategoryId,
  onChange,
}: Props) {
  return (
    <Box sx={{ mt: 2, minWidth: 250 }}>
      <FormControl fullWidth size="small">
        <InputLabel>Category</InputLabel>

        <Select
          value={currentCategoryId || ""}
          label="Category"
          onChange={(e) => onChange(e.target.value)}
        >
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}