import { Box, Button, TextField } from "@mui/material";

interface CategoryFormProps {
  categoryForm: { name: string; budgetAllocated: string };
  setCategoryForm: (form: { name: string; budgetAllocated: string }) => void;
  onAddCategory: () => void;
}

export default function CategoryForm({
  categoryForm,
  setCategoryForm,
  onAddCategory,
}: CategoryFormProps) {
  return (
    <Box display="flex" gap={2} mb={3}>
      <TextField
        label="Category"
        value={categoryForm.name}
        onChange={(e) =>
          setCategoryForm({ ...categoryForm, name: e.target.value })
        }
      />

      <TextField
        label="Budget"
        type="number"
        value={categoryForm.budgetAllocated}
        onChange={(e) =>
          setCategoryForm({
            ...categoryForm,
            budgetAllocated: e.target.value,
          })
        }
      />

      <Button variant="contained" onClick={onAddCategory}>
        + Category
      </Button>
    </Box>
  );
}
