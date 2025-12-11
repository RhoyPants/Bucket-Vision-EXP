import { Box } from "@mui/material";
import StatCard from "./StatCard";

/**
 * We use CSS grid here through sx to produce 5 equal columns on md+
 * This mirrors the mockup: compact spacing, evenly distributed stat cards.
 */
export default function OverviewStats() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr", // mobile
          sm: "repeat(2, 1fr)",
          md: "repeat(5, 1fr)", // five equal columns for desktop
        },
        gap: 2,
        mb: 2,
        alignItems: "start",
        p: 2,
        borderRadius: 2.5,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 6px 18px rgba(15, 15, 15, 0.03)",
        backgroundColor: "#fff",
      }}
    >
      <StatCard title="Total Members" value={6} />
      <StatCard title="Departments Involved" value={5} />
      <StatCard title="Active Projects" value={4} />
      <StatCard title="Tasks in Progress" value={18} />
      <StatCard title="Team Lead" value="John Smith" />
    </Box>
  );
}
