import { Box, TextField } from "@mui/material";
import { TimelineFilterProps } from "../types";

export default function TimelineFilter({ filter, setFilter }: TimelineFilterProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        label="Search by Project ID"
        variant="outlined"
        size="small"
        fullWidth
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
    </Box>
  );
}
